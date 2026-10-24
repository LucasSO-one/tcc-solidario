using System.ComponentModel.DataAnnotations;
using TccSolidario.Api.Models.Enums;
namespace TccSolidario.Api.Models; 



public abstract class Usuario
{
    public Guid Id { get; set; } = Guid.NewGuid();
    
    [Required]
    public string Nome { get; set; } = string.Empty;
    
    [Required, EmailAddress]
    public string Email { get; set; } = string.Empty;

    [StringLength(20)]
    public string Telefone { get; set; } = string.Empty;
    
    public string SenhaHash { get; set; } = string.Empty;
    
    public DateTime DataCriacao { get; set; } = DateTime.UtcNow;
    
    public TipoUsuario Tipo { get; set; }

    public List<Endereco> Enderecos { get; set; } = new();

    [Required]
    public StatusAprovacao StatusAprovacao { get; set; } = StatusAprovacao.Pendente;

    [StringLength(300)]
    public string? FotoUrl { get; set; }

    // Preferências de notificação (o envio por e-mail ainda não está implementado)
    public bool NotificarNovasSolicitacoes { get; set; } = true;
    public bool NotificarVencimentos { get; set; } = true;
    public bool NotificarDoacoesConcluidas { get; set; } = true;
}

public class Varejista : Usuario
{
    [Required, StringLength(14)]
    public string CNPJ { get; set; } = string.Empty;
    
    [Required, StringLength(150)]
    public string NomeEstabelecimento { get; set; } = string.Empty;
    public string RazaoSocial { get; set; } = string.Empty;
    [StringLength(120)]
    public string? HorarioFuncionamento { get; set; }
    [StringLength(60)]
    public string? TipoEstabelecimento { get; set; }
}

public class Ong : Usuario
{
    [Required, StringLength(14)]
    public string CNPJ { get; set; } = string.Empty;
    public string AreaAtuacao { get; set; } = string.Empty;
    [Required, StringLength(100)]
    public string NomeFantasia { get; set; } = string.Empty;
    [StringLength(100)]
    public string? CapacidadeRecebimento { get; set; }
    [StringLength(120)]
    public string? HorarioFuncionamento { get; set; }
}


public class Consumidor : Usuario
{
    [Required, StringLength(11)]
    public string CPF { get; set; } = string.Empty;
    public DateTime DataNascimento { get; set; }
}

public class Admin : Usuario {}