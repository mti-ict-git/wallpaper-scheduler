# Implementation Roadmap

## Active Phase

Current active phase:
- `Phase 5 - AD/GPO Operational Acceptance`

Status:
- `ready_to_start`

Recently completed:
- `Phase 4 - Production Domain Validation`
- `Phase 3 - Hardening and Production Readiness`
- `Phase 2 - Activation and Publish Pipeline`
- `Phase 1 - Foundation Build`
- `Phase 0 - Discovery and Solution Design`

## Phase 0 - Discovery and Solution Design

### Objective

Mendefinisikan scope produk, arsitektur awal, model data, API draft, deployment Docker, dan risiko integrasi Active Directory sebelum implementasi dimulai.

### Source Documents

- `docs/project-plan.md`
- `docs/product-principles.md`
- `docs/functional-specification.md`
- `docs/technical-implementation-plan.md`
- `docs/database-schema-specification.md`
- `docs/openapi.yaml`
- `docs/deployment-and-environment.md`
- `docs/security-and-access-model.md`
- `docs/integration-contracts.md`
- `docs/open-questions-and-challenges.md`

### Checklist

- [x] Definisikan problem statement, scope, dan objective sistem wallpaper scheduler.
- [x] Definisikan workflow upload, scheduling, activation, dan publish.
- [x] Definisikan arsitektur logical component untuk web app, scheduler, publisher, storage, dan database.
- [x] Definisikan baseline API contract untuk wallpaper, schedule, publish, health, dan audit.
- [x] Definisikan baseline database schema.
- [x] Definisikan deployment model Docker dan dependensi operasional ke Active Directory.
- [x] Catat open questions, constraints, dan challenge untuk area yang masih ambigu.

### Output

- Baseline dokumentasi desain awal tersedia di folder `docs/`.
- Baseline `README.md` tersedia sebagai entry point repository.

### Challenge / Verification

- Verification performed: reviewed against `AGENTS.md` mandatory document list and repository rules.
- Verification performed: ensured all mandatory baseline documents are created and cross-referenced.
- Verification performed: checked bahwa setiap area penting sudah punya source-of-truth document, termasuk API, database, deployment, security, dan open questions.
- Phase status: `complete`

## Phase 1 - Foundation Build

### Objective

Membangun skeleton aplikasi, Docker stack, autentikasi awal, storage upload, dan CRUD dasar wallpaper serta schedule.

### Source Documents

- `docs/functional-specification.md`
- `docs/technical-implementation-plan.md`
- `docs/database-schema-specification.md`
- `docs/openapi.yaml`
- `docs/testing-strategy.md`

### Checklist

- [x] Bootstrap frontend, backend, worker, dan Docker Compose.
- [x] Implement authentication and role-based authorization.
- [x] Implement upload wallpaper dan storage metadata.
- [x] Implement CRUD wallpaper dan CRUD schedule.
- [x] Implement preview kalender atau timeline sederhana di web UI.
- [x] Implement audit log untuk perubahan penting.

### Output

- Aplikasi dasar bisa dijalankan via Docker.
- API dan database migration awal tersedia.

### Challenge / Verification

- Build and typecheck semua service lulus.
- Automated tests lulus untuk scheduler helper dan auth route.
- Dev stack frontend, worker, dan API terverifikasi bisa start dengan port API fase 1 pada `3011`.
- OpenAPI telah diperbarui untuk endpoint bootstrap auth, dashboard overview, dan audit logs.
- Phase status: `complete`

## Phase 2 - Activation and Publish Pipeline

### Objective

Mengaktifkan evaluasi jadwal, publish `Wallpaper.jpg`, distribusi ke target share, dan observability minimum.

### Source Documents

- `docs/functional-specification.md`
- `docs/technical-implementation-plan.md`
- `docs/deployment-and-environment.md`
- `docs/security-and-access-model.md`
- `docs/integration-contracts.md`
- `docs/operational-runbook.md`

### Checklist

- [x] Implement scheduler evaluation loop.
- [x] Implement conflict resolution dan active wallpaper selection.
- [x] Implement publisher pipeline ke staging file lalu atomic replace.
- [x] Implement retry, backoff, dan error logging untuk publish failure.
- [x] Implement health check, metrics, dan admin visibility untuk last publish status.
- [x] Validasi akses ke target share di environment domain.

### Output

- Sistem mampu mengubah wallpaper aktif sesuai schedule.
- File `Wallpaper.jpg` terpublish ke target yang telah dikonfigurasi.

