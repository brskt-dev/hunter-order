using HunterOrder.SharedKernel.Modules;

using Microsoft.AspNetCore.Routing;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace HunterOrder.Modules.Characters;

/// <summary>
/// Characters module. Infrastructure shell only — registers no services and maps no
/// endpoints yet (no gameplay mechanics in this foundation).
/// </summary>
public sealed class CharactersModule : IModule
{
    public string Name => "Characters";

    public void RegisterServices(IServiceCollection services, IConfiguration configuration)
    {
        // Intentionally empty: this module has no services yet.
    }

    public void MapEndpoints(IEndpointRouteBuilder endpoints)
    {
        // Intentionally empty: this module has no endpoints yet.
    }
}
