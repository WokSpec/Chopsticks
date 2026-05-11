# Backup & Restore Runbook — <app-name> PostgreSQL

## Quick Reference

| Action | Command |
|--------|---------|
| Create backup | `./scripts/backup-db.sh` |
| List backups | `ls -lh data/backups/` |
| Restore from backup | `./scripts/restore-db.sh data/backups/<file>.sql.gz` |
| Test restore (non-destructive) | See "Testing Restores" below |

---

## Backup

### Manual backup
```bash
./scripts/backup-db.sh
# Output: data/backups/<app-name>_20260220T030000Z.sql.gz
```

### Custom output directory
```bash
BACKUP_DIR=/mnt/backup ./scripts/backup-db.sh
```

### Cron schedule (daily at 03:00 UTC)
Add to `/etc/cron.d/<app-name>-backup`:
```
0 3 * * * root cd /path/to/<app-repo> && COMPOSE_PROJECT_NAME=<app-name> ./scripts/backup-db.sh >> /var/log/<app-name>-backup.log 2>&1
```

Backups older than `BACKUP_KEEP_DAYS` (default: 7) are automatically pruned.

---

## Restore

### Emergency restore (destructive)
1. Stop the app to prevent writes during restore:
   ```bash
   docker compose -f docker-compose.production.yml stop bot agents
   ```
2. Run restore:
   ```bash
   ./scripts/restore-db.sh data/backups/<app-name>_20260220T030000Z.sql.gz
   # Type YES when prompted
   ```
3. Run migrations to ensure schema is current:
   ```bash
   node scripts/migrate.js
   ```
4. Restart services:
   ```bash
   docker compose -f docker-compose.production.yml start bot agents
   ```

### Testing restores (non-destructive)
Restore to a temporary DB to validate:
```bash
docker exec <app-postgres-container> psql -U <db-user> -c "CREATE DATABASE <app-name>_restore_test;"
gunzip -c data/backups/<app-name>_20260220T030000Z.sql.gz | \
  docker exec -i <app-postgres-container> psql -U <db-user> -d <app-name>_restore_test
# Inspect, then clean up:
docker exec <app-postgres-container> psql -U <db-user> -c "DROP DATABASE <app-name>_restore_test;"
```

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `BACKUP_DIR` | `./data/backups` | Where backups are stored |
| `BACKUP_KEEP_DAYS` | `7` | Days to retain backups |
| `COMPOSE_PROJECT_NAME` | `<app-name>` | Docker container prefix |
| `POSTGRES_USER` | `<db-user>` | DB user |
| `POSTGRES_DB` | `<db-name>` | DB name |

---

## Off-site backup (recommended)

After each cron backup, sync to remote storage:
```bash
# S3-compatible (rclone)
rclone copy data/backups/ s3:my-bucket/<app-name>-backups/

# Or rsync to backup server
rsync -az data/backups/ backup-user@backup-host:/backups/<app-name>/
```

Add to cron after the backup step:
```
5 3 * * * root rclone copy /path/to/<app-repo>/data/backups/ s3:my-bucket/<app-name>-backups/ >> /var/log/<app-name>-backup-sync.log 2>&1
```
