namespace HunterOrder.Modules.Movement.Perception;

/// <summary>
/// Perception layers. Being present in the raw visual field does not imply the
/// entity is understood — these are distinct states and may regress.
/// </summary>
public enum PerceptionLevel
{
    Unaware = 0,
    Visible = 1,
    Detected = 2,
    Identified = 3,
}

/// <summary>
/// Per-observer inputs for evaluating perception of one target. Environmental
/// factors (lighting, weather, vegetation, movement) enter through the score and
/// thresholds so they can be added later without changing this contract.
/// </summary>
public readonly record struct PerceptionInputs(
    bool InVisualField,
    bool HasLineOfSight,
    double Distance,
    double DetectionRange,
    double IdentificationRange,
    double PerceptionScore,
    double DetectionThreshold,
    double IdentificationThreshold);

/// <summary>
/// Pure, individual perception evaluation. Re-evaluated each tick, so a level
/// naturally regresses when the target leaves range, breaks line of sight or a
/// perception effect ends. Perception is never shared automatically across a group.
/// </summary>
public static class PerceptionEvaluator
{
    public static PerceptionLevel Evaluate(PerceptionInputs inputs)
    {
        if (!inputs.InVisualField || !inputs.HasLineOfSight)
        {
            return PerceptionLevel.Unaware;
        }

        var level = PerceptionLevel.Visible;

        if (inputs.Distance <= inputs.DetectionRange && inputs.PerceptionScore >= inputs.DetectionThreshold)
        {
            level = PerceptionLevel.Detected;
        }

        if (level == PerceptionLevel.Detected
            && inputs.Distance <= inputs.IdentificationRange
            && inputs.PerceptionScore >= inputs.IdentificationThreshold)
        {
            level = PerceptionLevel.Identified;
        }

        return level;
    }
}
