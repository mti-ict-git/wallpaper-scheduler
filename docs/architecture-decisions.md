# Architecture Decisions

## ADR-001 - Modular Monolith With Worker

Decision:
- Gunakan backend API tunggal dan worker terpisah dalam satu codebase.

Reason:
- Lebih cepat dibangun untuk fase awal.
- Batas domain masih jelas.
- Bisa dipisah menjadi service mandiri di fase lanjut jika perlu.

## ADR-002 - Database As Source Of Truth For Scheduling

Decision:
- Jadwal, status publish, dan state wallpaper aktif disimpan di database relasional.

Reason:
- Mudah diaudit.
- Mudah dibuat deterministic.
- Mendukung query dan locking yang diperlukan oleh scheduler.

## ADR-003 - Stable Publish Filename

Decision:
- File final yang dikonsumsi client domain memakai nama tetap `wallpaper.jpeg`.

Reason:
- Memudahkan GPO tetap menunjuk ke satu path.
- Mengurangi kebutuhan perubahan konfigurasi client.

## ADR-004 - Staging Then Replace

Decision:
- Publish dilakukan ke staging file lalu replace ke final target.

Reason:
- Mengurangi risiko file korup atau partial write.
- Lebih aman untuk network share yang kadang tidak stabil.

## ADR-005 - UTC Storage With Explicit Timezone Display

Decision:
- Simpan datetime dalam UTC, tampilkan dalam timezone yang dipilih user.

Reason:
- Mengurangi ambiguity saat DST atau perbedaan timezone host.
