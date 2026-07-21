using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Diagnostics.HealthChecks;
using Microsoft.AspNetCore.Routing;

namespace HunterOrder.Api.Diagnostics;

public static class HealthCheckExtensions
{
    /// <summary>
    /// Maps liveness and readiness endpoints.
    /// <c>/health/live</c> reports only that the process is up (no dependency
    /// checks); <c>/health/ready</c> runs all registered checks (none yet).
    /// </summary>
    public static IEndpointRouteBuilder MapHunterOrderHealthChecks(this IEndpointRouteBuilder endpoints)
    {
        ArgumentNullException.ThrowIfNull(endpoints);

        endpoints.MapHealthChecks("/health/live", new HealthCheckOptions { Predicate = _ => false });
        endpoints.MapHealthChecks("/health/ready");

        return endpoints;
    }
}
