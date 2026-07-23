using HunterOrder.Modules.Movement.Interaction;

using Xunit;

namespace HunterOrder.UnitTests.Movement;

public sealed class InteractionSelectorTests
{
    private static InteractionCandidate Candidate(
        string id,
        double distance,
        bool inRange = true,
        bool selected = false,
        bool focused = false,
        int relevance = 0) =>
        new(id, distance, relevance, selected, focused, inRange);

    [Fact]
    public void Out_of_range_candidates_are_never_selected()
    {
        var result = InteractionSelector.SelectPrimary([Candidate("a", 1, inRange: false, selected: true)]);

        Assert.Null(result);
    }

    [Fact]
    public void Explicit_selection_beats_a_nearer_target()
    {
        var result = InteractionSelector.SelectPrimary(
        [
            Candidate("near", 1),
            Candidate("selected", 5, selected: true),
        ]);

        Assert.Equal("selected", result?.EntityId);
    }

    [Fact]
    public void Focus_beats_a_nearer_unfocused_target()
    {
        var result = InteractionSelector.SelectPrimary(
        [
            Candidate("near", 1),
            Candidate("focused", 5, focused: true),
        ]);

        Assert.Equal("focused", result?.EntityId);
    }

    [Fact]
    public void Nearest_wins_when_no_selection_or_focus()
    {
        var result = InteractionSelector.SelectPrimary(
        [
            Candidate("far", 9),
            Candidate("near", 2),
        ]);

        Assert.Equal("near", result?.EntityId);
    }

    [Fact]
    public void Ties_break_deterministically_by_id()
    {
        var result = InteractionSelector.SelectPrimary(
        [
            Candidate("b", 3),
            Candidate("a", 3),
        ]);

        Assert.Equal("a", result?.EntityId);
    }
}
