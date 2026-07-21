using HunterOrder.SharedKernel.Modules;

using Microsoft.AspNetCore.Routing;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace HunterOrder.Modules.Clans;

/// <summary>
/// Clans module. Infrastructure shell only — registers no services and maps no
/// endpoints yet (no gameplay mechanics in this foundation).
/// </summary>
public sealed class ClansModule : IModule
{
    public string Name => "Clans";

    public void RegisterServices(IServiceCollection services, IConfiguration configuration)
    {
        // Intentionally empty: this module has no services yet.
    }

    public void MapEndpoints(IEndpointRouteBuilder endpoints)
    {
        // Intentionally empty: this module has no endpoints yet.
    }
}
