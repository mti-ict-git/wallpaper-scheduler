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
- `DOMAIN_NAME`
- `DOMAIN_PASSWORD`
- `DOMAIN_PASSWORD_FILE`
- `SHARED_FOLDER_PATH`
- `CIFS_SHARE_PATH`
- `CIFS_VERS`

## AD And Share Access Options

### Supported Deployment Patterns

- The Docker host runs on Ubuntu.
- The container receives a stable mounted internal path such as `SHARED_FOLDER_PATH`.
- The application writes `wallpaper.jpeg` to that mounted path instead of dynamically discovering a target at runtime.

Two supported mount patterns:

1. Host-managed mount (bind mount)
   - The Ubuntu host mounts the CIFS/SMB `SYSVOL` target share.
   - Docker Compose bind-mounts the host directory into the container.

2. Docker-managed CIFS volume (named volume)
   - Docker creates a named volume using the `local` driver with `cifs` driver options.
   - Docker mounts the root share from `CIFS_SHARE_PATH` into an internal container path such as `/app/sysvol`.
   - `SHARED_FOLDER_PATH` should point to the final subdirectory inside that mounted share, for example `/app/sysvol/domain/scripts`.
   - The mount options can use `DOMAIN_NAME`, `DOMAIN_USERNAME`, `DOMAIN_PASSWORD`, and `CIFS_VERS` directly from environment injection.

## Share Access Flow

1. Provide `CIFS_SHARE_PATH` and credentials securely (secret file, secret manager, or host file).
2. Mount the share into the container using either:
   - host-managed mount + bind mount, or
   - Docker-managed CIFS volume + `driver_opts`.
3. Point `SHARED_FOLDER_PATH` to the final target subdirectory inside the mounted share.
4. Publisher writes staging and final files to the mounted `SHARED_FOLDER_PATH`.
5. Credentials remain outside the image and outside source control.

## Example Configuration Shape

Actual values remain in secret files or deployment injection, but the configuration shape follows this pattern:

```text
POSTGRES_URL=...
POSTGRES_USERNAME=...
POSTGRES_PASSWORD_FILE=/run/secrets/postgres_password
POSTGRES_DATABASE=...
DOMAIN_NAME=...
DOMAIN_USERNAME=...
DOMAIN_PASSWORD=...
JWT_SECRET_FILE=/run/secrets/jwt_secret
SHARED_FOLDER_PATH=/app/sysvol/domain/scripts
CIFS_SHARE_PATH=//domain-controller/SYSVOL
CIFS_VERS=3.0
BACKUP_PATH=/app/storage/backups
```

## Production Notes

- Place credentials in Docker secrets, a secret manager, or dedicated host files.
- Separate development, staging, and production environments.
- Back up database metadata and the publish target on a scheduled basis.
- Mount a persistent backup directory into the application container.
- Consider a reverse proxy with TLS termination.
- On Ubuntu, choose either a host-managed mount or a Docker-managed CIFS volume depending on operational policy.

## Verification Before Production

- Validate write access and replace behavior on the real target share.
- Validate propagation timing until clients receive the new wallpaper.
- Validate container restart behavior during an active job.
- Validate CIFS remount or recovery after host reboot.
- Validate secret file injection and secret rotation during deployment.
- Validate scheduled backup creation and a documented restore drill.
