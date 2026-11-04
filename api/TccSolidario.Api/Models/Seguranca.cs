using System.ComponentModel.DataAnnotations;

namespace TccSolidario.Api.Models;

public class SessaoAutenticacao
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UsuarioId { get; set; }
    public Guid VersaoUsuario { get; set; }
    public DateTime CriadaEmUtc { get; set; }
    public DateTime ExpiraEmUtc { get; set; }
    public DateTime? RevogadaEmUtc { get; set; }
}

public class TokenSeguranca
{
    [Key, MaxLength(64)] public string Hash { get; set; } = "";
    public Guid UsuarioId { get; set; }
    public Guid VersaoUsuario { get; set; }
    [MaxLength(32)] public string Finalidade { get; set; } = "";
    public DateTime ExpiraEmUtc { get; set; }
    public DateTime? ConsumidoEmUtc { get; set; }
    public int Falhas { get; set; }
    public string? SegredoProtegido { get; set; }
}

public class EmailPendente
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UsuarioId { get; set; }
    public bool Cancelado { get; set; }
    public string MensagemProtegida { get; set; } = "";
    public DateTime CriadoEmUtc { get; set; }
    public DateTime ExpiraEmUtc { get; set; }
    public DateTime ProximaTentativaUtc { get; set; }
    public DateTime? EmProcessamentoAteUtc { get; set; }
    public DateTime? EnviadoEmUtc { get; set; }
    public int Tentativas { get; set; }
}

public class LimiteAutenticacao
{
    [Key, MaxLength(64)] public string Chave { get; set; } = "";
    public DateTime InicioUtc { get; set; }
    public int Tentativas { get; set; }
}

public class EventoAuditoria
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid? UsuarioId { get; set; }
    public Guid? EntidadeId { get; set; }
    [MaxLength(80)] public string Acao { get; set; } = "";
    public bool Sucesso { get; set; } = true;
    public DateTime EmUtc { get; set; } = DateTime.UtcNow;
}

public class ChaveProtecao
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string XmlProtegido { get; set; } = "";
}
