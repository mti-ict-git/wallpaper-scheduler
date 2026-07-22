# Security And Access Model

## Security Goals

- Protect credentials used for database access and mounted share operations.
- Restrict who can upload, schedule, publish, restore, and change production-sensitive settings.
- Preserve auditability for all operationally significant actions.

## Roles

- `admin`
  - full access
  - manage config, wallpaper, schedule, manual publish, backup, restore, and retention operations

- `operator`
  - upload wallpaper
  - create and edit schedules
  - view publish status
  - cannot access production-sensitive operations or recovery tooling

## Authentication

- The current production-ready baseline remains local application authentication.
- Passwords are stored as password hashes only.
- The codebase keeps an extension path open for future LDAP or Active Directory authentication.

## Authorization Rules

- Only `admin` may update runtime config, validate target share access, create backups, restore backups, or run retention pruning.
- Only authenticated users may upload wallpapers and create schedules.
- Audit log visibility and operational recovery endpoints remain admin-only.

## Secret Management

- Secrets may be loaded from plain environment variables for development only.
- Production deployments should prefer file-backed secrets such as:
  - `JWT_SECRET_FILE`
  - `POSTGRES_PASSWORD_FILE`
  - `DOMAIN_PASSWORD_FILE`
- Domain and CIFS credentials should remain managed at the host mount layer whenever possible.
- Secret health must be observable through operations telemetry so administrators can detect unsafe secret sources.
- Credential rotation is performed at deployment time by replacing secret files or host-managed credentials and restarting the affected services.

## File Validation

- Validate MIME type and extension before accepting uploads.
- Validate maximum file size.
- Calculate checksums before publish and during staging/final verification.
- Validate published content integrity before marking a publish job successful.

## Audit Requirements

- Record login, upload, schedule changes, manual publish, config changes, backup creation, restore operations, and retention prune events.
- Store actor, timestamp, entity, and material payload context for all production-sensitive operations.
