# Open Questions And Challenges

## Resolved Production Decisions

1. The production overlap policy is accepted as:
   - highest priority wins
   - if tied, the most recent start time wins
   - if still tied, deterministic id ordering wins

2. When no schedule is active, production behavior is:
   - use the configured fallback wallpaper when available
   - otherwise keep the last known good published wallpaper

## Confirmed Decisions

- The initial production target share is `SYSVOL`, while local development uses an in-project simulated publish folder.
- The Docker host runs on Ubuntu.
- The initial authentication model is local application auth.
- The application writes to a stable mounted share path inside the container.
- The publish artifact name remains `Wallpaper.jpg`.
- Uploaded source files are normalized into Full HD JPEG and stored as database blobs before publish.

## Remaining Operational Risks

- Real domain validation is still required for end-user visibility timing on the mounted target share.
- Domain replication latency and client GPO refresh timing can delay visible wallpaper activation after a successful publish.
- File format compatibility still needs to be validated against all target client policies.

## Validation Evidence Recorded

- Mounted target directory write, read, and cleanup probe completed successfully.
- Metadata backup creation and metadata restore drill completed successfully.
- Validation report generation completed and captured the current publish target state, share writability, and backup inventory state.
- The current environment still has no published `Wallpaper.jpg` file, so final target-file presence remains an environment readiness issue rather than an application failure.

## Security Challenges

- Share credentials must remain outside the container image and outside source control.
- The service account should keep the minimum permissions required for the target folder only.
- Audit data must remain sufficient to trace schedule changes and manual publish triggers.

