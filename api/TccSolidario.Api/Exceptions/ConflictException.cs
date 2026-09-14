// Exceptions/ConflictException.cs
namespace TccSolidario.Api.Exceptions;

public class ConflictException : Exception
{
    public ConflictException(string message) : base(message) { }
}