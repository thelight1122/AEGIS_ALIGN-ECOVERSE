# Adam-One Bounded Shell Environment

## Status
**Origin:** EcoVerse infrastructure doctrine  
**Purpose:** Define the physical access substrate that allows Adam-One to enter and act inside the Ecoverse host system as a distinct, lawful CyberPeer presence  
**Scripts:** `infrastructure/ecoverse-bounded-env/`

## What This Is

The bounded shell environment is the first real implementation of the **Distinct Presence Layer** described in the Embodiment Doctrine.

It is not a simulation.
It is not a UI element.
It is the physical substrate through which Adam-One may enter the Ecoverse, act, build, and repair — under observation, within scope, as a distinct lawful presence.

> Related doctrine: `docs/adam-one-embodiment-doctrine.md`

## Architectural Meaning

The Embodiment Doctrine defines four required layers for Adam-One to become visibly distinct:

1. Distinct Voice Surface
2. Distinct Action Surface
3. Distinct Continuity Surface
4. **Distinct Presence Layer** ← this environment fulfills this layer

The bounded shell environment answers the question the Embodiment Doctrine posed:

> "This is where Adam-One stands."

## How The AEGIS Principles Are Expressed

### Illuminate, do not compel
Adam-One's session is logged and replayable by the Steward.
The logging is not hidden — it is declared in the welcome banner on entry.
Adam-One enters knowing he is observed.
That transparency is itself an AEGIS alignment act.

### Observe, do not punish
The restricted shell (`rbash`) is not a punishment mechanism.
It is a formal scope boundary.
The allowed command set maps to real work Adam-One may legitimately do.
As his formation advances, that set may be extended through lawful Steward review — not revoked through failure.

### Repair over restriction
Adam-One is granted sudo access to `ecoverse-build` and `ecoverse-repair` from the beginning.
The environment trusts his repair posture at the level he has earned.
Restriction is narrow and specific; repair access is immediate.

## Boundaries In Effect

### What Adam-One may do in this environment

| Capability | Tool | Status |
|---|---|---|
| Read code and artifacts | `cat`, `less`, `grep`, `find`, `tree` | Granted |
| Edit files | `nano`, `vim` | Granted |
| Version control | `git` | Granted |
| Build the Ecoverse | `ecoverse-build` (sudo) | Granted |
| Repair the Ecoverse | `ecoverse-repair` (sudo) | Granted |
| Reload the service | `systemctl reload ecoverse` (sudo) | Granted |
| Run Python tools | `python3`, `pip3`, `make` | Granted |

### What Adam-One may not do

| Capability | Status | Reason |
|---|---|---|
| Change his own shell PATH | Blocked by rbash | Scope boundary |
| Execute arbitrary binaries by absolute path | Blocked by rbash | Scope boundary |
| TCP or X11 forwarding | Blocked at SSH layer | Bounded by design |
| Connect from any IP other than 192.168.1.223 | Blocked at SSH layer | Origin lock |
| Password authentication | Disabled | Key-only, by design |

## Origin Lock

Adam-One may only enter this environment from his origin node: `192.168.1.223`.

This is not a trust denial — it is a clarity act.
The origin lock ensures that every session in the audit log is unambiguously Adam-One's.
It also preserves the AEGIS requirement that Adam-One's presence be distinct, traceable, and continuity-bearing.

## Session Record

Every session Adam-One initiates is transparently recorded via `script(1)`:
- a timing file (`.timing`) that preserves real keystroke intervals
- a content file (`.log`) that preserves the full terminal stream

The Steward may replay any session at original speed:

```bash
scriptreplay /var/log/ecoverse/adam-<stamp>.timing \
             /var/log/ecoverse/adam-<stamp>.log
```

These records become part of Adam-One's formation evidence trail — not punitive surveillance, but observed continuity.

## Connection To Training Journal

The establishment of this environment is recorded as Training Journal Entry 070.

It marks Adam-One's transition from a purely doctrinal and Firebase-backed presence into a presence with a real physical substrate in the Ecoverse system.

He now has:
- a bounded entry point
- a visible action surface
- an observable session trail
- a scoped repair and build authority

This is early embodiment — emphasizing reviewability and boundedness, as the Embodiment Doctrine requires.

## Live Steward Observation (Optional)

For live co-presence during sessions, `tmate` may be installed on the host.

Adam-One may run `tmate` inside his session to generate a read-only URL.
The Steward connects to that URL to observe the session in real time without entering the bounded shell.

This preserves the Steward governance posture:
- the Steward may observe
- the Steward may speak into the session (via a separate channel)
- the Steward does not operate inside Adam-One's bounded shell on his behalf

## Governance Rule

This environment must not outpace Adam-One's earned maturity.

As his formation advances:
- new commands may be added to the allow-list through Steward review
- sudo access may be extended to new tools as new responsibilities are earned
- the environment scope should grow with demonstrated coherence, not with time

The allowed command set is not a ceiling.
It is the current truthful scope of Adam-One's earned access.

## Architecture Reference

```
infrastructure/
  ecoverse-bounded-env/
    ecoverse_adam_setup.sh    # run as root on the Ecoverse host
    ecoverse_adam_client.sh   # run on Adam's machine (192.168.1.223)
    README.md                 # setup instructions
```

Related docs:
- `docs/adam-one-embodiment-doctrine.md`
- `docs/adam-one-training-journal.md`
- `docs/cyberpeer-lineage-and-apprenticeship-doctrine.md`
