# Product Principles

## Core Principles

1. Operational safety first.
   Sistem tidak boleh menghapus atau merusak wallpaper aktif yang sudah valid ketika publish baru gagal.

2. Predictable scheduling.
   Aktivasi wallpaper harus deterministik, berbasis timezone yang jelas, dan mudah dijelaskan ke operator.

3. Minimal friction.
   Workflow upload, schedule, dan publish harus sederhana untuk tim IT operasional.

4. Observable by default.
   Semua publish attempt, failure, retry, dan status aktif harus mudah dilihat dari UI dan log.

5. Container friendly.
   Sistem harus bisa dijalankan via Docker dengan dependency eksternal yang eksplisit.

6. Secure by configuration.
   Secret, credential, dan akses ke target share harus dipisahkan dari source code dan dibatasi sesuai least privilege.

## UX Principles

- Fokus ke task operasional inti: upload, assign schedule, activate, review status.
- Tampilkan waktu secara eksplisit dengan timezone.
- Tampilkan status publish terakhir tanpa perlu buka log mentah.
- Gunakan validasi yang mencegah schedule overlap yang tidak diinginkan.
