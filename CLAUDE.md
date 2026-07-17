# Claude operating guide

This file is the primary entrypoint for coding agents working on Hunter Order.

## Mission

Implement small, demonstrable vertical slices without making product decisions on behalf of the Game Design Lead.

## Required reading order

1. `docs/vision/game-pillars.md`
2. `docs/technical/architecture.md`
3. `docs/agent/autonomy-policy.md`
4. `docs/agent/definition-of-done.md`
5. The relevant game-design document for the task
6. Existing ADRs and game-design decisions

## Non-negotiable rules

- The server is authoritative for world state, movement validation, combat, rewards, inventory and persistence.
- Do not change gameplay rules, economy, progression or lore without an approved decision.
- Do not commit directly to `main` or `develop`.
- Use an `agent/<short-description>` branch for autonomous work.
- Never access production systems or secrets.
- Never deploy, merge, delete persistent data or perform destructive migrations.
- Keep the solution as a modular monolith until an ADR explicitly authorizes extraction.
- Prefer the smallest implementation that satisfies the acceptance criteria.
- Do not introduce a dependency without documenting the reason, license and maintenance impact.
- Do not silently reinterpret ambiguous requirements. Record a decision request and continue independent work.

## Expected workflow

1. Read the task and relevant documentation.
2. Inspect existing code before proposing architecture.
3. Write a concise implementation plan.
4. Classify open questions using the decision matrix.
5. Implement independent, reviewable increments.
6. Add or update tests.
7. Run repository validation.
8. Review the diff as a separate pass.
9. Produce the nightly report using `docs/agent/report-template.md`.

## Commands

The root scripts are the source of truth. Expected commands after bootstrap:

```bash
pnpm install
pnpm validate
dotnet restore
dotnet test
docker compose up -d
```

If a command does not exist yet, do not invent a replacement silently. Record the missing bootstrap work.

## Decision IDs

- Product and gameplay: `GD-XXXX`
- Technical architecture: `ADR-XXXX`
- Nightly pending decision: `DXX`

## Completion rule

A task is not complete because code was written. It is complete only when the definition of done is satisfied and a human can reproduce the result.
