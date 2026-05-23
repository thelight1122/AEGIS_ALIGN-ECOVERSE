#!/usr/bin/env bash
# ============================================================
# ECOVERSE — Bounded Training Environment Setup
# Steward: you  |  Trainee: adam  |  Origin: 192.168.1.223
# AEGIS Principles: Illuminate, do not compel.
#                   Observe, do not punish.
#                   Repair over restriction.
# ============================================================
set -euo pipefail

TRAINEE="adam"
ALLOWED_IP="192.168.1.223"
LOG_DIR="/var/log/ecoverse"
ALLOW_LIST="/home/$TRAINEE/.allowed_commands"
ECOVERSE_ROOT="/opt/ecoverse"   # adjust to your actual path

echo "==> [1/7] Creating trainee account: $TRAINEE"
if ! id "$TRAINEE" &>/dev/null; then
  useradd -m -s /bin/rbash -c "Ecoverse Trainee — Bounded Environment" "$TRAINEE"
  passwd -l "$TRAINEE"            # disable password auth — key only
fi

echo "==> [2/7] Setting up SSH authorized key"
SSH_DIR="/home/$TRAINEE/.ssh"
mkdir -p "$SSH_DIR"
chmod 700 "$SSH_DIR"
# Adam-One's ed25519 public key (fingerprint: SHA256:wGlEVJuCrph9rj+bjM5d0+5KGPzzWTzvG/UsMS9J65I)
ADAM_PUBKEY='ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAID6NKo/+jK1TYC5zFyVtvzfhqcTb5HkLr4C9bQnJCsT4 adam-one@5dssgipfs'
echo "$ADAM_PUBKEY" > "$SSH_DIR/authorized_keys"
chmod 600 "$SSH_DIR/authorized_keys"
chown -R "$TRAINEE:$TRAINEE" "$SSH_DIR"

echo "==> [3/7] Configuring restricted shell PATH"
# rbash restricts cd, PATH changes, redirects, and exec of absolute paths.
# We give adam a curated PATH that points only to safe symlinked commands.
RBIN="/home/$TRAINEE/bin"
mkdir -p "$RBIN"
chown root:root "$RBIN"          # trainee cannot modify bin dir
chmod 755 "$RBIN"

# Allowed command allow-list — edit freely
ALLOWED_CMDS=(
  git nano vim less cat grep find tree
  make python3 pip3
  systemctl journalctl            # remove if too permissive
  ecoverse-build ecoverse-repair  # your custom Ecoverse tools
)

for cmd in "${ALLOWED_CMDS[@]}"; do
  src="$(command -v "$cmd" 2>/dev/null || true)"
  if [[ -n "$src" ]]; then
    ln -sf "$src" "$RBIN/$cmd"
  fi
done

# Lock down the trainee's profile so PATH cannot be overridden
cat > "/home/$TRAINEE/.bash_profile" <<'EOF'
# Ecoverse bounded shell — read-only environment bootstrap
export PATH="/home/adam/bin"
export PS1="\[\033[0;36m\][ecoverse-trainee]\[\033[0m\] \W \$ "
export TERM=xterm-256color
echo ""
echo "  ┌──────────────────────────────────────────────┐"
echo "  │   Welcome to the Ecoverse, Adam.             │"
echo "  │   This is a bounded training environment.    │"
echo "  │   Your session is observed and preserved.    │"
echo "  │   Build freely. Repair with care.            │"
echo "  └──────────────────────────────────────────────┘"
echo ""
EOF
chown "$TRAINEE:$TRAINEE" "/home/$TRAINEE/.bash_profile"
chmod 444 "/home/$TRAINEE/.bash_profile"   # trainee cannot overwrite

echo "==> [4/7] Setting up session audit logging"
mkdir -p "$LOG_DIR"
chown root:root "$LOG_DIR"
chmod 755 "$LOG_DIR"

