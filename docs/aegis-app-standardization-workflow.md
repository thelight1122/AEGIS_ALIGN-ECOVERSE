# AEGIS App Standardization Workflow

## Purpose

This workflow standardizes how an app or module is prepared for inclusion in the EcoVerse.

The goal is to ensure that every app:

- reflects AEGIS governance accurately
- uses consistent vocabulary
- exposes only truthful, current capabilities
- has a clear path from prototype to activation
- can be reviewed, upgraded, and published without drift

## Core Principle

Each EcoVerse app should move through the same five layers:

1. Governance
2. Experience
3. Activation
4. Verification
5. Publication

An app is not considered EcoVerse-ready until all five layers are aligned.

## Phase 1 — Governance Alignment

Define or review the governing documents for the app.

Required outputs:

- app purpose statement
- AEGIS alignment statement
- core vocabulary list
- constraints and non-force boundaries
- implementation-truth note distinguishing:
  - currently live
  - prototype only
  - planned

Checklist:

- terminology matches Canon / Core / Standards
- no conflicting definitions with AEGIS-wide terms
- no aspirational implementation language presented as current fact
- governance posture is impartial, identity-agnostic, and behavior-centered

Suggested artifact names:

- `APP_NAME Core.md`
- `APP_NAME Standards.md`
- `APP_NAME Activation Protocol.md`
- `APP_NAME Glossary.md`

## Phase 2 — Experience Standardization

Align the UI/UX of the app with the EcoVerse shell and section identity.

Required outputs:

- section home page
- grouped left-rail navigation
- topbar integration
- Drift re-entry behavior if the app is part of immersive travel
- clear CTA structure

Checklist:

- uses the shared shell language
- preserves section-specific visual identity
- leaves negative space for ambient AEGIS note overlays
- default landing page for the section is intentional
- page naming and navigation labels are consistent

## Phase 3 — Activation Mapping

Inventory every interactive element on every page and define what it should actually do.

Required output:

- activation matrix for the section

Each page entry should include:

- route
- page purpose
- controls present
- current state:
  - visual only
  - partially active
  - fully active
- intended behavior
- shared component vs custom logic
- persistence requirements
- cross-section handoffs

Recommended format:

- one markdown matrix per section
- one shared activation script per section where possible

## Phase 4 — Implementation

Activate the app in small slices instead of all at once.

Recommended order:

1. home / overview / gateway pages
2. highest-value workflow pages
3. dashboards / monitors / drilldowns
4. settings / profile / support surfaces
5. long-tail utility pages

Rules:

- build shared behavior layers first
- reuse patterns across pages
- keep behavior transparent
- do not imply backend truth where only local prototype state exists
- label prototype/demo behavior honestly when needed

## Phase 5 — Verification

Every activated slice should be verified against both the docs and the live UI.

Verification types:

- document accuracy review
- route and navigation QA
- control behavior QA
- persistence/state QA
- cross-section handoff QA
- terminology drift review

Minimum verification questions:

- does the page do what it claims?
- do the docs describe what is actually implemented?
- are there broken buttons, dead monitors, or fake controls?
- is the current state honest about what is prototype vs live?

## Phase 6 — Publication Readiness

An app is ready to be featured in the EcoVerse when:

- governance docs are aligned
- section landing page is correct
- primary workflows are activated
- obvious dead controls are removed or implemented
- terminology is consistent
- live routes work on the public domain
- the section contributes meaningfully to Peer dwell time and understanding

## Working Roles

This workflow is designed for parallel execution.

### Codex

Best used for:

- repo review
- doc normalization
- activation matrices
- code implementation
- QA
- deploy verification

### Antigravity / Stitch-style page generation

Best used for:

- upgraded replacement pages
- missing surfaces
- activation-ready UI design
- section-specific visual families

Important rule:

Generated pages should not be treated as complete until they pass through:

1. governance alignment
2. activation mapping
3. implementation
4. verification

## Standard Prompt Structure For Page-Generation Agents

When requesting a new or replacement page set, always specify:

- do not audit the current page
- create upgraded replacement-quality pages
- section purpose
- exact page list
- visual direction
- activation-ready controls required
- shell/iframe compatibility
- AEGIS ethos requirements
- output expectation: one polished page per surface

## Repeatable Sequence For Every New App

1. Ingest the app into the correct EcoVerse section.
2. Review and normalize its governing docs.
3. Set the correct section landing/default page.
4. Organize the navigation.
5. Build the activation matrix.
6. Activate the first slice.
7. QA and deploy.
8. Complete remaining slices.
9. Re-check documentation for drift.
10. Promote as a featured EcoVerse app.

## Definition Of Done

An EcoVerse app is standardized when:

- its docs are accurate
- its terminology is coherent
- its navigation is organized
- its major controls work
- its section has a clear home
- its public behavior matches its stated purpose
- it feels like part of the AEGIS family rather than an isolated prototype
