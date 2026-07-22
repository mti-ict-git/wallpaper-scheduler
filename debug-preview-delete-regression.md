# Debug Session: preview-delete-regression

Status: [OPEN]

## Symptom

- Wallpaper preview does not render after upload.
- Frontend throws `Unexpected end of JSON input` while deleting wallpaper.
- Wallpaper marked as deleted still remains in the database.

## Expected

- Uploaded wallpaper preview should render correctly in the UI.
- Delete should return a deterministic frontend-safe response with no JSON parse error.
- Delete behavior should match the intended product behavior and database state.

## Initial Hypotheses

1. `parseResponse()` always calls `response.json()`, so a `204 No Content` delete response causes the frontend exception.
2. Wallpaper preview requests fail because the preview route requires auth, but the browser image request does not include the bearer token.
3. The current delete path is a soft delete by design, so the record stays in the database with `status = 'deleted'`, which mismatches the user's expected hard delete semantics.
4. The UI retains stale wallpaper selection state after delete or refresh, making the view appear inconsistent even when list queries filter deleted rows.
5. A separate backend response or route-level error during upload/preview/delete is not being serialized into a stable client response.

## Evidence Plan

- Inspect the frontend response parsing and image preview flow.
- Instrument the delete and preview path with runtime debug points for this session.
- Reproduce upload preview and delete from the default backend port.
- Compare runtime evidence before and after the fix.
