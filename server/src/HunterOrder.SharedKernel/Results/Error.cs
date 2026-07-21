namespace HunterOrder.SharedKernel.Results;

/// <summary>
/// A machine-readable error code paired with a human-readable message.
/// Used by <see cref="Result"/> to describe failures without exceptions.
/// </summary>
public sealed record Error(string Code, string Message)
{
    /// <summary>Represents the absence of an error (used by successful results).</summary>
    public static readonly Error None = new(string.Empty, string.Empty);
}
