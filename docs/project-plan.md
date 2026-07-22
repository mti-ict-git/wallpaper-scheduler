# Project Plan

## Project Summary

Membangun sistem berbasis web yang memungkinkan admin menjadwalkan wallpaper domain berdasarkan tanggal dan jam tertentu, menormalkan setiap upload menjadi JPEG Full HD, lalu mem-publish wallpaper aktif sebagai `Wallpaper.jpg` ke target share yang digunakan oleh lingkungan Active Directory.

## Business Goal

- Menghilangkan proses manual penggantian wallpaper domain.
- Menjamin wallpaper tertentu aktif pada waktu yang sudah direncanakan.
- Menyediakan audit trail siapa mengubah apa dan kapan.
- Menyediakan jalur operasional yang aman untuk publish ke lingkungan domain.

## Primary Users

- IT administrator
- Helpdesk atau operator terotorisasi
- System owner atau approver operasional

## In Scope

- Web UI untuk upload wallpaper, manajemen schedule, dan monitoring publish status.
- Scheduler berbasis timezone.
- Publisher yang membangun file final `Wallpaper.jpg` dari wallpaper source hasil normalisasi yang disimpan di database.
- Integrasi ke share target untuk domain wallpaper distribution.
- Audit log dan job history.
- Dockerized deployment.

## Out Of Scope For Initial Phase

- Multi-tenant.
- AI image generation.
- Complex image editing di browser.
- Approval workflow bertingkat.
- Client-side agent di tiap workstation.
- Perubahan GPO secara otomatis tanpa validasi operasional.

## Key Assumptions

- Wallpaper domain diarahkan ke satu path file yang stabil, misalnya `Wallpaper.jpg`.
- Sistem memiliki akses tulis ke target share yang dipakai distribusi wallpaper.
- Host tempat Docker berjalan dapat mengakses resource Active Directory yang dibutuhkan.
- Semua waktu schedule mengikuti timezone organisasi yang dikonfigurasi.

## Success Criteria

- Admin bisa upload wallpaper dan membuat schedule tanpa edit file manual.
- Scheduler memilih wallpaper yang benar pada waktu yang tepat.
- Publisher menghasilkan `Wallpaper.jpg` yang konsisten dan dapat diakses oleh domain clients.
- Kegagalan publish terlihat jelas dan tidak merusak last-known-good wallpaper.

