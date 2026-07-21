using System.Net;

using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.Hosting;

using Xunit;

namespace HunterOrder.IntegrationTests;

public sealed class ErrorHandlingTests
{
    [Fact]
    public async Task Unhandled_exception_produces_problem_details()
    {
        // "Testing" (non-Development, non-Production) so the developer exception
        // page is off and the diagnostics throw endpoint is mapped.
        using var factory = new WebApplicationFactory<Program>()
            .WithWebHostBuilder(builder => builder.UseEnvironment("Testing"));
        var client = factory.CreateClient();

        var response = await client.GetAsync("/_diagnostics/throw");

        Assert.Equal(HttpStatusCode.InternalServerError, response.StatusCode);
        Assert.Equal("application/problem+json", response.Content.Headers.ContentType?.MediaType);
    }
}
