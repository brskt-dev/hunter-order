using HunterOrder.SharedKernel.Spatial;

namespace HunterOrder.Modules.Movement.Domain;

/// <summary>
/// The server-authoritative movement step. Continuous (not tile-locked), with
/// diagonal input normalized so it grants no speed advantage, scenario collision
/// applied, and the visual facing derived from the movement vector.
/// </summary>
public sealed class MovementSimulator(ICollisionWorld collisionWorld)
{
    /// <summary>
    /// Maximum distance resolved against collision in a single sub-step. Large
    /// per-frame displacements are split into sub-steps so a fast body cannot
    /// tunnel through thin scenario. Must be smaller than the thinnest solid.
    /// </summary>
    private const double MaxSubStepDistance = 0.25;

    private readonly ICollisionWorld _collisionWorld =
        collisionWorld ?? throw new ArgumentNullException(nameof(collisionWorld));

    public MovementState Step(
        MovementState state,
        MovementIntent intent,
        double deltaSeconds,
        MovementSpeedContext speed,
        double bodyRadius)
    {
        ArgumentNullException.ThrowIfNull(state);
        ArgumentNullException.ThrowIfNull(speed);

        var direction = intent.Direction.Normalized();
        var mode = intent.Running ? MovementMode.Run : MovementMode.Walk;
        var finalSpeed = speed.Resolve(mode).FinalSpeed;
        var isMoving = direction.LengthSquared > double.Epsilon && finalSpeed > 0 && deltaSeconds > 0;

        var position = state.Position;
        if (isMoving)
        {
            var displacement = direction * (finalSpeed * deltaSeconds);
            var subSteps = Math.Max(1, (int)Math.Ceiling(displacement.Length / MaxSubStepDistance));
            var stepDelta = displacement * (1.0 / subSteps);

            for (var i = 0; i < subSteps; i++)
            {
                var resolved = _collisionWorld.ResolveMove(position, position + stepDelta, bodyRadius);
                if (resolved == position)
                {
                    break; // fully blocked; no further progress possible this frame
                }

                position = resolved;
            }
        }

        return state with
        {
            Position = position,
            IntentDirection = direction,
            VisualDirection = Direction8Resolver.FromVector(direction, state.VisualDirection),
            CurrentSpeed = isMoving ? finalSpeed : 0.0,
            Mode = mode,
            Tick = state.Tick + 1,
            LastProcessedSequence = intent.Sequence,
        };
    }
}
