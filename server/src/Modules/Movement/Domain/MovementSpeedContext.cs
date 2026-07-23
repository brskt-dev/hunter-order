namespace HunterOrder.Modules.Movement.Domain;

/// <summary>
/// Resolves the final speed for a movement mode from a base walk speed, a run
/// factor and the external modifier chain (terrain, weight, equipment, condition,
/// temporary). Balancing numbers are supplied by the caller/config, not hard-coded.
/// </summary>
public sealed class MovementSpeedContext
{
    private readonly double _baseWalkSpeed;
    private readonly double _runFactor;
    private readonly IReadOnlyList<SpeedModifier> _modifiers;
    private readonly double _maxSpeed;

    public MovementSpeedContext(
        double baseWalkSpeed,
        double runFactor,
        IReadOnlyList<SpeedModifier> modifiers,
        double maxSpeed)
    {
        _baseWalkSpeed = baseWalkSpeed;
        _runFactor = runFactor;
        _modifiers = modifiers ?? throw new ArgumentNullException(nameof(modifiers));
        _maxSpeed = maxSpeed;
    }

    public SpeedBreakdown Resolve(MovementMode mode)
    {
        var chain = new List<SpeedModifier>(_modifiers.Count + 1);
        if (mode == MovementMode.Run)
        {
            chain.Add(new SpeedModifier("mode:run", SpeedModifierCategory.Mode, _runFactor));
        }

        chain.AddRange(_modifiers);
        return SpeedCalculator.Compose(_baseWalkSpeed, chain, _maxSpeed);
    }
}
