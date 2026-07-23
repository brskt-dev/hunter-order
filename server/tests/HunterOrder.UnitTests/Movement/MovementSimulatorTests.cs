using HunterOrder.Modules.Movement.Domain;
using HunterOrder.SharedKernel.Spatial;

using Xunit;

namespace HunterOrder.UnitTests.Movement;

public sealed class MovementSimulatorTests
{
    private static MovementSpeedContext Speed(double baseWalk = 1.0, double runFactor = 2.0) =>
        new(baseWalk, runFactor, [], maxSpeed: 1000.0);

    private static MovementSimulator FreeWorld() => new(new AabbCollisionWorld([]));

    [Fact]
    public void Diagonal_movement_is_not_faster_than_orthogonal()
    {
        var sim = FreeWorld();
        var start = MovementState.Spawn(WorldVector.Zero);

        var cardinal = sim.Step(start, new MovementIntent(new WorldVector(1, 0), false, 1), 1.0, Speed(), 0);
        var diagonal = sim.Step(start, new MovementIntent(new WorldVector(1, 1), false, 1), 1.0, Speed(), 0);

        Assert.Equal(1.0, cardinal.Position.DistanceTo(WorldVector.Zero), 9);
        Assert.Equal(1.0, diagonal.Position.DistanceTo(WorldVector.Zero), 9);
    }

    [Fact]
    public void Running_applies_the_run_factor()
    {
        var sim = FreeWorld();
        var start = MovementState.Spawn(WorldVector.Zero);

        var running = sim.Step(start, new MovementIntent(new WorldVector(1, 0), true, 1), 1.0, Speed(1.0, 2.0), 0);

        Assert.Equal(MovementMode.Run, running.Mode);
        Assert.Equal(2.0, running.Position.X, 9);
    }

    [Fact]
    public void Stopping_when_intent_is_zero()
    {
        var sim = FreeWorld();
        var moved = sim.Step(MovementState.Spawn(WorldVector.Zero), new MovementIntent(new WorldVector(1, 0), false, 1), 1.0, Speed(), 0);

        var stopped = sim.Step(moved, new MovementIntent(WorldVector.Zero, false, 2), 1.0, Speed(), 0);

        Assert.Equal(moved.Position, stopped.Position);
        Assert.Equal(0.0, stopped.CurrentSpeed, 9);
    }

    [Fact]
    public void Idle_keeps_the_last_visual_direction()
    {
        var sim = FreeWorld();
        var facingEast = sim.Step(MovementState.Spawn(WorldVector.Zero), new MovementIntent(new WorldVector(1, 0), false, 1), 1.0, Speed(), 0);

        var idle = sim.Step(facingEast, new MovementIntent(WorldVector.Zero, false, 2), 1.0, Speed(), 0);

        Assert.Equal(Direction8.East, idle.VisualDirection);
    }

    [Fact]
    public void Records_tick_and_processed_sequence()
    {
        var sim = FreeWorld();

        var next = sim.Step(MovementState.Spawn(WorldVector.Zero), new MovementIntent(new WorldVector(1, 0), false, 42), 1.0, Speed(), 0);

        Assert.Equal(1, next.Tick);
        Assert.Equal(42u, next.LastProcessedSequence);
    }

    [Fact]
    public void Collision_stops_penetration_during_a_step()
    {
        var sim = new MovementSimulator(new AabbCollisionWorld([new Aabb(new WorldVector(1, -1), new WorldVector(2, 1))]));
        var start = MovementState.Spawn(WorldVector.Zero);

        // Walk straight east into the wall for one second at speed 10.
        var result = sim.Step(start, new MovementIntent(new WorldVector(1, 0), false, 1), 1.0, Speed(10.0), 0);

        Assert.True(result.Position.X < 1.0);
    }
}
