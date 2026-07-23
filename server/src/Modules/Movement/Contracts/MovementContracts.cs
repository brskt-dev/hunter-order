using HunterOrder.Modules.Movement.Domain;
using HunterOrder.SharedKernel.Spatial;

namespace HunterOrder.Modules.Movement.Contracts;

/// <summary>
/// Client → server movement intent. The client sends intent and a monotonic
/// sequence number for reconciliation; it never sends an authoritative position.
/// Transport-agnostic: this is the wire contract a future realtime transport (an
/// ADR-gated decision) will carry.
/// </summary>
public readonly record struct MovementCommand(
    uint Sequence,
    WorldVector Direction,
    bool Running,
    long ClientTimeMs);

/// <summary>
/// Server → client authoritative entity snapshot. `LastProcessedSequence` lets the
/// local Hunter reconcile and replay still-pending commands.
/// </summary>
public readonly record struct EntitySnapshot(
    WorldVector Position,
    Direction8 VisualDirection,
    double Speed,
    MovementMode Mode,
    long ServerTick,
    uint LastProcessedSequence);
