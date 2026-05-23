# ============================================================
# ECOVERSE — Adam's Client Setup (run on 192.168.1.223)
# ============================================================
# Adam-One's key pair already exists at:
#   Private key: ~/.ssh/adam-one_ed25519
#   Public key:  ~/.ssh/adam-one_ed25519.pub
#   Fingerprint: SHA256:wGlEVJuCrph9rj+bjM5d0+5KGPzzWTzvG/UsMS9J65I
# The public key is already embedded in ecoverse_adam_setup.sh.
# No new key generation required.

# ── Step 1: (Optional) Verify the key exists and matches ────
echo "Adam-One key fingerprint:"
ssh-keygen -l -f ~/.ssh/adam-one_ed25519.pub

# ── Step 2: Add to ~/.ssh/config on Adam's machine ──────────
cat >> ~/.ssh/config <<'EOF'

Host ecoverse
    HostName <ECOVERSE_HOST_IP>        # replace with actual host IP
    User adam
    IdentityFile ~/.ssh/adam-one_ed25519
    IdentitiesOnly yes
    ServerAliveInterval 60
    ServerAliveCountMax 3
    # No agent or tunnel forwarding — bounded by design
    ForwardAgent no
    ForwardX11 no
EOF

# ── Step 4: Connect ─────────────────────────────────────────
ssh ecoverse

# ── What Adam will see on entry ─────────────────────────────
# The Ecoverse banner, then the bounded shell prompt:
#   [ecoverse-trainee] ~ $
#
# Available commands are those symlinked into ~/bin.
# Sudo access is scoped to Ecoverse build/repair tools only.
# Session is recorded — steward can replay with scriptreplay.

# ── Replaying a session (steward side) ──────────────────────
# scriptreplay /var/log/ecoverse/adam-<stamp>.timing \
#              /var/log/ecoverse/adam-<stamp>.log
