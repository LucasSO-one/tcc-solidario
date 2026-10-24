namespace TccSolidario.Api.DTOs.Conta;

public class ContaResponse
{
    public Guid Id { get; set; }
    public string Tipo { get; set; } = string.Empty;
    public string Nome { get; set; } = string.Empty;          // nome do responsável
    public string NomeExibicao { get; set; } = string.Empty;  // nome mostrado no menu (estabelecimento, ONG ou pessoa)
    public string Email { get; set; } = string.Empty;
    public string Telefone { get; set; } = string.Empty;
    public string? FotoUrl { get; set; }
    public string StatusAprovacao { get; set; } = string.Empty;
    public DateTime DataCriacao { get; set; }
    public OrganizacaoDto? Organizacao { get; set; }          // só varejista e ONG
    public EnderecoDto? Endereco { get; set; }
    public NotificacoesDto Notificacoes { get; set; } = new();
}

public class OrganizacaoDto
{
    // Somente leitura: validados na aprovação do cadastro
    public string? RazaoSocial { get; set; }
    public string? Cnpj { get; set; }
    // Editáveis
    public string? NomeFantasia { get; set; }          // ONG
    public string? NomeEstabelecimento { get; set; }   // varejista
    public string? TipoEstabelecimento { get; set; }   // varejista
    public string? AreaAtuacao { get; set; }           // ONG
    public string? CapacidadeRecebimento { get; set; } // ONG
    public string? HorarioFuncionamento { get; set; }
}

public class EnderecoDto
{
    public string Cep { get; set; } = string.Empty;
    public string Rua { get; set; } = string.Empty;
    public string Numero { get; set; } = string.Empty;
    public string? Complemento { get; set; }
    public string Bairro { get; set; } = string.Empty;
    public string Cidade { get; set; } = string.Empty;
    public string Estado { get; set; } = string.Empty;
}

public class NotificacoesDto
{
    public bool NovasSolicitacoes { get; set; } = true;
    public bool Vencimentos { get; set; } = true;
    public bool DoacoesConcluidas { get; set; } = true;
}

public class AtualizarContaRequest
{
    public string Nome { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? SenhaAtual { get; set; } // obrigatória só para trocar o e-mail
    public string Telefone { get; set; } = string.Empty;
    public OrganizacaoDto? Organizacao { get; set; }
    public EnderecoDto? Endereco { get; set; }
    public NotificacoesDto Notificacoes { get; set; } = new();
}

public class AlterarSenhaRequest
{
    public string SenhaAtual { get; set; } = string.Empty;
    public string NovaSenha { get; set; } = string.Empty;
}
