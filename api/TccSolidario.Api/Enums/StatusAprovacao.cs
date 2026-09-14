namespace TccSolidario.Api.Models.Enums;

public enum StatusAprovacao
{
    // O valor 1 sera o padrao quando a pessoa acabar de se cadastrar
    Pendente = 1,
    
    // O valor 2 sera definido quando o Admin clicar em "Aprovar"
    Aprovado = 2,
    
    // O valor 3 sera definido quando o Admin clicar em "Rejeitar"
    Rejeitado = 3
}