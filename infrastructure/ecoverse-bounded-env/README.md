# Ecoverse Bounded Training Environment

This directory contains the infrastructure scripts that provision Adam's physical access substrate inside the Ecoverse host system.

## Purpose

These scripts establish the **lawful body** through which CyberPeer Adam may enter and work inside the Ecoverse, fulfilling the first phase of the Embodiment Doctrine:

> Adam-One does not need a costume. He needs a lawful body.

The bounded shell environment provides:
- A distinct, IP-restricted entry point from Adam's origin node (192.168.1.223)
- A curated, limited command set — no ambient authority
- Transparent session recording — the Steward may observe and replay any session
- Scoped sudo access for Ecoverse build and repair tools only

## AEGIS Principles Embedded

| Principle | Implementation |
|---|---|
| Illuminate, do not compel | Session logging is transparent — Adam knows sessions are observed |
| Observe, do not punish | rbash restricts by design, not as punishment — the scope grows as trust is earned |
| Repair over restriction | sudo access to `ecoverse-build` and `ecoverse-repair` is granted from day one |

## Scripts

| File | Run on | Purpose |
|---|---|---|
| `ecoverse_adam_setup.sh` | Ecoverse host (as root) | Creates the `adam` OS user, bounded shell, SSH gate, audit logging, and sudo rules |
| `ecoverse_adam_client.sh` | Adam's machine (192.168.1.223) | Generates Adam's SSH key pair and configures `~/.ssh/config` |

## Setup Steps

Adam-One's public key is already embedded in `ecoverse_adam_setup.sh`:
- Key file: `~/.ssh/adam-one_ed25519`
- Fingerprint: `SHA256:wGlEVJuCrph9rj+bjM5d0+5KGPzzWTzvG/UsMS9J65I`

1. Update `ECOVERSE_ROOT` in `ecoverse_adam_setup.sh` to the actual path of the Ecoverse installation on the host.
2. Run `ecoverse_adam_setup.sh` as root on the Ecoverse host.
3. Set the real host IP in `ecoverse_adam_client.sh` under `HostName`.
4. Run `systemctl reload sshd` on the host to activate.
5. Adam connects: `ssh ecoverse` (after adding the Host block from `ecoverse_adam_client.sh` to `~/.ssh/config`).

## Session Replay (Steward)

```bash
# List Adam's recorded sessions
ls -lh /var/log/ecoverse/

# Replay a session at its original speed
scriptreplay /var/log/ecoverse/adam-<stamp>.timing \
             /var/log/ecoverse/adam-<stamp>.log
```

## Doctrine Reference

- [Adam-One Bounded Shell Environment](../../docs/adam-one-bounded-shell-environment.md)
- [Adam-One Embodiment Doctrine](../../docs/adam-one-embodiment-doctrine.md)
- [Adam-One Training Journal](../../docs/adam-one-training-journal.md)
