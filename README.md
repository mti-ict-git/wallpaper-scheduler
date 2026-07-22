# Wallpaper Scheduler

Wallpaper Scheduler is a TypeScript full-stack application for uploading wallpapers, normalizing them into Full HD JPEG assets, scheduling activation by date and time, and publishing the active wallpaper as `Wallpaper.jpg` to a configured target path.

## Current Status

Active phase:
- `Phase 5 - AD/GPO Operational Acceptance`

Recently completed:
- `Phase 4 - Production Domain Validation`
- `Phase 3 - Hardening and Production Readiness`
- `Phase 2 - Activation and Publish Pipeline`
- `Phase 1 - Foundation Build`
- `Phase 0 - Discovery and Solution Design`

## Stack

- Frontend: React + TypeScript + Vite + Tailwind + Zustand
- Backend: Express + TypeScript
- Worker: Node.js TypeScript scheduler and publisher
- Database: PostgreSQL
- Deployment: Docker Compose on Ubuntu
- Share integration: CIFS mount to `SYSVOL`

## Repository Layout

```text
.trae/documents/   -> formal PRD and technical architecture
api/               -> Express API, worker, repositories, routes, tests
docs/              -> source-of-truth project documentation
migrations/        -> SQL migrations
shared/            -> shared contracts and scheduling helpers
src/               -> React frontend
```

## Source Of Truth

Read these documents before making non-trivial changes:
- `docs/implementation-roadmap.md`
- `docs/functional-specification.md`
- `docs/technical-implementation-plan.md`
- `docs/database-schema-specification.md`
- `docs/openapi.yaml`
- `docs/open-questions-and-challenges.md`

## Local Development

Install dependencies:

```bash
npm install
```

Run the full stack:

```bash
npm run dev
```

Default development endpoints:
- Frontend: `http://localhost:5173` or the next available Vite port
- API: `http://localhost:3011`

## Verification

Typecheck:

```bash
npm run check
```

Tests:

```bash
npm run test
```

