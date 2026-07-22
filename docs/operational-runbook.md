# Operational Runbook

## Core Operations

### Upload New Wallpaper

1. Sign in as an authorized user.
2. Upload a new wallpaper.
3. Verify preview, metadata, and checksum.
4. Create or update the relevant schedule.

### Force Publish

1. Confirm the intended wallpaper is correct.
2. Trigger manual publish from the UI.
3. Verify the publish job reaches `success`.
4. Verify the target file checksum matches the expected wallpaper.

### Handle Publish Failure

1. Review the latest publish error details.
2. Validate target share access from the operations screen or health endpoint.
3. Validate host-level credentials and CIFS mount state.
4. Retry publish only after the root cause is understood.

## Rollback

- Default rollback keeps the last known good `wallpaper.jpeg`.
- For a manual rollback, create a publish-target backup if needed, then restore the previous publish-target backup from the operations screen.
- Avoid deleting the final file without a valid replacement.
- If metadata corruption is suspected, restore the latest verified metadata backup during a controlled maintenance window.

## Backup And Restore

### Metadata Backup

1. Open the operations screen as an admin.
2. Trigger `Backup Metadata`.
3. Confirm the backup file is listed in the backup inventory.
4. Store the generated artifact in the persistent backup directory.

### Publish Target Backup

1. Confirm the currently published wallpaper is valid.
2. Trigger `Backup Publish Target`.
3. Confirm the backup file appears in the inventory.

### Restore Drill

1. Select a known-good metadata or publish-target backup.
2. Execute the corresponding restore action from the operations screen.
3. Verify dashboard state, publish state, and target file integrity after restore.
4. Record the restore result in the operational change log.

### Production Validation

1. Refresh the validation report from the operations screen.
2. Confirm mounted target writability, target path, backup inventory, and validation warnings.
3. Run the non-destructive publish probe and confirm write, read, and cleanup all succeed.
4. Create a fresh metadata backup before any restore drill.
5. Run a restore drill from a known-good backup and capture the result in the change log.
6. If the environment is domain-joined and clients are available, record the observed delay from publish success to client-visible wallpaper refresh.

## Monitoring Checklist

- Last publish status
- Last publish time
- Active wallpaper
- Failed job count
- Scheduler heartbeat
- Secret health warnings
- Backup inventory freshness
- Retention prune success
- Share access status

## Disaster Recovery Notes

- Keep at least one recent metadata backup and one recent publish-target backup available outside the application working directory.
- Rebuild the host mount first if CIFS access is lost.
- Restore metadata only after confirming database connectivity and schema compatibility.
