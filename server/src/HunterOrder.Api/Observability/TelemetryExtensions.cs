using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;

using OpenTelemetry;
using OpenTelemetry.Metrics;
using OpenTelemetry.Resources;
using OpenTelemetry.Trace;

namespace HunterOrder.Api.Observability;

public static class TelemetryExtensions
{
    private const string ServiceName = "HunterOrder";

    /// <summary>
    /// Configures OpenTelemetry traces and metrics (ASP.NET Core, HTTP client and
    /// runtime instrumentation). Exports to the console in Development and, when
    /// an OTLP endpoint is configured, via OTLP.
    /// </summary>
    public static WebApplicationBuilder AddHunterOrderObservability(this WebApplicationBuilder builder)
    {
        ArgumentNullException.ThrowIfNull(builder);

        var otlpEndpoint = builder.Configuration["OpenTelemetry:OtlpEndpoint"]
            ?? Environment.GetEnvironmentVariable("OTEL_EXPORTER_OTLP_ENDPOINT");
        var hasOtlp = !string.IsNullOrWhiteSpace(otlpEndpoint);
        var isDevelopment = builder.Environment.IsDevelopment();

        builder.Services
            .AddOpenTelemetry()
            .ConfigureResource(resource => resource.AddService(ServiceName))
            .WithTracing(tracing =>
            {
                tracing
                    .AddAspNetCoreInstrumentation()
                    .AddHttpClientInstrumentation();

                if (isDevelopment)
                {
                    tracing.AddConsoleExporter();
                }

                if (hasOtlp)
                {
                    tracing.AddOtlpExporter();
                }
            })
            .WithMetrics(metrics =>
            {
                metrics
                    .AddAspNetCoreInstrumentation()
                    .AddHttpClientInstrumentation()
                    .AddRuntimeInstrumentation();

                if (hasOtlp)
                {
                    metrics.AddOtlpExporter();
                }
            });

        return builder;
    }
}
