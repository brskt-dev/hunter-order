using HunterOrder.SharedKernel.Modules;

using Microsoft.AspNetCore.Routing;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace HunterOrder.Api.Modules;

/// <summary>
/// Wires the modular monolith: each module registers its own services and
/// endpoints; the host stays agnostic of module internals (ADR-0001).
/// </summary>
public static class ModuleRegistrationExtensions
{
    public static IServiceCollection AddModules(
        this IServiceCollection services,
        IConfiguration configuration,
        IReadOnlyList<IModule> modules)
    {
        ArgumentNullException.ThrowIfNull(services);
        ArgumentNullException.ThrowIfNull(configuration);
        ArgumentNullException.ThrowIfNull(modules);

        var duplicate = modules
            .GroupBy(module => module.Name, StringComparer.OrdinalIgnoreCase)
            .FirstOrDefault(group => group.Count() > 1);
        if (duplicate is not null)
        {
            throw new InvalidOperationException($"Duplicate module name registered: '{duplicate.Key}'.");
        }

        services.AddSingleton(new ModuleRegistry(modules));

        foreach (var module in modules)
        {
            module.RegisterServices(services, configuration);
        }

        return services;
    }

    public static IEndpointRouteBuilder MapModules(this IEndpointRouteBuilder endpoints)
    {
        ArgumentNullException.ThrowIfNull(endpoints);

        var registry = endpoints.ServiceProvider.GetRequiredService<ModuleRegistry>();
        foreach (var module in registry.Modules)
        {
            module.MapEndpoints(endpoints);
        }

        return endpoints;
    }
}
