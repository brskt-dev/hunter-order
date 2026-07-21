using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.DependencyInjection;

using Serilog;

namespace HunterOrder.Api.Logging;

public static class SerilogExtensions
{
    /// <summary>
    /// Registers Serilog as the logging provider, reading its configuration from
    /// the app configuration (the "Serilog" section), so log levels and sinks are
    /// environment-driven.
    /// </summary>
    public static WebApplicationBuilder AddHunterOrderLogging(this WebApplicationBuilder builder)
    {
        ArgumentNullException.ThrowIfNull(builder);

        builder.Services.AddSerilog((services, loggerConfiguration) =>
            loggerConfiguration
                .ReadFrom.Configuration(builder.Configuration)
                .ReadFrom.Services(services)
                .Enrich.FromLogContext());

        return builder;
    }
}
