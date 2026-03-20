using System.ComponentModel.DataAnnotations;


public abstract class Usuario
{
    public Guid Id { get; set; } = Guid.NewGuid();
    
    [Required]
    public string Nome { get; set; } = string.Empty;
    
    [Required, EmailAddress]
    public string Email { get; set; } = string.Empty;
    
    public string SenhaHash { get; set; } = string.Empty;
    
    public DateTime DataCriacao { get; set; } = DateTime.UtcNow;
    
    public TipoUsuario Tipo { get; set; }

    public List<Endereco> Enderecos { get; set; } = new();
}

public class Varejista : Usuario
{
    [Required, StringLength(14)]
    public string CNPJ { get; set; } = string.Empty;
    public string RazaoSocial { get; set; } = string.Empty;
    public string? HorarioFuncionamento { get; set; }
}

public class Ong : Usuario
{
    [Required, StringLength(14)]
    public string CNPJ { get; set; } = string.Empty;
    public string AreaAtuacao { get; set; } = string.Empty;
    public string NomeResponsavel { get; set; } = string.Empty;
}


public class Consumidor : Usuario
{
    [Required, StringLength(11)]
    public string CPF { get; set; } = string.Empty;
    public DateTime DataNascimento { get; set; }
}

public class Admin : Usuario {}