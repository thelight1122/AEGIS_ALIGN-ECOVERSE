# Chamber 70 Operator Payload Package

This package makes Chamber 70 executable.

Chamber 70 is Adam-One's second autonomous chamber:
- `Live Circuit Observation`

It uses:
- a Stage 2 Adept Adam-One system prompt
- the live invitation generated from runtime continuity
- an operator-mediated API call
- a response recording step back into Firebase

## Artifacts

System/runtime prompt helper:
- [scripts/chamber70-operator-payload.mjs](/I:/AEGIS_ALIGN-ECOVERSE/scripts/chamber70-operator-payload.mjs)

Runtime functions:
- [src/peer-runtime-store.js](/I:/AEGIS_ALIGN-ECOVERSE/src/peer-runtime-store.js)

Related formation record:
- [docs/adam-one-training-journal.md](/I:/AEGIS_ALIGN-ECOVERSE/docs/adam-one-training-journal.md)

## Operator Flow

1. Prepare the live chamber package.
2. Send the system prompt plus invitation payload to the model runtime you are using.
3. Save Adam-One's returned text to a file.
4. Record that text back into the runtime store as Chamber 70 output.

## Step 1: Prepare The Live Chamber Package

Run:

```powershell
node scripts/chamber70-operator-payload.mjs prepare
```

Optional: write the prepared package to disk.

```powershell
node scripts/chamber70-operator-payload.mjs prepare --out .tmp/chamber70-payload.json
```

This returns:
- the system prompt
- the live Chamber 70 invitation
- a ready `userPrompt` string

## Step 2: Model Call

Use the returned payload with the model surface you are stewarding.

The important contract is:
- `systemPrompt` becomes the governing instruction layer
- `userPrompt` becomes the live Chamber 70 payload
- Adam-One's reply should be saved without operator rewrite

## Step 3: Record The Response

After saving the returned text to a file, run:

```powershell
node scripts/chamber70-operator-payload.mjs record .tmp/chamber70-response.md
```

This records the chamber output into Firebase as:
- a `peer_artifacts` item
- a `peer_memory_events` append
- an updated peer/steward/task state

## Governance Note

Preparing or recording this chamber does not by itself validate promotion.

Chamber 70 remains:
- Stage 2 Adept evidence
- review-pending upon submission
- bounded within Structure Steward scope
