using HunterOrder.SharedKernel.Spatial;

namespace HunterOrder.Modules.Movement.Domain;

/// <summary>An axis-aligned solid region of the scenario.</summary>
public readonly record struct Aabb(WorldVector Min, WorldVector Max)
{
    public bool Contains(WorldVector point) =>
        point.X >= Min.X && point.X <= Max.X && point.Y >= Min.Y && point.Y <= Max.Y;

    /// <summary>Grows the box by <paramref name="radius"/> on every side (Minkowski inflation for a circle body).</summary>
    public Aabb ExpandedBy(double radius) =>
        new(new WorldVector(Min.X - radius, Min.Y - radius), new WorldVector(Max.X + radius, Max.Y + radius));
}

/// <summary>
/// Scenario collision. Only static scenario blocks movement — mobile entities are
/// never registered here, so there is no body blocking between Hunters, NPCs or
/// creatures by construction.
/// </summary>
public interface ICollisionWorld
{
    bool IsBlocked(WorldVector point, double radius);

    /// <summary>
    /// Resolves a desired move, allowing tangential sliding along solid scenario.
    /// Deterministic; never lets the body penetrate a solid region.
    /// </summary>
    WorldVector ResolveMove(WorldVector from, WorldVector to, double radius);
}

/// <summary>An in-memory <see cref="ICollisionWorld"/> backed by axis-aligned obstacles.</summary>
public sealed class AabbCollisionWorld(IReadOnlyList<Aabb> obstacles) : ICollisionWorld
{
    private readonly IReadOnlyList<Aabb> _obstacles = obstacles ?? throw new ArgumentNullException(nameof(obstacles));

    public bool IsBlocked(WorldVector point, double radius)
    {
        foreach (var obstacle in _obstacles)
        {
            if (obstacle.ExpandedBy(radius).Contains(point))
            {
                return true;
            }
        }

        return false;
    }

    public WorldVector ResolveMove(WorldVector from, WorldVector to, double radius)
    {
        var result = from;

        // Axis-separated resolution so the body slides along walls instead of stopping dead.
        var tryX = new WorldVector(to.X, result.Y);
        if (!IsBlocked(tryX, radius))
        {
            result = tryX;
        }

        var tryY = new WorldVector(result.X, to.Y);
        if (!IsBlocked(tryY, radius))
        {
            result = tryY;
        }

        return result;
    }
}