### Challenge / Verification

- Typecheck passed with `npm run check`.
- Automated tests passed with `npm run test`, including scheduler selection and share access validation.
- Health endpoint verification passed and returned worker heartbeat, worker status, and writable share access details.
- UI smoke verification passed in the browser preview with no blocking render errors on the login/bootstrap screen.
- Runtime share validation endpoint was exercised successfully against the mounted target path.
- Phase status: `complete`

## Phase 3 - Hardening and Production Readiness

### Objective

Menyelesaikan hardening security, HA/backup, runbook, dan kesiapan operasional produksi.

### Source Documents

- `docs/security-and-access-model.md`
- `docs/deployment-and-environment.md`
- `docs/operational-runbook.md`
- `docs/testing-strategy.md`
- `docs/open-questions-and-challenges.md`

### Checklist

- [x] Finalize credential handling dan secret rotation.
- [x] Finalize backup and restore workflow.
- [x] Finalize production monitoring, alerting, dan retention policy.
- [x] Finalize operational SOP untuk rollback dan disaster recovery.
- [x] Close open questions yang bersifat blocking.

### Output

- The system is ready for controlled production validation.

### Challenge / Verification

- Typecheck passed with `npm run check`.
- Automated tests passed with `npm run test`, including secret resolution and backup inventory coverage.
- Health endpoint verification passed and returned worker status, share access, and secret health details.
- Browser smoke verification passed for dashboard stability and the settings hardening panel.
- Operations endpoints for backup inventory and secret health are exposed and documented.
- Phase status: `complete`

## Phase 4 - Production Domain Validation

### Objective

Validate the application against the mounted production-style target path, collect operational evidence, and confirm recovery drills can be executed safely.

### Source Documents

- `docs/deployment-and-environment.md`
- `docs/operational-runbook.md`
- `docs/testing-strategy.md`
- `docs/open-questions-and-challenges.md`
- `docs/openapi.yaml`

### Checklist

- [x] Add evidence collection endpoints for validation reporting, publish probe, and restore drill.
- [x] Validate mounted target directory write, read, and cleanup behavior.
- [x] Validate metadata backup creation and restore drill execution.
- [x] Capture target-path state, backup state, and operational warnings in a validation report.
- [x] Document residual environment-only gaps for real domain client timing and compatibility validation.

### Output

- The system can produce repeatable production-validation evidence from the operations surface.

### Challenge / Verification

- Typecheck passed with `npm run check`.
- Automated tests passed with `npm run test`, including validation service probe coverage.
- Runtime validation report was generated successfully from the authenticated operations endpoint.
- Runtime publish probe completed successfully with write, read, and cleanup all marked successful.
- Runtime metadata backup creation completed successfully and the artifact appeared in the backup inventory.
- Runtime metadata restore drill completed successfully from the authenticated operations endpoint.
- Phase status: `complete`

## Phase 5 - AD/GPO Operational Acceptance

### Objective

Finalize the production publish artifact rules, normalize wallpaper source handling, and provide a safe development simulation path without requiring a live AD share.

### Source Documents

- `docs/functional-specification.md`
- `docs/technical-implementation-plan.md`
- `docs/database-schema-specification.md`
- `docs/deployment-and-environment.md`
- `docs/openapi.yaml`
- `docs/testing-strategy.md`

### Checklist

- [x] Normalize all uploads into Full HD JPEG wallpaper assets.
- [x] Compress normalized JPEG output when required to keep the publish source under the operational size target.
- [x] Store normalized wallpaper source as database blob data instead of relying on file-backed source storage.
- [x] Publish the final artifact as `Wallpaper.jpg`.
- [x] Provide a local-development simulated publish folder inside the project and keep it excluded from source control.

### Output

- Upload, preview, schedule, and publish flows use normalized JPEG wallpaper source data stored in PostgreSQL.
- Development environments can validate publish behavior without mounting a live AD share.

### Challenge / Verification

- Typecheck passed with `npm run check`.
- Targeted automated tests passed with `npm test -- api/tests/image-processing.test.ts api/tests/share-service.test.ts api/tests/validation-service.test.ts src/tests/scheduler.test.ts`.
- Verified upload normalization logic converts images into Full HD JPEG payloads that stay under the operational size ceiling.
- Verified local simulated publish directory remains writable through share validation and publish probe checks.
- OpenAPI reviewed and updated because wallpaper upload semantics changed: `name` is no longer required and uploads are normalized internally.
- Phase status: `complete`

