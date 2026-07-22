# Technical Implementation Plan

## Recommended Architecture

Gunakan arsitektur modular monolith plus worker agar implementasi awal tetap sederhana tetapi siap dipisah jika beban bertambah.

Core components:
- `web-ui`: frontend untuk upload, schedule, dan monitoring.
- `api`: backend HTTP untuk auth, wallpaper management, schedule management, config, dan audit.
- `scheduler-worker`: proses background untuk evaluasi schedule dan enqueue publish.
- `publisher`: modul worker yang menyiapkan `Wallpaper.jpg` dan mengirim ke target path.
- `db`: PostgreSQL untuk metadata dan audit.
- `storage`: object storage atau mounted volume untuk menyimpan wallpaper source.

## Recommended Tech Stack

- Frontend: React + TypeScript
- Backend API: Node.js + TypeScript
- ORM: Prisma atau Drizzle
- Database: PostgreSQL
- Background jobs: database-backed queue atau simple polling worker
- Storage: local volume untuk fase awal, S3-compatible storage opsional untuk scale
- Reverse proxy: Nginx atau Traefik

## Runtime Flow

1. User upload wallpaper ke API.
2. API menyimpan file ke storage dan metadata ke database.
3. User membuat schedule via API.
4. Scheduler worker polling tiap interval tertentu.
5. Worker menentukan wallpaper aktif saat ini.
6. Jika wallpaper aktif berubah atau manual publish dipicu, worker membuat publish job.
7. Publisher mengambil wallpaper source, melakukan validasi, lalu menyiapkan file output `Wallpaper.jpg`.
8. Publisher copy ke staging path di target share.
9. Publisher melakukan replace ke path final.
10. Hasil publish dicatat ke database dan tampil di UI.

## SYSVOL Publish Strategy

### Recommended approach

- Gunakan path target yang stabil, misalnya `\\domain.example\SYSVOL\domain.example\wallpaper\Wallpaper.jpg`.
- Simpan GPO wallpaper path mengarah ke file tersebut.
- Publisher menulis ke `Wallpaper.jpg.tmp` atau path staging lain terlebih dulu.
- Setelah valid, publisher rename atau replace ke `Wallpaper.jpg`.

### Important note

Menulis langsung ke SYSVOL dari container memerlukan validasi environment secara spesifik. Konfigurasi yang sudah dikonfirmasi untuk fase awal:
- Host Docker berjalan di Ubuntu.
- Ubuntu host melakukan mount CIFS/SMB ke share SYSVOL target.
- Container menerima mounted path yang stabil, misalnya `/app/scripts`.
- Gunakan service account domain dengan hak tulis minimum hanya ke folder target.

## Scheduling Rules

- Semua datetime disimpan dalam UTC.
- UI menampilkan dan input dalam timezone yang dipilih.
- Scheduler membandingkan current UTC time terhadap normalized window.
- Polling default: tiap 30-60 detik.

## Conflict Resolution Policy

- Priority lebih tinggi menang.
- Jika priority sama, `start_at` terbaru menang.
- Jika masih sama, gunakan deterministic tie-breaker berdasarkan id.

## Failure Handling

- Gunakan retry terbatas untuk error jaringan atau share unavailable.
- Simpan checksum source dan target publish result.
- Jangan overwrite last-known-good file jika staging validation gagal.
- Simpan reason code dan error detail pada publish job.

## Observability

- Health endpoint untuk API dan worker.
- Structured logs untuk upload, schedule evaluation, dan publish.
- Admin dashboard menampilkan current active wallpaper, pending job, failed job, dan last success.

## Scalability Notes

- Fase awal cukup satu scheduler worker aktif.
- Jika nanti multi-instance, tambahkan leader election atau advisory lock di database.
- Simpan job history untuk audit dan troubleshooting.

## Confirmed Phase-1 Constraints

- Authentication: local auth internal.
- Runtime host: Ubuntu with Docker Compose.
- Share integration: CIFS mount from Ubuntu host into container path.
- Publish strategy: tulis `Wallpaper.jpg` ke mounted SYSVOL path yang telah ditentukan.

