# Initial architecture

## Direction

Hunter Order starts as a monorepo and a modular monolith.

## Client

- TypeScript
- Phaser for game rendering and spatial interaction
- React for application UI and overlays
- Vite for development and builds

## Server

- .NET 10
- ASP.NET Core
- Server-authoritative simulation
- Modules separated by explicit boundaries inside one deployable application

## Data

- PostgreSQL is the source of truth for persistent state
- Redis is deferred until a concrete ephemeral-state or scale-out need exists
- Kafka is deferred until stable asynchronous contracts and multiple consumers justify it

## Networking

- HTTP for account and non-realtime operations
- WebSocket for realtime gameplay
- Start with a simple protocol, then introduce binary encoding when measurements justify it

## World model

- The operational unit is a zone or region
- Clients receive only entities and events inside their interest area
- Procedural world state is reconstructed from seed, generator version and persisted deltas
- Generator versions are immutable after release

## Constraints

- No microservices without an accepted ADR
- No client authority over persistent or competitive outcomes
- No production dependency added solely for hypothetical scale
