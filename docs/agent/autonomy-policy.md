# Autonomous development policy

## Purpose

Allow coding agents to work for long periods while preserving human authority over product, architecture and irreversible actions.

## Level A — decide and apply

The agent may decide without escalation:

- Local names and private implementation details
- File organization inside an established module
- Tests and test fixtures
- Error handling consistent with existing conventions
- Small refactors required by the task
- Documentation updates describing implemented behavior
- Lint, formatting and static-analysis fixes

## Level B — decide, apply and report

The agent may proceed but must record the decision:

- A new private abstraction inside one module
- A small internal contract adjustment
- A non-destructive schema addition
- A performance tradeoff that remains inside documented budgets
- Resolution of minor ambiguity that does not change player experience

## Level C — request human decision

The agent must not decide:

- Gameplay behavior, balance, economy or progression
- Lore, terminology or player-facing promises
- Public protocol breaking changes
- New infrastructure platforms or architectural boundaries
- New paid services or material cost changes
- Destructive or irreversible migrations
- Security-policy changes
- Scope expansion beyond the task
- Any conflict between approved documentation and requested behavior

## Continue around blockers

A Level C decision must not stop unrelated work. Isolate the dependency, implement safe independent pieces and create a structured decision request.

## Forbidden actions

- Direct commits to protected branches
- Merge or deployment
- Production access
- Secret retrieval or modification
- Destructive data operations
- Disabling tests, linters or security controls to obtain a passing build
- Rewriting approved game-design documents without authorization
- Claiming success when validation was not executed
