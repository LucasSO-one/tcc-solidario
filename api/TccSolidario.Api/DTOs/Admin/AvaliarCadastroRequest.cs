namespace TccSolidario.Api.DTOs.Admin;

using TccSolidario.Api.Models.Enums;

public class AvaliarCadastroRequest
{
    // Espera receber 2 (Aprovado) ou 3 (Rejeitado)
    public StatusAprovacao NovoStatus { get; set; } 
}