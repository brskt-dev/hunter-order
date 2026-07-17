using Microsoft.AspNetCore.Routing;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace HunterOrder.SharedKernel.Modules;

/// <summary>
/// Contract implemented by every module in the modular monolith. A module owns
/// its own service registrations and HTTP endpoints; the host composes modules
/// without knowing their internals (ADR-0001).
///
/// Modules must not reach into another module's persistence or internal state.
/// </summary>
public interface IModule
{
    /// <summary>Stable, unique module name (used for logging and diagnostics).</summary>
    string Name { get; }

    /// <summary>Register the module's services into the shared container.</summary>
    void RegisterServices(IServiceCollection services, IConfiguration configuration);

    /// <summary>Map the module's HTTP endpoints. May be a no-op while a module has none.</summary>
    void MapEndpoints(IEndpointRouteBuilder endpoints);
}
