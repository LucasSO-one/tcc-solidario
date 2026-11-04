using Microsoft.EntityFrameworkCore;
using TccSolidario.Api.DTOs.Conta;
using TccSolidario.Api.Exceptions;
using TccSolidario.Api.Models;
using TccSolidario.Api.Models.Enums;
namespace TccSolidario.Api.Services;

public partial class ContaService
{
    public async Task ExcluirAsync(Guid usuarioId, ExcluirContaRequest request)
    {
        await using var operacao = await OperacaoConta.IniciarAsync(context);
        var usuario = await Carregar(usuarioId);
        if (string.IsNullOrEmpty(request.SenhaAtual) || !BCrypt.Net.BCrypt.Verify(request.SenhaAtual, usuario.SenhaHash))
            throw new ValidacaoException(new Dictionary<string, string> { ["senhaAtual"] = "A senha atual está incorreta." });
        if (request.Confirmacao != "EXCLUIR")
            throw new InvalidOperationException("Digite EXCLUIR para confirmar a exclusão da conta.");
        if (usuario is Admin && !await context.Admins.AnyAsync(u => u.Id != usuarioId && u.StatusAprovacao == StatusAprovacao.Aprovado))
            throw new ConflictException("Outro administrador aprovado precisa existir antes de excluir esta conta.");

        var agora = DateTime.UtcNow;
        var reservas = await context.Transacoes.Include(t => t.Produto).Where(t =>
            t.StatusReserva == StatusReserva.Ativa && (t.ConsumidorId == usuarioId || t.OngId == usuarioId || t.Produto!.VarejistaId == usuarioId)).ToListAsync();
        foreach (var reserva in reservas) RegrasCicloVida.ExpirarReserva(reserva, agora);
        if (reservas.Any(t => t.StatusReserva == StatusReserva.Ativa))
            throw new ConflictException("Há reservas ativas vinculadas à conta. Conclua as retiradas ou aguarde o encerramento das reservas antes de excluir. Consumidores e ONGs também podem cancelar suas reservas.");

        var foto = usuario.FotoUrl;
        context.Enderecos.RemoveRange(usuario.Enderecos);
        usuario.Nome = "Conta excluída";
        usuario.Email = $"excluida-{usuario.Id:N}@conta.invalid";
        usuario.Telefone = "";
        usuario.SenhaHash = BCrypt.Net.BCrypt.HashPassword(Guid.NewGuid().ToString("N"));
        usuario.FotoUrl = null;
        usuario.StatusAprovacao = StatusAprovacao.Excluido;
        usuario.NotificarNovasSolicitacoes = usuario.NotificarVencimentos = usuario.NotificarDoacoesConcluidas = false;
        switch (usuario)
        {
            case Consumidor c: c.CPF = ""; c.DataNascimento = DateTime.SpecifyKind(DateTime.MinValue, DateTimeKind.Utc); break;
            case Varejista v:
                v.CNPJ = ""; v.NomeEstabelecimento = "Estabelecimento excluído"; v.RazaoSocial = "";
                v.TipoEstabelecimento = v.HorarioFuncionamento = null; break;
            case Ong o:
                o.CNPJ = ""; o.NomeFantasia = "Organização excluída"; o.AreaAtuacao = "";
                o.CapacidadeRecebimento = o.HorarioFuncionamento = null; break;
        }
        // Mantém as chaves e o histórico operacional, sem o cadastro de perfil.
        // Os lotes do varejista deixam de ser públicos pelo filtro de aprovação existente.
        await context.SaveChangesAsync();
        await operacao.CommitAsync();
        // Uma falha de limpeza do armazenamento não deve aparentar desfazer a exclusão já confirmada.
        if (foto is not null)
        {
            try { await uploads.RemoverAsync([foto]); }
            catch (IOException) { }
            catch (UnauthorizedAccessException) { }
        }
    }
}
