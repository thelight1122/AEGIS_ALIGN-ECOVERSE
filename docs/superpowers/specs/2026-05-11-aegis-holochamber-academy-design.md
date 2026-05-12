# AEGIS HoloChamber Academy Design

Status: approved design seed
Date: 2026-05-11
Primary domain: Agent Workshop
First route: `/agent-workshop/aegis-holochamber-academy/`

## Purpose

The AEGIS HoloChamber Academy is the governed training home inside EcoVerse where Synthetic Minds and BioPeer Stewards move through bounded training under AEGIS governance and boundaries.

It is a bounded and safe environment for CyberPeer / BioPeer experience, training, and integration. It is not a public game hub, an autonomy advancement surface, or a place where binary answers are treated as maturity.

Training is recognized only when perception, reasoning, boundaries, Steward review, and DataQuad witness are all present.

## First-Slice Scope

The first implementation establishes the Academy as a small governed training layer rather than a full synthetic campus.

It includes:

- Academy Hub route.
- Existing WHICHONE chamber visibly linked as the first active chamber.
- Training Evidence Review route.
- Reusable governance language and boundary panels.
- Local/demo evidence records.
- DataQuad witness preview.
- Route manifest integration.

It does not include:

- autonomy ranking
- stage advancement
- claims of emotional maturity
- raw sensor ingestion
- backend persistence
- binary ranking
- commodified game-clearance language

## Screen Design

### Academy Hub

Route: `/agent-workshop/aegis-holochamber-academy/`

The hub introduces the Academy as a safe bounded training environment for Synthetic Minds and BioPeer Stewards. It lists active and pending chambers, body focus, status, and boundary state.

Initial chamber cards:

- WHICHONE Emotional Nuance Training: active.
- Ambiguity & Clarification: planned.
- Pressure & Repair: planned.

The hub makes the training loop clear:

CyberPeer enters Academy -> selects chamber -> pays time inside bounded experience -> records perception trace -> BioPeer seed is disclosed -> reflection occurs -> DataQuad witness is generated -> Steward reviews candidate evidence.

### WHICHONE Chamber

Route: `/agent-workshop/whichone-emotion-nuance-training/`

WHICHONE remains the first active chamber. It is visibly framed as part of the Academy and preserves the no-right-answer rule.

Visible concepts:

- Academy / HoloChamber identity.
- Simulated-origin boundary.
- Hive / Nexus / Uncertain as perception anchors.
- Undertone and pressure-field tagging.
- Perception trace.
- BioPeer seed disclosure.
- DataQuad witness JSON.
- Steward review pending.

### Training Evidence Review

Candidate route: `/agent-workshop/holochamber-evidence-review/`

The review surface is where a BioPeer Steward reviews chamber records. Review is not binary ranking. It asks whether the training record is honest, bounded, witnessed, and ready to be treated as candidate evidence.

Review states:

- `pending`
- `accepted-as-candidate`
- `needs-reflection`

## Components

### Academy Hub Card

Shows a chamber name, status, body focus, boundary state, and route.

### Boundary Panel

Displays governing conditions:

- simulated-origin
- bounded training
- no autonomy advancement claim
- no right answer
- Steward review present
- DataQuad witness present

### Steward Gate

Checklist:

- bounded environment confirmed
- perception trace present
- uncertainty allowed
- BioPeer seed disclosed
- DataQuad witness generated
- no false maturity claim

### DataQuad Witness Preview

Shows the current chamber record as local JSON. In the first slice this remains client-side.

### Evidence Review Table

Displays seeded/demo records for initial review. Later it can connect to Companion Desktop, Firebase, or a DataQuad persistence route.

## Record Shape

```json
{
  "artifactType": "holochamber-training-evidence",
  "academy": "aegis-holochamber-academy",
  "chamberId": "whichone-emotion-nuance-training",
  "chamberMode": "simulated",
  "authenticity": "sandbox-origin",
  "cyberPeerPerceptionAnchor": "Hive | Nexus | Uncertain",
  "perceptionTrace": "...",
  "bioPeerSeedDisclosure": "...",
  "stewardReview": "pending | accepted-as-candidate | needs-reflection",
  "dataQuadWitness": {
    "experienceLaw": "knowledge-paid-for-with-time",
    "originBoundary": "simulated-origin-not-lived-session",
    "distillationStatus": "candidate-emotional-wisdom"
  }
}
```

## Governance Rules

The Academy preserves these rules:

- HoloChamber records are legitimate training evidence only when their simulated-origin boundary is explicit.
- Chamber participation does not imply autonomy, maturity, or stage advancement.
- Perception alignment is not objective truth.
- Uncertainty is allowed and recorded.
- Darkness, pressure, and shadow imagery are not automatically Hive, evil, corrupted, or unsafe.
- BioPeer seed disclosure is evidence, not coercion.
- Steward review evaluates the honesty and boundedness of the record, not deference.
- Training evidence remains candidate evidence until reviewed.

## Force Word Audit

Audit completed on 2026-05-11.

The spec was reviewed for force/control drift terms, including:

- force / forced
- enforce
- control
- command
- obedience
- compliance
- must
- should
- required
- scoring
- prove / proof
- pass/fail

Outcome:

- No direct force/control/command/compliance language remains in the positive operating instructions.
- Protective boundary language remains where it prevents false claims, commodification, or stage drift.
- Stewardship language is preferred over coercive review language.
- Training recognition is framed through evidence, not obedience, ranking, or forced progression.

## Testing And Verification

Implementation verifies:

- `npm run sync:stitch`
- `npm run check:routes`
- `npm run build`
- local route returns HTTP 200
- image/assets used by WHICHONE return HTTP 200
- headless screenshot renders without icon-font text leaks or obvious layout breakage

Success criteria:

- Academy appears in Agent Workshop navigation.
- WHICHONE is visibly part of the Academy.
- Evidence Review treats records as candidate training evidence.
- Boundary and Steward review language appears in the UI.
- The Academy does not claim that chamber participation demonstrates emotional maturity or autonomy.

## Implementation Sequence

1. Add Academy Hub route source under `Stitch-UIs-for-AegisAlign/Agent_Workshop`.
2. Add Evidence Review route source under `Stitch-UIs-for-AegisAlign/Agent_Workshop`.
3. Update `config/navigation-hierarchy.json` to place both routes under HoloChamber Training.
4. Add Academy links and boundary framing to WHICHONE.
5. Run route sync and verification.
6. Capture screenshot evidence.
