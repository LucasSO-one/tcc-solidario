namespace TccSolidario.Api.Exceptions;

// Erros de validação por campo: o front mostra cada mensagem abaixo do campo correspondente.
public class ValidacaoException(Dictionary<string, string> erros)
    : Exception("Confira os campos destacados.")
{
    public Dictionary<string, string> Erros { get; } = erros;
}
