using HunterOrder.Api.Diagnostics;
using HunterOrder.Api.Logging;
using HunterOrder.Api.Modules;
using HunterOrder.Api.Observability;
using HunterOrder.SharedKernel.Modules;

using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;

using Serilog;

namespace HunterOrder.Api;

/// <summary>
/// Top-level composition for the Hunter Order host. Keeps <c>Program</c> small:
/// the builder wires cross-cutting infrastructure and modules; the app wires the
/// request pipeline and endpoints.
/// </summary>
public static class HunterOrderApiExtensions
{
    public static WebApplicationBuilder AddHunterOrder(
        this WebApplicationBuilder builder,
        IReadOnlyList<IModule> modules)
    {
        ArgumentNullException.ThrowIfNull(builder);
        ArgumentNullException.ThrowIfNull(modules);

        builder.AddHunterOrderLogging();
        builder.AddHunterOrderObservability();

        builder.Services.AddProblemDetails();
        builder.Services.AddExceptionHandler<GlobalExceptionHandler>();
        builder.Services.AddHealthChecks();

        builder.Services.AddModules(builder.Configuration, modules);

        return builder;
    }

    public static WebApplication UseHunterOrder(this WebApplication app)
    {
        ArgumentNullException.ThrowIfNull(app);

        app.UseExceptionHandler();
        app.UseSerilogRequestLogging();

        app.MapGet("/", (IHostEnvironment environment) => Results.Ok(new
        {
            name = "Hunter Order",
            status = "ok",
            environment = environment.EnvironmentName,
        }));

        // Non-production diagnostics endpoint to exercise the global exception
        // handler. Excluded from Production; not mapped there.
        if (!app.Environment.IsProduction())
        {
            app.MapGet(
                "/_diagnostics/throw",
                IResult () => throw new InvalidOperationException("Diagnostics test exception."));
        }

        app.MapHunterOrderHealthChecks();
        app.MapModules();

        return app;
    }
}
