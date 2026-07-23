using HunterOrder.Modules.Movement.Domain;
using HunterOrder.SharedKernel.Spatial;

using Xunit;

namespace HunterOrder.UnitTests.Movement;

public sealed class CollisionTests
{
    // Solid wall covering x in [1, 2], y in [-1, 1].
    private static AabbCollisionWorld WorldWithWall() =>
        new([new Aabb(new WorldVector(1, -1), new WorldVector(2, 1))]);

    [Fact]
    public void Free_space_allows_the_full_move()
    {
        var world = new AabbCollisionWorld([]);

        var result = world.ResolveMove(WorldVector.Zero, new WorldVector(3, 4), radius: 0);

        Assert.Equal(new WorldVector(3, 4), result);
    }

    [Fact]
    public void Solid_scenario_prevents_penetration()
    {
        var world = WorldWithWall();

        var result = world.ResolveMove(WorldVector.Zero, new WorldVector(1.5, 0), radius: 0);

        Assert.Equal(WorldVector.Zero, result);
    }

    [Fact]
    public void Movement_slides_along_a_wall()
    {
        var world = WorldWithWall();

        // Pushing north-east into the wall should slide along the free (Y) axis.
        var result = world.ResolveMove(WorldVector.Zero, new WorldVector(1.5, 0.5), radius: 0);

        Assert.Equal(0.0, result.X, 9);
        Assert.Equal(0.5, result.Y, 9);
    }

    [Fact]
    public void Radius_inflates_the_obstacle()
    {
        var world = WorldWithWall();

        Assert.False(world.IsBlocked(new WorldVector(0.5, 0), radius: 0));
        Assert.True(world.IsBlocked(new WorldVector(0.5, 0), radius: 0.6));
    }
}
