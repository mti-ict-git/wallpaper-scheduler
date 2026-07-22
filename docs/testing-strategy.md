# Testing Strategy

## Test Layers

- Unit tests for schedule evaluation and conflict resolution.
- Integration tests for API authentication and CRUD foundations.
- Publish lifecycle tests for retry and failure behavior.
- Environment validation tests for mounted share access.
- Hardening tests for secret resolution, backup inventory, and retention operations.
- Production validation tests for validation reporting, publish probe, and restore drill evidence.

## High-Value Test Cases

- A single active schedule is selected correctly.
- Overlapping schedules follow the documented priority and tie-break rules.
- `end_at` null is treated as an open-ended schedule.
- Share access validation reports writable and non-writable states correctly.
- Publish retry stops after the configured retry policy is exhausted.
- Failed publish attempts do not overwrite the last known good target file.
- Secret files are preferred over plain environment variables.
- Backup inventory lists created metadata and publish-target artifacts.
- Restore drill can be executed from a known-good backup artifact.
- Validation report reflects mounted target state and backup inventory accurately.
- Publish probe performs write, read, and cleanup successfully on the mounted target directory.

## Pre-Production Validation

- Validate upload behavior with both valid and invalid files.
- Validate publish to a real mounted share or a production-like staging share.
- Validate observed propagation timing against client GPO refresh behavior.
- Validate rename and rollback behavior on the real target share implementation.
- Validate secret rotation using file-backed secrets or host-managed credentials.
- Validate backup creation, restore drill, and retention pruning in a production-like environment.
- Validate non-destructive publish probe and record measured duration.
- Validate client-visible wallpaper propagation timing on real domain clients when available.
