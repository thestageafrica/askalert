# Supabase backup and restore

Nightly backups run from `.github/workflows/supabase-backup.yml`.

## Secrets

| Secret | Purpose |
| --- | --- |
| `SUPABASE_DB_URL_READONLY` | Postgres URI for a **read-only** role (or session with `default_transaction_read_only=on`) |
| `BACKUP_GPG_PASSPHRASE` | Symmetric passphrase for AES256 GPG encryption |
| `SUPABASE_SCRATCH_DB_URL` | Optional disposable project URI for restore smoke tests |
| `BACKUP_S3_BUCKET` / `BACKUP_S3_*` | Optional private object storage upload |

Create a read-only role in the SQL editor (example):

```sql
create role askalert_backup_ro login password 'generate-a-long-secret';
grant usage on schema public to askalert_backup_ro;
grant select on all tables in schema public to askalert_backup_ro;
alter default privileges in schema public grant select on tables to askalert_backup_ro;
```

Use the pooler or direct host from the Supabase dashboard connection string, with that role.

## Restore locally

```powershell
# Download the artifact from the Actions run, then:
gpg --batch --yes --decrypt --passphrase $env:BACKUP_GPG_PASSPHRASE -o askalert.sql askalert-….sql.gpg
psql $env:SUPABASE_SCRATCH_DB_URL -v ON_ERROR_STOP=1 -f askalert.sql
```

Or run the smoke script:

```bash
BACKUP_GPG_PASSPHRASE=… SUPABASE_SCRATCH_DB_URL=… bash scripts/restore-backup-smoke.sh ./backup
```

## Restore test

1. Open **Actions → Supabase nightly backup → Run workflow**.
2. The `restore-smoke` job decrypts the dump and greps for core tables.
3. If `SUPABASE_SCRATCH_DB_URL` is set, it also applies the dump to that scratch project.

Never restore production dumps into the live free project without a deliberate cutover plan.

## Upgrade trigger

The free plan has limited automated backups and can pause idle projects. **Upgrade to Supabase Pro at the first real escrow hold** for daily backups and no pausing. Keep the GitHub dump as a secondary copy.
