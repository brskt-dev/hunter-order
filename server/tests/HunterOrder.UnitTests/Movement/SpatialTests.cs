using HunterOrder.SharedKernel.Spatial;

using Xunit;

namespace HunterOrder.UnitTests.Movement;

public sealed class SpatialTests
{
    [Fact]
    public void Length_is_euclidean()
    {
        Assert.Equal(5.0, new WorldVector(3, 4).Length, 9);
    }

    [Fact]
    public void Normalizing_zero_yields_zero()
    {
        Assert.Equal(WorldVector.Zero, WorldVector.Zero.Normalized());
    }

    [Theory]
    [InlineData(3, 4)]
    [InlineData(1, 1)]
    [InlineData(-2, 5)]
    public void Normalized_vectors_have_unit_length(double x, double y)
    {
        Assert.Equal(1.0, new WorldVector(x, y).Normalized().Length, 9);
    }

    [Theory]
    [InlineData(1, 0, Direction8.East)]
    [InlineData(0, 1, Direction8.South)]
    [InlineData(0, -1, Direction8.North)]
    [InlineData(-1, 0, Direction8.West)]
    [InlineData(1, 1, Direction8.SouthEast)]
    [InlineData(1, -1, Direction8.NorthEast)]
    [InlineData(-1, 1, Direction8.SouthWest)]
    [InlineData(-1, -1, Direction8.NorthWest)]
    public void Direction_is_derived_from_movement_vector(double x, double y, Direction8 expected)
    {
        Assert.Equal(expected, Direction8Resolver.FromVector(new WorldVector(x, y), Direction8.South));
    }

    [Fact]
    public void Idle_vector_keeps_the_fallback_facing()
    {
        Assert.Equal(Direction8.West, Direction8Resolver.FromVector(WorldVector.Zero, Direction8.West));
    }
}
