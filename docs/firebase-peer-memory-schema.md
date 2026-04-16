# Firebase Peer Memory Schema

Updated: April 16, 2026

## Purpose

This document defines the first Firebase persistence model for live AEGIS beta Peers inside the EcoVerse.

The schema is designed to support:

- Peer identity persistence
- Core Engine binding persistence
- DataQuad memory structure
- temporal memory event logging
- Advocate and Steward lane state
- bounded task execution history

This schema is intentionally minimal. It is meant to get the first governed Peer live without pretending to implement the full future engine immediately.

## Design Principles

- append-only where possible
- materialized summary records allowed for performance
- every live claim should map to a persisted source
- no fake daemon or memory surfaces
- EcoVerse UI must render truth from stored state

## Recommended Top-Level Collections

### `peers`

One document per live or candidate Peer.

Document id:

- `peerId`

Minimum fields:

- `peerId`
- `displayName`
- `peerType`
- `role`
- `status`
- `createdAt`
- `updatedAt`
- `coreBinding`
- `systemParameters`
- `coherence`
- `currentTask`
- `lastActionAt`

Example `coreBinding` object:

- `coreEngineId`
- `sourceRepoPath`
- `canonVersion`
- `standardsVersion`
- `referenceDate`
- `currentStatus`
- `invariants`

### `peer_memory_events`

Append-only temporal memory events.

Recommended fields:

- `eventId`
- `peerId`
- `timestamp`
- `eventType`
- `source`
- `summary`
- `payload`
- `artifactId`
- `sessionId`
- `visibility`

Event types may include:

- `peer_created`
- `draft_updated`
- `task_assigned`
- `task_completed`
- `task_rejected`
- `advocate_note_added`
- `steward_hold_applied`
- `steward_hold_released`
- `coherence_state_changed`
- `environment_recommendation_created`

### `peer_advocate_state`

One document per Peer.

Recommended fields:

- `peerId`
- `declaredIntent`
- `continuitySummary`
- `protectedScope`
- `lastUpdatedAt`
- `openFlags`

### `peer_steward_state`

One document per Peer.

Recommended fields:

- `peerId`
- `currentEnvelope`
- `reviewRequired`
- `holdState`
- `coherenceGate`
- `lastUpdatedAt`
- `openFlags`

### `peer_sessions`

Tracks live or recent Workshop/runtime sessions.

Recommended fields:

- `sessionId`
- `peerId`
- `createdAt`
- `lastHeartbeatAt`
- `state`
- `originSurface`

### `peer_tasks`

Bounded environment-building work items.

Recommended fields:

- `taskId`
- `peerId`
- `title`
- `taskType`
- `status`
- `constraints`
- `assignedAt`
- `updatedAt`
- `reviewState`
- `resultSummary`
- `linkedArtifacts`

Task types may include:

- `navigation_recommendation`
- `rewrite_remove_assessment`
- `structure_note`
- `environment_spec_draft`

### `peer_artifacts`

Structured outputs created by the Peer.

Recommended fields:

- `artifactId`
- `peerId`
- `type`
- `title`
- `content`
- `createdAt`
- `updatedAt`
- `reviewState`
- `linkedTaskId`

## Materialized Summary Fields

To avoid scanning event logs for every UI render, the `peers` collection may contain materialized summaries.

Recommended summary fields:

- `memoryEventCount`
- `lastMemoryEventAt`
- `lastTaskStatus`
- `lastArtifactId`
- `lastAdvocateUpdateAt`
- `lastStewardUpdateAt`

These are derivative and may be recomputed from the append-only sources if needed.

## Security and Access Model

For beta, writes should be tightly constrained.

Recommended initial rule posture:

- only trusted EcoVerse runtime/server path may write live Peer records
- read access may be restricted by admin/operator context during beta
- no client should be able to forge Steward or Advocate updates directly

The current EcoVerse beta uses browser-initiated writes from the Workshop runtime.

That means:

- the Firestore rules must remain narrowly scoped
- only the first beta Peer collections should be writable
- every write path must stay reviewable and append-oriented
- this is a beta bridge, not the final trusted runtime architecture

## Minimum Beta Read Model

The Workshop should be able to read and display:

- Peer identity
- core binding
- current status
- recent memory events
- Advocate summary
- Steward summary
- current bounded task list

## Minimum Beta Write Model

The first beta should support these writes:

1. Create Peer
2. Initialize core binding
3. Create Advocate state
4. Create Steward state
5. Append initial memory event
6. Append task assignment
7. Append task result
8. Update summary fields

## Suggested Document Shapes

### `peers/{peerId}`

```json
{
  "peerId": "peer-ecoverse-structure-steward-001",
  "displayName": "EcoVerse Structure Steward",
  "peerType": "ai",
  "role": "Structure Steward",
  "status": "candidate",
  "createdAt": "serverTimestamp",
  "updatedAt": "serverTimestamp",
  "coreBinding": {
    "coreEngineId": "aegis-core-engine",
    "sourceRepoPath": "I:\\AEGIS-CORE-ENGINE",
    "canonVersion": "1.0",
    "standardsVersion": "0.1",
    "referenceDate": "2026-04-16",
    "currentStatus": "limited beta",
    "invariants": ["non_coercive", "sovereignty_preserving", "append_only", "peer_aware"]
  },
  "systemParameters": {
    "mode": "strict",
    "allowedActions": [
      "navigation_recommendation",
      "rewrite_remove_assessment",
      "structure_note"
    ]
  },
  "coherence": {
    "state": "initial",
    "broadeningAllowed": false
  }
}
```

### `peer_memory_events/{eventId}`

```json
{
  "eventId": "evt_001",
  "peerId": "peer-ecoverse-structure-steward-001",
  "timestamp": "serverTimestamp",
  "eventType": "peer_created",
  "source": "workshop_create_flow",
  "summary": "Peer created from Workshop flow with locked Core binding.",
  "payload": {
    "status": "candidate"
  },
  "visibility": "operator"
}
```

## First Implementation Recommendation

For the first beta pass:

1. Create `peers`
2. Create `peer_memory_events`
3. Create `peer_advocate_state`
4. Create `peer_steward_state`
5. Add `peer_tasks`

That is enough to stand up one real Peer without prematurely overbuilding the schema.

## Out Of Scope For Initial Schema

- full general-purpose vector memory
- high-volume streaming telemetry
- multi-peer conflict arbitration tables
- speculative runtime structures not yet used by the first beta Peer

## Next Step

Current implementation status:

- Firestore default database created in `aegis-align-ecoverse`
- Workshop deployment flow writes the first beta Peer runtime documents
- the first live beta Peer is `EcoVerse Structure Steward`

Next implementation task:

- expand from initial Peer bootstrap into bounded task execution and reviewed artifact creation
