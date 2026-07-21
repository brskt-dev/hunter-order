# Documentation workflow

> Status: Approved
> Owner: Game Design Lead and Technical Lead
> Last reviewed: 2026-07-20

## Source of truth

The Git repository is the source of truth for Hunter Order documentation.

Notion, chats, whiteboards and temporary notes may support discussion, but they do not authorize implementation. A decision becomes authoritative only when it is represented in the appropriate repository document and reviewed through the normal Git workflow.

## Information lifecycle

### 1. Idea or question

Unapproved ideas, references and unresolved questions should be captured in a GitHub Issue or another clearly non-authoritative discussion surface.

An idea must not be implemented as a gameplay rule merely because it exists in discussion history.

### 2. Human decision

Material product, gameplay, economy, progression or lore choices require human approval.

Create or update a `GD-XXXX` record when the decision changes player-facing behavior, establishes a durable rule or resolves meaningful alternatives.

Technical architecture decisions use `ADR-XXXX`.

### 3. Approved specification

After approval, update the relevant document:

- stable promise and philosophy -> `docs/vision/`;
- approved gameplay behavior -> `docs/game-design/`;
- technical implementation guidance -> `docs/technical/`;
- autonomous operating rules -> `docs/agent/`.

The decision record explains why. The specification explains how the approved behavior works.

### 4. Implementation

An implementation task must link the relevant approved documents and decisions. Agents must escalate contradictions instead of choosing which source to trust silently.

### 5. Validation and maintenance

When behavior changes, the same PR should update applicable specifications and decision records. Documentation that no longer reflects the product must be updated or explicitly marked superseded.

## Required document metadata

New product and design documents should include:

```text
> Status: Approved | Mixed | Proposal | Superseded
> Owner: <role>
> Last reviewed: YYYY-MM-DD
```

## Writing rules

- Use descriptive lowercase kebab-case filenames.
- Write authoritative repository documentation in English unless a separate localization policy is approved.
- Separate approved rules from proposals and open questions.
- Prefer links over duplicated definitions.
- Record conflicts and superseded statements explicitly.
- Do not convert examples into requirements accidentally.
- Avoid implementation details in the constitution and stable vision documents.
- Avoid gameplay promises inside technical documents.

## Review rules

A documentation PR should answer:

- What source material was used?
- Which statements are approved?
- Which statements remain proposals?
- What contradictions were resolved?
- What older statements were superseded?
- Which implementation decisions remain blocked?

## External-source migration

When migrating an external source:

1. preserve an audit link in `docs/migrations/`;
2. split mixed content by authority and subject;
3. remove duplicates;
4. resolve conflicts using the latest explicit human decision;
5. retain unresolved concepts as proposals or open questions;
6. never copy an obsolete source-of-truth rule unchanged.
