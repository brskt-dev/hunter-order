using HunterOrder.SharedKernel.Results;

using Xunit;

namespace HunterOrder.UnitTests.Results;

public sealed class ResultTests
{
    [Fact]
    public void Success_is_successful_and_has_no_error()
    {
        var result = Result.Success();

        Assert.True(result.IsSuccess);
        Assert.False(result.IsFailure);
        Assert.Equal(Error.None, result.Error);
    }

    [Fact]
    public void Failure_carries_the_error()
    {
        var error = new Error("test.code", "Something failed.");

        var result = Result.Failure(error);

        Assert.True(result.IsFailure);
        Assert.Equal(error, result.Error);
    }

    [Fact]
    public void Success_with_value_exposes_the_value()
    {
        var result = Result.Success(42);

        Assert.True(result.IsSuccess);
        Assert.Equal(42, result.Value);
    }

    [Fact]
    public void Accessing_value_of_failure_throws()
    {
        var result = Result.Failure<int>(new Error("x", "y"));

        Assert.Throws<InvalidOperationException>(() => result.Value);
    }

    [Fact]
    public void Failure_without_error_is_invalid()
    {
        Assert.Throws<InvalidOperationException>(() => Result.Failure(Error.None));
    }
}
