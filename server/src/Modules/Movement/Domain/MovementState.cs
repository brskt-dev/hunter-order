using HunterOrder.SharedKernel.Spatial;

namespace HunterOrder.Modules.Movement.Domain;

/// <summary>The authoritative logical movement state of a Hunter.</summary>
public sealed record MovementState(
    WorldVector Position,
    WorldVector IntentDirection,
    Direction8 VisualDirection,
    double CurrentSpeed,
    MovementMode Mode,
    long Tick,
    uint LastProcessedSequence)
{
    public static MovementState Spawn(WorldVector position, Direction8 facing = Direction8.South) =>
        new(position, WorldVector.Zero, facing, 0.0, MovementMode.Walk, 0, 0);
}

/// <summary>A single movement intent (client sends intent, never authoritative position).</summary>
public readonly record struct MovementIntent(WorldVector Direction, bool Running, uint Sequence);
