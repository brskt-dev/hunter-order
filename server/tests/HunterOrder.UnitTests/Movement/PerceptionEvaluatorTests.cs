using HunterOrder.Modules.Movement.Perception;

using Xunit;

namespace HunterOrder.UnitTests.Movement;

public sealed class PerceptionEvaluatorTests
{
    private static PerceptionInputs Inputs(
        bool inField = true,
        bool los = true,
        double distance = 5,
        double perception = 100) =>
        new(inField, los, distance, DetectionRange: 20, IdentificationRange: 10, perception, DetectionThreshold: 10, IdentificationThreshold: 50);

    [Fact]
    public void Not_in_visual_field_is_unaware()
    {
        Assert.Equal(PerceptionLevel.Unaware, PerceptionEvaluator.Evaluate(Inputs(inField: false)));
    }

    [Fact]
    public void Blocked_line_of_sight_is_unaware()
    {
        Assert.Equal(PerceptionLevel.Unaware, PerceptionEvaluator.Evaluate(Inputs(los: false)));
    }

    [Fact]
    public void Visible_but_below_detection_threshold()
    {
        Assert.Equal(PerceptionLevel.Visible, PerceptionEvaluator.Evaluate(Inputs(perception: 0)));
    }

    [Fact]
    public void Detected_but_not_identified_when_beyond_identification_range()
    {
        // distance 15 is within detection (20) but beyond identification (10).
        Assert.Equal(PerceptionLevel.Detected, PerceptionEvaluator.Evaluate(Inputs(distance: 15, perception: 100)));
    }

    [Fact]
    public void Identified_when_close_and_perceptive()
    {
        Assert.Equal(PerceptionLevel.Identified, PerceptionEvaluator.Evaluate(Inputs(distance: 5, perception: 100)));
    }

    [Fact]
    public void Regresses_when_distance_grows()
    {
        Assert.Equal(PerceptionLevel.Identified, PerceptionEvaluator.Evaluate(Inputs(distance: 5)));
        Assert.Equal(PerceptionLevel.Detected, PerceptionEvaluator.Evaluate(Inputs(distance: 15)));
        Assert.Equal(PerceptionLevel.Visible, PerceptionEvaluator.Evaluate(Inputs(distance: 999)));
    }
}
