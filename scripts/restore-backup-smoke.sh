#!/usr/bin/env bash
# Decrypt an encrypted AskAlert pg_dump and optionally restore into a scratch DB.
# Usage: bash scripts/restore-backup-smoke.sh ./backup
set -euo pipefail

BACKUP_DIR="${1:-./backup}"
PASSPHRASE="${BACKUP_GPG_PASSPHRASE:-}"
SCRATCH_URL="${SUPABASE_SCRATCH_DB_URL:-}"

if [ -z "$PASSPHRASE" ]; then
  echo "BACKUP_GPG_PASSPHRASE is required"
  exit 1
fi

ENC="$(find "$BACKUP_DIR" -type f -name '*.sql.gpg' | head -n 1 || true)"
if [ -z "$ENC" ]; then
  echo "No .sql.gpg file found under $BACKUP_DIR"
  exit 1
fi

PLAIN="${ENC%.gpg}"
gpg --batch --yes --decrypt --passphrase "$PASSPHRASE" -o "$PLAIN" "$ENC"

# Basic integrity: dump should mention public schema tables we own.
grep -E "CREATE TABLE.*(areas|categories|db_size_snapshots)" "$PLAIN" >/dev/null

echo "Decrypt + parse smoke OK: $PLAIN"

if [ -z "$SCRATCH_URL" ]; then
  echo "SUPABASE_SCRATCH_DB_URL not set — skipping apply. Pass a disposable project URL to restore."
  exit 0
fi

echo "Restoring into scratch database…"
psql "$SCRATCH_URL" -v ON_ERROR_STOP=1 -f "$PLAIN"
echo "Scratch restore completed."
