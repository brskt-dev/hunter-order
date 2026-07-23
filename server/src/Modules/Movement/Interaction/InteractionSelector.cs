namespace HunterOrder.Modules.Movement.Interaction;

/// <summary>A candidate target for a contextual interaction, with the signals used to rank it.</summary>
public readonly record struct InteractionCandidate(
    string EntityId,
    double Distance,
    int Relevance,
    bool IsSelected,
    bool IsFocused,
    bool InRange);

/// <summary>
/// Deterministic contextual target selection for the universal interaction action.
/// Priority: explicit selection, then focus, then nearest, then relevance, with a
/// stable id tie-break — so it never flips chaotically between similar targets and
/// never picks an out-of-range target for a direct action.
/// </summary>
public static class InteractionSelector
{
    private const double DistanceEpsilon = 1e-9;

    public static InteractionCandidate? SelectPrimary(IReadOnlyList<InteractionCandidate> candidates)
    {
        ArgumentNullException.ThrowIfNull(candidates);

        InteractionCandidate? best = null;
        foreach (var candidate in candidates)
        {
            if (!candidate.InRange)
            {
                continue;
            }

            if (best is null || IsBetter(candidate, best.Value))
            {
                best = candidate;
            }
        }

        return best;
    }

    private static bool IsBetter(InteractionCandidate a, InteractionCandidate b)
    {
        if (a.IsSelected != b.IsSelected)
        {
            return a.IsSelected;
        }

        if (a.IsFocused != b.IsFocused)
        {
            return a.IsFocused;
        }

        if (Math.Abs(a.Distance - b.Distance) > DistanceEpsilon)
        {
            return a.Distance < b.Distance;
        }

        if (a.Relevance != b.Relevance)
        {
            return a.Relevance > b.Relevance;
        }

        return string.CompareOrdinal(a.EntityId, b.EntityId) < 0;
    }
}
