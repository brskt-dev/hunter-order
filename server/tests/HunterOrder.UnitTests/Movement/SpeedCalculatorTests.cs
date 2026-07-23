using HunterOrder.Modules.Movement.Domain;

using Xunit;

namespace HunterOrder.UnitTests.Movement;

public sealed class SpeedCalculatorTests
{
    private static SpeedModifier Terrain(double factor) => new("terrain", SpeedModifierCategory.Terrain, factor);

    [Fact]
    public void Composes_the_modifier_chain_multiplicatively()
    {
        var result = SpeedCalculator.Compose(2.0, [Terrain(0.5), Terrain(3.0)], maxSpeed: 100.0);

        Assert.Equal(3.0, result.FinalSpeed, 9);
        Assert.Equal(2.0, result.BaseSpeed, 9);
        Assert.Equal(2, result.Modifiers.Count);
    }

    [Fact]
    public void Clamps_to_the_max_speed()
    {
        var result = SpeedCalculator.Compose(10.0, [Terrain(100.0)], maxSpeed: 5.0);

        Assert.Equal(5.0, result.FinalSpeed, 9);
    }

    [Fact]
    public void Non_finite_factors_are_neutralized()
    {
        var result = SpeedCalculator.Compose(2.0, [Terrain(double.NaN), Terrain(double.PositiveInfinity)], maxSpeed: 100.0);

        Assert.Equal(2.0, result.FinalSpeed, 9);
    }

    [Fact]
    public void Rejects_invalid_base_speed()
    {
        Assert.Throws<ArgumentOutOfRangeException>(() => SpeedCalculator.Compose(-1.0, [], maxSpeed: 10.0));
    }
}
