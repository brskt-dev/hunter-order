namespace HunterOrder.SharedKernel.Spatial;

/// <summary>
/// A continuous logical world coordinate, authoritative on the server and
/// independent of any visual projection, pixel size or tile grid. The oblique
/// presentation is derived from this; it never feeds back into it.
/// </summary>
public readonly record struct WorldVector(double X, double Y)
{
    public static readonly WorldVector Zero = new(0, 0);

    public double LengthSquared => (X * X) + (Y * Y);

    public double Length => Math.Sqrt(LengthSquared);

    public static WorldVector operator +(WorldVector a, WorldVector b) => new(a.X + b.X, a.Y + b.Y);

    public static WorldVector operator -(WorldVector a, WorldVector b) => new(a.X - b.X, a.Y - b.Y);

    public static WorldVector operator *(WorldVector v, double scalar) => new(v.X * scalar, v.Y * scalar);

    /// <summary>
    /// Returns the unit vector, or <see cref="Zero"/> when there is no length.
    /// Normalizing before applying speed is what prevents diagonal movement from
    /// being faster than orthogonal movement.
    /// </summary>
    public WorldVector Normalized()
    {
        var length = Length;
        return length <= double.Epsilon ? Zero : new WorldVector(X / length, Y / length);
    }

    public double DistanceTo(WorldVector other) => (this - other).Length;
}
