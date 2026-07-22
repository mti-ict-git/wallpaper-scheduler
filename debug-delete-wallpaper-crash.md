# Debug Session: delete-wallpaper-crash

Status: [OPEN]

## Symptom

- Deleting a wallpaper from the UI still results in `ECONNRESET` from the frontend proxy.
- The backend connection appears to drop during `DELETE /api/wallpapers/:id`.

## Expected

- The delete request should complete with a deterministic HTTP response and should not crash or reset the backend connection.

## Initial Hypotheses

1. The delete path still throws an unhandled exception after the recent soft-delete changes, causing the Node process to terminate or the connection to reset.
2. The delete transaction is hitting an invalid SQL path, such as updating `system_config` with the wrong schema assumptions, and the error is not being serialized into an HTTP response.
3. The request reaches the route, but a later audit-log or follow-up query fails after the response flow starts, causing the connection to drop.
4. A separate process or stale dev server instance is serving part of the stack, so the route code being executed is not the latest code on disk.
5. The frontend proxy reports `ECONNRESET` because the backend restarts mid-request under `nodemon` after a runtime error inside the delete flow.

## Evidence Plan

- Add runtime instrumentation around the delete route and repository transaction.
- Reproduce the delete request and capture pre-fix evidence.
- Confirm which hypothesis matches the observed runtime path.

## Notes

- No business-logic fix is applied until runtime evidence confirms the failure point.
