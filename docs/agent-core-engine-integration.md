# Agent Core Engine Integration

## Purpose

The `AEGIS Core Engine` should be the single source of truth for agent creation defaults inside the EcoVerse. The immediate goal is to stop each Workshop surface from inventing its own engine version, model label, governance language, and memory posture.

The canonical source is the locked external repository at:

- `I:\AEGIS-CORE-ENGINE`

## Current Foundation

The first integration layer now lives in:

- [I:\AEGIS_ALIGN-ECOVERSE\src\agent-core-engine.js](/I:/AEGIS_ALIGN-ECOVERSE/src/agent-core-engine.js)
- [I:\AEGIS_ALIGN-ECOVERSE\src\generated\core-engine-reference.json](/I:/AEGIS_ALIGN-ECOVERSE/src/generated/core-engine-reference.json)
- [I:\AEGIS_ALIGN-ECOVERSE\src\agent-workshop-activation.js](/I:/AEGIS_ALIGN-ECOVERSE/src/agent-workshop-activation.js)
- [I:\AEGIS_ALIGN-ECOVERSE\scripts\sync-core-engine-reference.mjs](/I:/AEGIS_ALIGN-ECOVERSE/scripts/sync-core-engine-reference.mjs)

This foundation does three things:

1. generates a read-only reference snapshot from the canon-locked Core repo during build
2. binds Workshop creation surfaces to that manifest
3. stores the current draft agent with the active Core Engine version in local browser state

## Propagation Model

### Stage 1: Workshop Binding

Every Workshop creation surface should derive from the synchronized Core Engine snapshot for:

- core engine version
- governance invariants
- logic defaults
- memory architecture defaults
- deployment posture

This is now the rule for:

- `create-new-agent-flow`
- `create-new-agent-identity-configuration`
- `create-new-agent-logic-intelligence`
- `create-new-agent-memory-rag`
- `create-new-agent-dataquad-memory-configuration`

### Stage 2: Exported Agent Manifest

When the Workshop produces a real agent manifest, the exported object should include:

- `coreEngineId`
- `coreEngineVersion`
- `releasedAt`
- current invariants
- current defaults snapshot

That makes every created agent auditable against the Core Engine version it was born from.

### Stage 3: EcoVerse Propagation

When the Core Engine changes, the change should not be hand-copied page by page. Instead:

1. update the canon-locked Core repository
2. rebuild the Workshop bundle
3. let the EcoVerse surfaces inherit the new Core snapshot from the build-time sync step

## Truth Conditions

This integration does **not** yet mean there is a backend-driven global agent engine.

What is true now:

- Workshop creation surfaces are browser-bound to one synchronized Core Engine reference
- agent draft state records the active Core Engine version
- creation pages no longer need independent fake engine/version claims

What is still pending:

- cross-repo propagation into standalone apps
- backend manifest publishing
- automatic upgrade migration of already-created agents
- real-time synchronization between the EcoVerse shell and external app repositories

## Recommended Next Steps

1. Rewrite `model-deployment-flow` so it consumes the same synchronized Core Engine reference.
2. Replace any remaining fake engine/version labels in Workshop deployment and monitoring pages.
3. Define a shared manifest contract for standalone AEGIS apps so they can publish compatible Core Engine metadata back into the EcoVerse.
4. Add a build-time validation that fails if Workshop pages hard-code a different engine version than the shared manifest.
