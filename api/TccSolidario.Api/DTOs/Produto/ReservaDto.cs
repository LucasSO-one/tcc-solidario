namespace TccSolidario.Api.Dtos.Reserva;

public class CriarReservaRequest
{
    public Guid ProdutoId { get; set; }
}

public class ReservaResponse
{
    public Guid Id { get; set; }
    public Guid ProdutoId { get; set; }
    public string ProdutoNome { get; set; } = string.Empty;
    public string CodigoRetirada { get; set; } = string.Empty;
    public string Tipo { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public decimal ValorFinal { get; set; }
    public DateTime DataReserva { get; set; }
    public DateTime? DataRetirada { get; set; }
}

public class ValidarRetiradaRequest
{
    public string Codigo { get; set; } = string.Empty;
}

//DTO para ongs
public class MinhaReservaResponse
{
    public Guid Id { get; set; }
    public Guid ProdutoId { get; set; }
    public string ProdutoNome { get; set; } = string.Empty;
    public string Tipo { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public decimal ValorFinal { get; set; }
    public DateTime DataReserva { get; set; }
    public DateTime? DataRetirada { get; set; }
}

//DTO para o varejista
public class ReservaPendenteResponse
{
    public Guid Id { get; set; }
    public Guid ProdutoId { get; set; }
    public string ProdutoNome { get; set; } = string.Empty;
    public string CodigoRetirada { get; set; } = string.Empty;
    public string Tipo { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public decimal ValorFinal { get; set; }
    public DateTime DataReserva { get; set; }
}