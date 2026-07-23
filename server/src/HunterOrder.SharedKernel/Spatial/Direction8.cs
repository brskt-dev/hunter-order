namespace HunterOrder.SharedKernel.Spatial;

/// <summary>The eight facing directions used for visual orientation and sprites.</summary>
public enum Direction8
{
    North,
    NorthEast,
    East,
    SouthEast,
    South,
    SouthWest,
    West,
    NorthWest,
}

public static class Direction8Resolver
{
    /// <summary>
    /// Maps a movement vector to one of eight facing directions. World convention:
    /// +X is east and +Y is south. A zero-length vector returns <paramref name="fallback"/>,
    /// so an idle Hunter keeps its last valid facing.
    /// </summary>
    public static Direction8 FromVector(WorldVector movement, Direction8 fallback)
    {
        if (movement.LengthSquared <= double.Epsilon)
        {
            return fallback;
        }

        // Degrees clockwise from east (0), because +Y points south.
        var degrees = ((Math.Atan2(movement.Y, movement.X) * 180.0 / Math.PI) + 360.0) % 360.0;
        var octant = (int)Math.Round(degrees / 45.0) % 8;

        return octant switch
        {
            0 => Direction8.East,
            1 => Direction8.SouthEast,
            2 => Direction8.South,
            3 => Direction8.SouthWest,
            4 => Direction8.West,
            5 => Direction8.NorthWest,
            6 => Direction8.North,
            7 => Direction8.NorthEast,
            _ => fallback,
        };
    }
}
