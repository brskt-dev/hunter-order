namespace HunterOrder.Modules.Movement.Domain;

public enum SpeedModifierCategory
{
    Mode,
    Terrain,
    Weight,
    Equipment,
    Condition,
    Temporary,
}

/// <summary>A single, auditable contribution to the final movement speed.</summary>
public readonly record struct SpeedModifier(string Source, SpeedModifierCategory Category, double Factor);

/// <summary>The composed speed plus the modifier chain that produced it (for auditing).</summary>
public sealed record SpeedBreakdown(double BaseSpeed, IReadOnlyList<SpeedModifier> Modifiers, double FinalSpeed);

/// <summary>
/// Deterministically composes the final speed as an explicit, auditable chain of
/// multiplicative modifiers, guarded against invalid values. Balancing numbers are
/// not defined here — callers supply base speed, factors and the safety ceiling.
/// </summary>
public static class SpeedCalculator
{
    /// <summary>Upper bound for any single factor, guarding against runaway multipliers.</summary>
    public const double MaxFactor = 100.0;

    public static SpeedBreakdown Compose(double baseSpeed, IReadOnlyList<SpeedModifier> modifiers, double maxSpeed)
    {
        ArgumentNullException.ThrowIfNull(modifiers);
        if (baseSpeed < 0 || double.IsNaN(baseSpeed) || double.IsInfinity(baseSpeed))
        {
            throw new ArgumentOutOfRangeException(nameof(baseSpeed));
        }

        if (maxSpeed < 0 || double.IsNaN(maxSpeed))
        {
            throw new ArgumentOutOfRangeException(nameof(maxSpeed));
        }

        var speed = baseSpeed;
        foreach (var modifier in modifiers)
        {
            var factor = modifier.Factor;
            if (double.IsNaN(factor) || double.IsInfinity(factor))
            {
                factor = 1.0;
            }

            factor = Math.Clamp(factor, 0.0, MaxFactor);
            speed *= factor;
        }

        speed = Math.Clamp(speed, 0.0, maxSpeed);
        return new SpeedBreakdown(baseSpeed, modifiers, speed);
    }
}
