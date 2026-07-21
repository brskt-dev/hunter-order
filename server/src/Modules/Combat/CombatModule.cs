using HunterOrder.SharedKernel.Modules;

using Microsoft.AspNetCore.Routing;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace HunterOrder.Modules.Combat;

/// <summary>
/// Combat module. Infrastructure shell only — registers no services and maps no
/// endpoints yet (no gameplay mechanics in this foundation).
/// </summary>
public sealed class CombatModule : IModule
{
    public string Name => "Combat";

    public void RegisterServices(IServiceCollection services, IConfiguration configuration)
    {
        // Intentionally empty: this module has no services yet.
    }

    public void MapEndpoints(IEndpointRouteBuilder endpoints)
    {
        // Intentionally empty: this module has no endpoints yet.
    }
}
