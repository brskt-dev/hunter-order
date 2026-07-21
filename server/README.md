# Hunter Order — Server

.NET 10 server for Hunter Order, built as a **modular monolith** (ADR-0001) and
**server-authoritative** by design (ADR-0002). This is the technical foundation:
hosting, cross-cutting infrastructure and empty module boundaries. **No gameplay,
persistence, authentication or realtime networking yet.**

Full design: [`docs/technical/server-architecture.md`](../docs/technical/server-architecture.md).

## Layout

```text
server/
  HunterOrder.slnx                 Solution (slnx: .NET 10 default format)
  Directory.Packages.props         Central Package Management (versions)
  Dockerfile                       Multi-stage build of the Bootstrap host
  src/
    HunterOrder.SharedKernel/      Primitives (Result/Error) + IModule contract
    HunterOrder.Api/               Building blocks: module wiring, error handling,
                                   health checks, OpenTelemetry, Serilog, DI ext.
    HunterOrder.Bootstrap/         Executable host (Program.cs, appsettings, catalog)
    Modules/
      Identity, Accounts, Characters, World, Simulation, Movement,
      Combat, Inventory, Gathering, Clans, Chat, Administration   (IModule shells)
  tests/
    HunterOrder.UnitTests/         SharedKernel + module registration
    HunterOrder.IntegrationTests/  Health, root and error handling (WebApplicationFactory)
```

Dependency direction: `Modules → SharedKernel`, `Api → SharedKernel`,
`Bootstrap → Api + Modules`. Modules never reference each other.

## Requirements

- .NET SDK 10 (pinned in [`global.json`](../global.json)). Multiple SDKs may be
  installed; the pin selects 10.x.

## Commands

From the repository root:

```bash
dotnet restore server/HunterOrder.slnx
dotnet build   server/HunterOrder.slnx -c Release
dotnet test    server/HunterOrder.slnx -c Release

# Run the host (Development)
dotnet run --project server/src/HunterOrder.Bootstrap
# or:  scripts/run-server.sh   |   scripts/run-server.ps1
```

Container:

```bash
docker build -f server/Dockerfile -t hunter-order-server .
docker compose up server          # exposes http://localhost:8080
```

## Endpoints

| Endpoint             | Purpose                                             |
| -------------------- | -------------------------------------------------- |
| `GET /`              | Service info (name, status, environment)           |
| `GET /health/live`   | Liveness (process up; no dependency checks)        |
| `GET /health/ready`  | Readiness (all registered checks; none yet)        |
| `GET /_diagnostics/throw` | Non-production only: exercises the error handler |

## Configuration

- `appsettings.json` + `appsettings.{Environment}.json` (Development/Production).
- Logging: **Serilog**, configured from the `Serilog` section (env-driven levels).
- Telemetry: **OpenTelemetry** traces + metrics. Console exporter in Development;
  OTLP exporter when `OpenTelemetry:OtlpEndpoint` (or `OTEL_EXPORTER_OTLP_ENDPOINT`)
  is set.
- Errors: unhandled exceptions become RFC 9457 ProblemDetails responses.

## Adding a module

1. Create `src/Modules/<Name>/HunterOrder.Modules.<Name>.csproj` (reference
   SharedKernel) and a `<Name>Module : IModule`.
2. `dotnet sln server/HunterOrder.slnx add …`.
3. Add a project reference in `HunterOrder.Bootstrap.csproj` and an entry in
   `ModuleCatalog`.
