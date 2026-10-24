namespace TccSolidario.Api.Models;

// Política de senha usada no cadastro e na troca de senha.
public static class RegrasSenha
{
    public const string Padrao = @"^(?=.*[A-Z])(?=.*\d)(?=.*[\W_])[A-Za-z\d\W_]{8,}$";
    public const string Mensagem = "A senha deve ter no mínimo 8 caracteres, com pelo menos uma letra maiúscula, um número e um caractere especial.";
}
