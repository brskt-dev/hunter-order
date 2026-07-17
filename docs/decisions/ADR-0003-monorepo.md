# ADR-0003: Use a monorepo

- Status: Accepted
- Date: 2026-07-17

## Decision

Client, server, contracts, tools, documentation and infrastructure live in one repository with independent builds and deployables.

## Rationale

Vertical gameplay tasks often modify several layers. Atomic pull requests and shared agent context are more valuable than independent repository release cycles at this stage.