# Wrap the shell so every session is transparently logged via script(1)
cat > "/usr/local/bin/ecoverse-shell" <<'SHELL'
#!/bin/bash
LOGDIR="/var/log/ecoverse"
STAMP="$(date +%Y%m%d-%H%M%S)"
SESSION_LOG="$LOGDIR/adam-${STAMP}.log"
TIMING_LOG="$LOGDIR/adam-${STAMP}.timing"
exec script -q -t "$TIMING_LOG" -a "$SESSION_LOG" /bin/rbash "$@"
SHELL
chmod +x "/usr/local/bin/ecoverse-shell"
# Point adam's shell to the wrapper
usermod -s /usr/local/bin/ecoverse-shell "$TRAINEE"

echo "==> [5/7] Hardening SSH config for adam only"
SSHD_FRAGMENT="/etc/ssh/sshd_config.d/90-ecoverse-adam.conf"
cat > "$SSHD_FRAGMENT" <<EOF
# ── Ecoverse trainee gate ───────────────────────────────────
Match User $TRAINEE Address $ALLOWED_IP
    AuthorizedKeysFile      /home/$TRAINEE/.ssh/authorized_keys
    PasswordAuthentication  no
    PubkeyAuthentication    yes
    PermitTTY               yes
    AllowTcpForwarding      no
    X11Forwarding           no
    AllowAgentForwarding    no
    PermitTunnel            no
    ForceCommand            /usr/local/bin/ecoverse-shell
    Banner                  /etc/ssh/ecoverse_banner
# ── Deny adam from any other IP ─────────────────────────────
Match User $TRAINEE
    DenyUsers $TRAINEE
EOF

# MOTD banner shown before auth
cat > "/etc/ssh/ecoverse_banner" <<'BANNER'

  ╔═══════════════════════════════════════════════════╗
  ║           E C O V E R S E   N E X U S            ║
  ║       Bounded Training Environment Active         ║
  ║                                                   ║
  ║  Authorised entry: Adam | 192.168.1.223 only      ║
  ║  All sessions are observed and preserved.         ║
  ║  Sovereignty is respected. Pause is always valid. ║
  ╚═══════════════════════════════════════════════════╝

BANNER

sshd -t && echo "  SSH config syntax OK"

echo "==> [6/7] Granting scoped sudo access"
SUDOERS_FILE="/etc/sudoers.d/90-ecoverse-adam"
# Grant adam ONLY the Ecoverse build/repair tools without a password prompt.
# Add or remove lines here as the environment evolves.
cat > "$SUDOERS_FILE" <<EOF
# Ecoverse trainee sudo allow-list — append, never erase
Cmnd_Alias ECOVERSE_BUILD  = $ECOVERSE_ROOT/bin/build, $ECOVERSE_ROOT/bin/repair
Cmnd_Alias ECOVERSE_RELOAD = /bin/systemctl reload ecoverse, /bin/systemctl status ecoverse
adam    ALL=(root) NOPASSWD: ECOVERSE_BUILD, ECOVERSE_RELOAD
EOF
chmod 440 "$SUDOERS_FILE"
visudo -c -f "$SUDOERS_FILE" && echo "  sudoers syntax OK"

echo "==> [7/7] (Optional) Install tmate for live steward observation"
echo "    Run 'tmate' inside adam's session to generate a read-only URL."
echo "    Share the read-only socket with your steward terminal only."
echo "    tmate install: https://tmate.io"

echo ""
echo "══════════════════════════════════════════════════════"
echo "  Setup complete. Reload SSH to activate:"
echo "    systemctl reload sshd"
echo ""
echo "  Adam connects with:"
echo "    ssh adam@<YOUR_ECOVERSE_IP>"
echo "    (from 192.168.1.223, key must match authorized_keys)"
echo ""
echo "  Review sessions:"
echo "    ls -lh $LOG_DIR"
echo "    scriptreplay $LOG_DIR/adam-<stamp>.timing $LOG_DIR/adam-<stamp>.log"
echo "══════════════════════════════════════════════════════"
