# ADR-0001: Start as a modular monolith

- Status: Accepted
- Date: 2026-07-17

## Context

Hunter Order requires rapid vertical development across client, protocol, simulation and persistence. Premature distribution would increase operational and coordination cost.

## Decision

The server starts as one deployable .NET application with explicit internal module boundaries.

## Consequences

- Cross-module calls remain in process initially
- Modules must not access another module's persistence internals directly
- Extraction into a service requires a new ADR and measured justification
