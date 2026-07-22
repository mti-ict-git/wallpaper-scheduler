# Functional Specification

## Problem Statement

Tim IT membutuhkan cara terpusat untuk menjadwalkan wallpaper organisasi berdasarkan tanggal dan jam, lalu menyebarkan wallpaper aktif ke domain environment tanpa proses manual rename dan copy file setiap kali ada perubahan.

## Functional Scope

### 1. Authentication and Access

- Sistem menyediakan login untuk admin atau operator.
- Sistem mendukung minimal role `admin` dan `operator`.
- Hanya role tertentu yang boleh publish manual, mengubah konfigurasi target, atau menghapus wallpaper.

### 2. Wallpaper Management

- User dapat upload wallpaper image.
- Sistem menyimpan metadata wallpaper: nama, deskripsi, ukuran, checksum, dan status aktif/nonaktif.
- Sistem menolak file yang tidak sesuai format atau melampaui batas ukuran.
- Sistem menampilkan preview wallpaper.

### 3. Schedule Management

- User dapat membuat schedule dengan:
  - wallpaper target
  - start datetime
  - end datetime opsional
  - timezone
  - priority
  - enabled flag
- User dapat mengedit, disable, atau menghapus schedule.
- Sistem harus bisa mendeteksi konflik schedule.

### 4. Active Wallpaper Selection

- Scheduler mengevaluasi schedule aktif berdasarkan waktu saat ini.
- Jika lebih dari satu schedule match, sistem memakai aturan resolusi konflik:
  1. priority tertinggi menang
  2. jika sama, schedule dengan start time terbaru menang
  3. jika tetap sama, gunakan id terkecil atau aturan deterministik lain
- Jika tidak ada schedule aktif, sistem mempertahankan wallpaper terakhir atau memakai default wallpaper yang dikonfigurasi.

### 5. Publish Workflow

- Ketika wallpaper aktif berubah, sistem membuat artefak final dengan nama `Wallpaper.jpg`.
- Sistem mem-publish artefak final ke target share yang dikonfigurasi.
- Publish dapat berjalan otomatis dari scheduler dan dapat dipicu manual dari UI.
- Sistem menggunakan staging file lalu replace agar mengurangi risiko file korup.

### 6. Monitoring and Audit

- UI menampilkan:
  - wallpaper aktif saat ini
  - next schedule
  - last publish status
  - last publish time
  - target path
- Sistem menyimpan audit trail untuk upload, edit schedule, manual publish, dan perubahan konfigurasi penting.

### 7. Configuration

- Admin dapat mengatur:
  - default timezone
  - target publish path
  - polling interval scheduler
  - retry count dan retry delay
  - default fallback wallpaper

## Non-Functional Requirements

- Sistem berjalan via Docker.
- Publish harus idempotent untuk schedule yang sama.
- Waktu publish failure harus tercatat jelas.
- Asset upload harus tervalidasi sebelum dipublish.
- Credential dan secret tidak boleh disimpan hardcoded.

## Primary User Journey

1. Admin login.
2. Admin upload wallpaper.
3. Admin membuat schedule untuk wallpaper tersebut.
4. Scheduler mengevaluasi schedule sesuai waktu aktif.
5. Publisher menghasilkan `Wallpaper.jpg`.
6. Publisher menyalin file ke target share.
7. UI menampilkan hasil publish dan log.

## Error Handling

- Jika upload gagal, metadata tidak boleh disimpan setengah jadi.
- Jika publish gagal, last-known-good wallpaper tetap dipertahankan.
- Jika target share tidak tersedia, sistem retry sesuai policy lalu tandai job gagal.
- Jika schedule overlap, UI harus memberi warning atau memblokir tergantung policy yang dipilih.

