# Claude operating guide

This file is the primary entrypoint for coding agents working on Hunter Order.

## Mission

Implement small, demonstrable vertical slices without making product decisions on behalf of the Game Design Lead.

## Required reading order

1. `docs/vision/game-constitution.md`
2. `docs/vision/game-pillars.md`
3. `docs/README.md`
4. `docs/technical/architecture.md`
5. `docs/agent/autonomy-policy.md`
6. `docs/agent/definition-of-done.md`
7. The relevant game-design document for the task
8. Existing ADRs and game-design decisions

## Documentation authority

- Markdown committed to this repository is the authoritative source of truth.
- External notes, chats, Notion pages and whiteboards are non-binding until migrated into the repository.
- Approved vision belongs in `docs/vision/`.
- Approved gameplay specifications belong in `docs/game-design/`.
- Product and gameplay decisions use `GD-XXXX` records in `docs/decisions/`.
- Unresolved product questions must be escalated instead of inferred from old notes.

## Non-negotiable rules

- The server is authoritative for world state, movement validation, combat, rewards, inventory and persistence.
- Do not change gameplay rules, economy, progression or lore without an approved decision.
- Do not commit directly to `main` or `dev`.
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

## Branch policy

All autonomous implementation work must start from the latest `dev` branch.

Before making changes:

1. Confirm the working tree is clean.
2. Checkout `dev`.
3. Pull the latest changes from `origin/dev`.
4. Create a new branch using:

   `agent/<short-kebab-case-task-name>`

Examples:

- `agent/basic-player-movement`
- `agent/resource-gathering`
- `agent/world-zone-bootstrap`

Never commit directly to:

- `main`
- `dev`

Pull requests created by autonomous agents must target `dev`.

Only human-approved release pull requests may target `main`.

## Git safety rules

The agent may:

- create `agent/*` branches;
- create commits;
- push its own branch;
- open draft pull requests targeting `dev`;
- update its own pull request.

The agent must not:

- push directly to `main` or `dev`;
- force push;
- delete remote branches;
- merge pull requests;
- approve its own pull request;
- modify branch protection rules;
- rewrite shared history;
- use `git reset --hard` on uncommitted human work.

## PixelLab MCP

Quando precisar consultar a documentação das ferramentas do PixelLab, utilize:

@https://api.pixellab.ai/mcp/docs

Não gere assets definitivos sem uma especificação de estilo registrada em
`docs/art-direction/`.

## Consulta ao Notion

Você possui acesso ao meu workspace do Notion.

Antes de iniciar a implementação, consulte a página **"Ideias e Conceitos"** para compreender a visão do Hunter Order.

Utilize o Notion como fonte de contexto para entender:

- visão geral do projeto;
- ideias registradas;
- conceitos de gameplay;
- inspirações;
- decisões já documentadas;
- observações importantes.

Caso existam divergências entre o Notion, o `CLAUDE.md` e minhas instruções durante a conversa, siga sempre esta ordem de prioridade:

1. Minhas instruções nesta conversa.
2. `CLAUDE.md`.
3. Documentação do repositório.
4. Notion.

O Notion deve ser tratado como uma base de conhecimento e consulta.

Não considere ideias registradas como requisitos obrigatórios, a menos que estejam explicitamente definidas como decisões aprovadas ou que eu confirme sua implementação.
