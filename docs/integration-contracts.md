# Integration Contracts

## Integration 1 - Active Directory Wallpaper Path

Purpose:
- Menyediakan satu file wallpaper final yang dapat diakses client domain.

Contract:
- Input dari sistem: file wallpaper source yang sudah divalidasi.
- Output dari sistem: file `wallpaper.jpeg` di target path yang stabil.
- Expected target:
  - UNC share atau mounted path yang dibaca oleh policy wallpaper.

Assumptions:
- GPO sudah menunjuk ke target path final.
- Sistem tidak wajib mengubah GPO pada fase awal.

## Integration 2 - File Share / SYSVOL

Purpose:
- Menyimpan hasil publish final.

Contract:
- Sistem butuh create, write, rename or replace pada folder target.
- Sistem butuh read-back untuk validasi hasil publish jika diperlukan.

Operational requirements:
- Network path dapat diakses dari host aplikasi.
- Permission minimum tersedia untuk service account.

## Integration 3 - Database

Purpose:
- Menyimpan metadata, schedule, state, publish history, dan audit log.

Contract:
- API dan worker dapat mengakses satu database yang sama.
- Semua waktu disimpan dalam UTC.
