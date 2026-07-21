# Server architecture

Architecture of the Hunter Order .NET 10 server (`server/`). This document covers
the **infrastructure foundation** only — no gameplay, persistence, authentication
or realtime networking exists yet.

See also: [`architecture.md`](./architecture.md), [ADR-0001 (modular monolith)](../decisions/ADR-0001-modular-monolith.md),
[ADR-0002 (server-authoritative)](../decisions/ADR-0002-server-authoritative.md),
and the package [README](../../server/README.md).

## Goals

- One deployable .NET application with explicit internal module boundaries
  (ADR-0001), ready to grow toward an MMORPG without early distribution.
- Cross-cutting concerns (DI, config, logging, telemetry, health, error handling)
  solved once and shared by all modules.
- Framework-light domain code: primitives are Phaser/ASP.NET-agnostic where they
  can be, and infrastructure is unit-testable.

## Projects and dependencies

Dependencies point downward only:

```text
Bootstrap  (executable host: Program, appsettings, ModuleCatalog)
   │  → Api + all Modules
Api        (building blocks: module wiring, error handling, health,
   │        OpenTelemetry, Serilog, composition extensions)
   │  → SharedKernel
Modules/*  (Identity, Accounts, Characters, World, Simulation, Movement,
   │        Combat, Inventory, Gathering, Clans, Chat, Administration)
   │  → SharedKernel        (never reference each other)
SharedKernel (Result/Error primitives + IModule contract; web-aware kernel)
```

- **SharedKernel** — `Result`/`Error` primitives and the `IModule` contract. It
  carries a `FrameworkReference` to ASP.NET so the module contract can speak in
  `IServiceCollection` / `IEndpointRouteBuilder`.
- **Api** — reusable building blocks: `AddHunterOrder` / `UseHunterOrder`
  composition, module registration + discovery, `GlobalExceptionHandler`,
  health-check mapping, OpenTelemetry and Serilog setup.
- **Bootstrap** — the runnable host. `Program.cs` is intentionally tiny; the
  `ModuleCatalog` lists the modules to compose.
- **Modules/** — one class library per bounded context, each implementing
  `IModule`. All are empty shells (no services, no endpoints) in this foundation.

## The module contract (ADR-0001)

```csharp
public interface IModule
{
    string Name { get; }
    void RegisterServices(IServiceCollection services, IConfiguration configuration);
    void MapEndpoints(IEndpointRouteBuilder endpoints);
}
```

`AddModules(...)` validates unique names, stores a `ModuleRegistry`, and calls
`RegisterServices` for each module. `MapModules()` later calls `MapEndpoints`.
Modules are composed **explicitly** via `ModuleCatalog` (no reflection) for clear,
predictable ordering. Modules must not touch another module's internals or
persistence.

## Cross-cutting infrastructure

- **Dependency injection** — the built-in container; each module owns its
  registrations.
- **Configuration by environment** — `appsettings.json` +
  `appsettings.{Environment}.json`; log levels and the OTLP endpoint are config-
  driven.
- **Logging** — Serilog, configured from the `Serilog` config section, replacing
  the default provider. Request logging via `UseSerilogRequestLogging`.
- **OpenTelemetry** — traces + metrics with ASP.NET Core, HTTP client and runtime
  instrumentation. Console exporter in Development; OTLP exporter when an endpoint
  is configured.
- **Health checks** — `/health/live` (liveness) and `/health/ready` (readiness).
- **Global error handling** — `IExceptionHandler` + ProblemDetails (RFC 9457).

## Testing strategy

- **Unit tests** cover Phaser/host-free logic: `Result` primitives and module
  registration.
- **Integration tests** boot the real host with `WebApplicationFactory<Program>`
  and assert health/root endpoints and that unhandled exceptions become
  ProblemDetails. `Program` is a `public partial class` so the factory can host it.

## Tooling decisions

- **Solution format**: `.slnx` — the .NET 10 default (and matches the existing
  Server CI path filter). This is the "HunterOrder.sln" from the task brief in the
  current SDK's format.
- **Central Package Management** (`Directory.Packages.props`): one place for NuGet
  versions across all projects.
- **Warnings as errors + analyzers** (root `Directory.Build.props`): the build is
  warning-clean; NuGet audit (`NU1902`) also fails the build, so vulnerable
  packages are not allowed.
- **SDK pin** (`global.json`): selects .NET 10 deterministically.

## Explicitly out of scope (this foundation)

Functional database/EF, authentication, characters, WebSocket/realtime, and any
game rules. Module shells and the `IModule` seam exist so these can be added
without reworking the host.
