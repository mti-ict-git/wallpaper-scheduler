# Deployment And Environment

## Target Deployment Model

The system runs via Docker Compose on a single operational Ubuntu host with network access to the database, storage, and publish target share.

## Recommended Services

- `frontend`
- `api`
- `worker`
- `postgres`
- `reverse-proxy`

## Environment Variables

Core application:
- `APP_ENV`
- `APP_BASE_URL`
- `APP_DEFAULT_TIMEZONE`
- `JWT_SECRET`
- `JWT_SECRET_FILE`

Database:
- `POSTGRES_URL`
- `POSTGRES_USERNAME`
- `POSTGRES_PASSWORD`
- `POSTGRES_PASSWORD_FILE`
- `POSTGRES_DATABASE`
- `POSTGRES_CREATE_DATABASE`
- `POSTGRES_SSL`
- `POSTGRES_SSL_REJECT_UNAUTHORIZED`

Storage:
- `STORAGE_DRIVER`
- `STORAGE_LOCAL_PATH`

Scheduler:
- `SCHEDULER_POLL_INTERVAL_SECONDS`
- `PUBLISH_RETRY_COUNT`
- `PUBLISH_RETRY_DELAY_SECONDS`
- `AUDIT_RETENTION_DAYS`
- `PUBLISH_JOB_RETENTION_DAYS`
- `BACKUP_RETENTION_DAYS`
- `BACKUP_PATH`

Publish target:
- `PUBLISH_TARGET_PATH`
- `PUBLISH_STAGING_PATH`
- `PUBLISH_FILENAME=wallpaper.jpeg`
- `DOMAIN_USERNAME`
- `DOMAIN_PASSWORD`
- `DOMAIN_PASSWORD_FILE`
- `SHARED_FOLDER_PATH`
- `CIFS_SHARE_PATH`

## AD And Share Access Options

### Confirmed Deployment Pattern

- The Docker host runs on Ubuntu.
- The Ubuntu host mounts the CIFS/SMB `SYSVOL` target share.
- The container receives a stable mounted internal path such as `SHARED_FOLDER_PATH`.
- The application writes `wallpaper.jpeg` to that mounted path instead of dynamically discovering a target at runtime.

## Share Access Flow

1. Ubuntu host mount `CIFS_SHARE_PATH` ke direktori host yang terkontrol.
2. Docker Compose mount direktori host tersebut ke path dalam container sesuai `SHARED_FOLDER_PATH`.
3. Publisher menulis file staging dan final ke path container yang telah di-mount.
4. Kredensial domain hanya dipakai di layer host mount atau secret injection, bukan di-hardcode ke image.

## Example Configuration Shape

Actual values remain in secret files or deployment injection, but the configuration shape follows this pattern:

```text
POSTGRES_URL=...
POSTGRES_USERNAME=...
POSTGRES_PASSWORD_FILE=/run/secrets/postgres_password
POSTGRES_DATABASE=...
DOMAIN_USERNAME=...
DOMAIN_PASSWORD_FILE=/run/secrets/domain_password
JWT_SECRET_FILE=/run/secrets/jwt_secret
SHARED_FOLDER_PATH=/app/scripts
CIFS_SHARE_PATH=//domain/SYSVOL/domain/scripts
BACKUP_PATH=/app/storage/backups
```

## Production Notes

- Place credentials in Docker secrets, a secret manager, or dedicated host files.
- Separate development, staging, and production environments.
- Back up database metadata and the publish target on a scheduled basis.
- Mount a persistent backup directory into the application container.
- Consider a reverse proxy with TLS termination.
- On Ubuntu, prioritize host-mounted shares and host-managed credentials.

## Verification Before Production

- Validate write access and replace behavior on the real target share.
- Validate propagation timing until clients receive the new wallpaper.
- Validate container restart behavior during an active job.
- Validate CIFS remount or recovery after host reboot.
- Validate secret file injection and secret rotation during deployment.
- Validate scheduled backup creation and a documented restore drill.
