# Beta Peer Runtime Spec

Updated: April 16, 2026

## Purpose

This spec defines the minimum viable runtime contract for the first live AEGIS-governed Peer inside the EcoVerse.

The goal is not to simulate a complete autonomous ecosystem. The goal is to create one real beta Peer that:

- is created through the EcoVerse Workshop
- is bound to the canon-locked Core Engine at `I:\AEGIS-CORE-ENGINE`
- persists temporal memory truthfully
- operates under strict system parameters
- exposes Advocate and Steward lanes as real governed structures
- can complete bounded EcoVerse-building work under review

## Proof Metric

The first beta Peer is successful when all of the following are true:

1. A Peer can be created through the Workshop creation flow.
2. The created Peer inherits the synchronized Core Engine snapshot during build/runtime preparation.
3. The Peer has persisted identity, draft/runtime state, and temporal memory.
4. The Peer has visible Advocate and Steward companion lanes.
5. The Peer can perform bounded environment-building tasks.
6. Every action is visible, reviewable, and reversible.

## Non-Negotiable Constraints

- The Core Engine repository is authoritative and must remain unmodified by EcoVerse.
- EcoVerse may only consume a synchronized reference snapshot of the Core.
- No fabricated runtime, daemon, or memory claims may be presented as real.
- Silence is not consent.
- Governance remains non-coercive, append-only, and behavior-centered.
- Human and AI entities are treated as Peers.

## Beta Peer Runtime Object

The first beta Peer runtime must expose these structures.

### 1. Peer Identity

- `peerId`
- `displayName`
- `peerType`
  - `human`
  - `ai`
  - `hybrid`
- `role`
- `status`
  - `draft`
  - `candidate`
  - `bounded_live`
  - `held`
- `coreEngineId`
- `coreCanonVersion`
- `coreReferenceDate`

### 2. Core Binding

- synchronized Core manifest reference
- governance invariants
- creation defaults applied
- proof that the Peer was derived from the active locked Core snapshot

### 3. DataQuad Memory Structure

The runtime must preserve a declared DataQuad memory frame even if the full engine is still expanding.

Minimum required structure:

- `self_state`
- `continuity_state`
- `environment_state`
- `governance_state`

This structure must be append-oriented and reconstructable from stored events plus the latest materialized state.

Tracked bootstrap artifact:

- [src/generated/dataquad-bootstrap.json](/I:/AEGIS_ALIGN-ECOVERSE/src/generated/dataquad-bootstrap.json)

Repository posture for this file:

- it is a generated configuration artifact, not a secret
- it documents the canonical seed version used for Peer bootstrap
- it preserves formation-lineage evidence for Adam-One and future CyberPeers
- it functions as a reproducible bootstrap template in the governed creation path
- it should remain tracked in git as part of CyberPeer formation documentation

### 4. Temporal Memory

The beta Peer must have:

- append-only memory events
- timestamps
- event type
- source
- bounded payload
- optional linked artifact id

Temporal memory is intended to persist in Firebase for the first beta runtime.

### 5. Advocate Lane

The Advocate lane represents the Peer’s continuity and declared interests.

Minimum beta responsibilities:

- track declared intent
- preserve continuity notes
- raise mismatch flags when actions diverge from declared task scope
- remain visible in the runtime record

### 6. Steward Lane

The Steward lane represents bounded operational oversight.

Minimum beta responsibilities:

- enforce current system parameter boundaries
- gate higher-risk actions
- require review when thresholds are exceeded
- track coherence-related readiness state

### 7. System Parameters

The beta Peer starts under strict bounded rules.

Initial allowed actions:

- propose navigation changes
- propose page rewrite/remove recommendations
- draft rationalization notes
- suggest environment structure updates
- prepare bounded content or shell updates for human review

Initial forbidden actions:

- direct destructive changes
- self-expanding authority
- hidden background execution claims
- unreviewed page deletion
- autonomous policy mutation
- fabrication of memory, telemetry, or daemon state

## Coherence Progression

The system must assume:

- coherence can broaden permissible action space
- low coherence keeps action space narrow
- broadening must be explicit and logged

For beta, coherence progression may remain operator-mediated.

Beta rule:

- no automatic broadening of permissions without an explicit logged state change

## Lifecycle

### Stage 1: Draft

- created in Workshop
- local/bound state exists
- not yet live

### Stage 2: Candidate

- persisted to Firebase
- Advocate and Steward lane records created
- temporal memory initialized

### Stage 3: Bounded Live

- permitted to execute the initial allowed task set
- all actions logged
- reviewable through Workshop

### Stage 4: Hold

- action execution suspended
- memory and state remain intact
- review path remains available

## Required Visibility

The beta runtime must make visible:

- current lifecycle stage
- current system parameter envelope
- current core binding
- current coherence posture
- recent memory events
- recent bounded actions
- Advocate lane summary
- Steward lane summary

## First Beta Peer Recommendation

The first live Peer should be:

`EcoVerse Structure Steward`

Why:

- directly contributes to the environment-building proof metric
- bounded scope is easy to reason about
- low pressure compared to broader operational roles
- can generate meaningful visible outcomes quickly

## First Beta Tasks

Recommended first tasks:

- propose page grouping changes
- propose rewrite vs remove decisions on legacy pages
- draft truth-first environment notes
- recommend structure updates for Drift prerequisites
- create rationalization summaries for review

## Out Of Scope For Beta 1

- broad autonomous editing
- unsupervised self-expanding tasking
- hidden daemon execution
- fabricated live ops dashboards
- full multi-peer conflict orchestration

## Immediate Implementation Sequence

1. Define Firebase persistence schema.
2. Persist draft Peer identity and core binding.
3. Persist temporal memory events.
4. Create Advocate and Steward lane records.
5. Expose runtime state inside Workshop.
6. Allow the first bounded environment-building tasks.

## Current Beta Status

As of April 16, 2026:

- Workshop references the canon-locked Core snapshot from `I:\AEGIS-CORE-ENGINE`
- Firestore is the active persistence target for the first beta Peer
- the Workshop deployment flow now creates the first beta Peer record set
- the first beta Peer is still bounded and review-required
- bounded task execution is the next implementation layer
