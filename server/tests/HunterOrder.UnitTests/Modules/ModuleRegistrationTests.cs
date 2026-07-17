using HunterOrder.Api.Modules;
using HunterOrder.SharedKernel.Modules;

using Microsoft.AspNetCore.Routing;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

using Xunit;

namespace HunterOrder.UnitTests.Modules;

public sealed class ModuleRegistrationTests
{
    private static IConfiguration EmptyConfiguration => new ConfigurationBuilder().Build();

    [Fact]
    public void AddModules_registers_the_registry_and_invokes_each_module()
    {
        var services = new ServiceCollection();
        var registered = false;
        var module = new FakeModule("Alpha", _ => registered = true);

        services.AddModules(EmptyConfiguration, [module]);
        using var provider = services.BuildServiceProvider();

        Assert.True(registered);
        var registry = provider.GetRequiredService<ModuleRegistry>();
        Assert.Single(registry.Modules);
        Assert.Equal("Alpha", registry.Modules[0].Name);
    }

    [Fact]
    public void AddModules_rejects_duplicate_names_case_insensitively()
    {
        var services = new ServiceCollection();
        IReadOnlyList<IModule> modules = [new FakeModule("Dup"), new FakeModule("dup")];

        Assert.Throws<InvalidOperationException>(() => services.AddModules(EmptyConfiguration, modules));
    }

    private sealed class FakeModule(string name, Action<IServiceCollection>? onRegister = null) : IModule
    {
        public string Name => name;

        public void RegisterServices(IServiceCollection services, IConfiguration configuration) =>
            onRegister?.Invoke(services);

        public void MapEndpoints(IEndpointRouteBuilder endpoints)
        {
            // No-op for the fake.
        }
    }
}
