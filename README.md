# TBC Frontend Web

Frontend web untuk sistem deteksi dan validasi TBC berbasis citra patologi. Aplikasi ini dibangun dengan React, TypeScript, Vite, dan Tailwind CSS, lalu terhubung ke backend melalui endpoint `/api`.

README ini ditulis berdasarkan implementasi kode yang ada saat ini di folder `src`, bukan template generik.

## Ringkasan Fungsi

Frontend ini melayani dua peran utama:

- `OPERATOR_LAB`
  - login ke sistem
  - registrasi pasien baru
  - membuat kasus pemeriksaan
  - upload citra patologi ke suatu kasus
  - melihat riwayat kasus yang dibuat operator tersebut
  - submit kasus setelah upload citra selesai

- `DOKTER_PATOLOGI`
  - melihat antrean kasus yang menunggu validasi
  - membuka detail kasus dan daftar citra di dalamnya
  - memvalidasi hasil AI per citra
  - menambahkan komentar diagnosis
  - generate report setelah validasi tersedia (label UI masih menyebut PDF; artefak backend berupa JSON)

Selain itu ada alur autentikasi tambahan:

- login
- forgot password
- reset password
- first-login credential update

## Tech Stack

- React 19
- TypeScript
- Vite 7
- Tailwind CSS 4 via `@tailwindcss/vite`
- React Router DOM 7
- Axios
- Lucide React

## Cara Kerja Aplikasi

### 1. Bootstrap aplikasi

Entry point ada di `src/main.tsx`.

- React dirender dalam `StrictMode`
- seluruh aplikasi dibungkus `AuthProvider`
- `src/app/App.tsx` hanya merender router utama

### 2. Routing dan proteksi akses

Routing didefinisikan di `src/app/router/index.tsx`.

Halaman utama yang tersedia:

- `/login`
- `/reset-password-email`
- `/reset-password`
- `/reset-success`
- `/update-credentials`
- `/operator/dashboard`
- `/operator/patient-form`
- `/operator/upload`
- `/patolog/dashboard`
- `/patolog/validate/:id`
- `/patolog/validate/:caseId/image/:imageId`

Proteksi route dilakukan oleh komponen `RequireAuth`:

- token dibaca dari `localStorage` atau `sessionStorage`
- akses halaman dibatasi berdasarkan `role`
- role operator diarahkan ke flow operator
- role patolog diarahkan ke flow patolog

### 3. Manajemen autentikasi

Autentikasi dikelola oleh `src/features/authentication/state/AuthContext.tsx`.

Fungsi utamanya:

- menyimpan data user dan token saat login
- membaca user tersimpan saat aplikasi pertama kali dimuat
- logout dengan membersihkan `localStorage` dan `sessionStorage`

Data yang disimpan:

- `token`
- `auth_user`

API client ada di `src/shared/api/api.ts`:

- `baseURL` default: `VITE_API_URL` atau `/api`
- request interceptor otomatis menambahkan header `Authorization: Bearer <token>`

## Alur Fitur per Modul

### Modul Auth

File utama:

- `src/features/authentication/pages/Login.tsx`
- `src/features/authentication/pages/ResetPasswordEmail.tsx`
- `src/features/authentication/pages/ResetPassword.tsx`
- `src/features/authentication/pages/ResetSuccess.tsx`
- `src/features/authentication/pages/UpdateCredentials.tsx`
- `src/features/authentication/api/auth.service.ts`

Flow login:

- user mengisi email dan password
- frontend memanggil `POST /auth/login`
- token dan user disimpan ke context + storage
- jika `is_first_login = true`, user diarahkan ke `/update-credentials`
- jika tidak, user diarahkan ke dashboard sesuai role

Flow forgot/reset password:

- `POST /auth/forgot-password`
- `POST /auth/reset-password`

Flow first login update:

- `POST /auth/update-credentials`

### Modul Operator

File utama:

- `src/features/case-intake/pages/OperatorDashboardPage.tsx`
- `src/features/patient-management/pages/OperatorPatientFormPage.tsx`
- `src/features/image-upload/pages/OperatorUploadPage.tsx`
- `src/features/authentication/components/OperatorTopNav.tsx`
- `src/features/case-intake/components/PatientHistoryTable.tsx`
- `src/features/case-intake/components/OperatorEmptyState.tsx`

Fitur dashboard operator:

- memuat daftar kasus dari `GET /cases?page=1&limit=200`
- memfilter kasus berdasarkan `created_by === user.id`
- menampilkan pencarian berdasarkan case ID, nama pasien, atau nomor induk pasien
- memuat ringkasan gambar per kasus lewat `GET /cases/:id/images`

Fitur form pasien:

- validasi `No. Induk Pasien` harus 16 digit angka
- membuat pasien lewat `POST /patients`
- membuat kasus baru lewat `POST /cases`
- setelah berhasil, user diarahkan ke halaman upload dengan `caseId` pada query string

Fitur upload citra:

- mengambil detail kasus lewat `GET /cases/:id`
- mengambil antrean gambar lewat `GET /cases/:id/images`
- meminta presigned URL lewat `POST /cases/:id/images/presigned-urls`
- upload file langsung dengan `fetch(..., { method: "PUT" })`
- hapus gambar lewat `DELETE /images/:id`
- konfirmasi gambar pending lewat `POST /cases/:id/images/confirm`
- submit kasus lewat `POST /cases/:id/submit`

Upload mendukung:

- `.tif`
- `.tiff`
- `.svs`
- `.jpg`
- `.jpeg`
- `.png`

Status kasus yang dipakai di frontend:

- `PENDING_UPLOAD`

Status QC gambar yang dipakai di frontend:

- `PENDING`
- `PASSED`
- `FAILED`

### Modul Patolog

File utama:

- `src/features/pathology-review/pages/PatologDashboard.tsx`
- `src/features/pathology-review/pages/PatologCaseDetailsPage.tsx`
- `src/features/pathology-review/pages/PatologImageValidationPage.tsx`
- `src/features/authentication/components/PatologTopNav.tsx`
- `src/features/pathology-review/components/PatologValidationTable.tsx`

Fitur dashboard patolog:

- memuat antrean review dari `GET /review/queue?page=1&limit=200`
- menampilkan total pending dan resolved
- menyediakan search berdasarkan case ID dan nama pasien

Fitur detail kasus:

- memuat detail kasus dari `GET /cases/:id`
- memuat daftar citra review dari `GET /review/cases/:id/images`
- menampilkan status validasi, severity, dan validator

Fitur validasi citra:

- memuat detail citra dari `GET /review/cases/:caseId/images/:imageId`
- menampilkan preview gambar dengan zoom dan pan
- menampilkan metrik AI:
  - necrosis
  - granuloma
  - datia langhans
  - epithelioid
- menyimpan validasi manual lewat `POST /images/:imageId/validate`
- mengirim komentar lewat `POST /images/:imageId/comments`
- generate report melalui helper `src/features/reporting/api/report.service.ts`:
  - `POST /reports`
  - `GET /reports/:reportId`

Kedua helper mengembalikan respons Axios tanpa mengubah envelope. GET mengembalikan metadata dan `download_url`; URL tersebut membuka artefak JSON yang dibuat backend. Label PDF yang ada pada UI tetap dipertahankan oleh refactor ini.

Enum yang dipakai di UI validasi:

- severity:
  - `SANGAT_RENDAH`
  - `RENDAH`
  - `SEDANG`
  - `TINGGI`
  - `SANGAT_TINGGI`
- count level:
  - `TIDAK_ADA`
  - `JARANG`
  - `CUKUP_BANYAK`
  - `SANGAT_BANYAK`

## Struktur Folder

Struktur source yang aktif saat ini:

```text
src/
  app/
    App.tsx
    App.css
    router/
  features/
    authentication/
    patient-management/
    case-intake/
    image-upload/
    pathology-review/
    reporting/
  shared/
    api/
    assets/
    ui/
  index.css
  main.tsx
```

Penjelasan singkat:

- `app` menyusun aplikasi, router, dan guard; `main.tsx` tetap menjadi bootstrap.
- `authentication` memiliki halaman auth, service, context, layout, dan navigasi sesuai peran.
- `patient-management` memiliki form pasien dan alur pembuatan pasien lalu kasus.
- `case-intake` memiliki dashboard operator, tabel kasus, types, dan mock data yang dipertahankan.
- `image-upload` memiliki upload, konfirmasi, dan submit; wrapper legacy tetap tidak dirutekan.
- `pathology-review` memiliki antrean serta detail kasus/citra, validasi, komentar, dan konsensus.
- `reporting` menyediakan dua helper HTTP report; pemicu dan state UI tetap di halaman review.
- `shared` memiliki UI dasar, aset, Axios client, dan DTO lintas fitur (`CaseImageSummary`). `PatientRecord` tetap dimiliki case-intake.

Konsumen fitur menggunakan public `index.ts`. Empat fitur workflow boleh bergantung pada authentication; pathology-review juga boleh bergantung pada reporting. Tidak ada dependency fitur lain yang diizinkan. Shared tidak mengimpor fitur atau app, dan fitur tidak mengimpor app. Refactor ini mempertahankan URL, redirect, query, JSX/CSS, request payload, dan storage behavior.

## Konfigurasi Environment

File `.env` saat ini memakai:

```env
VITE_API_URL=/api
```

Konfigurasi Vite di `vite.config.ts` juga menyediakan proxy development:

- `VITE_API_PROXY_TARGET`
- default proxy target: `http://localhost:5001`

Artinya, request ke `/api` saat development akan diteruskan ke backend lokal jika variabel tersebut tidak diubah.

## Menjalankan Project

Masuk ke folder frontend lalu jalankan:

```bash
npm install
npm run dev
```

Script yang tersedia:

- `npm run dev`
- `npm run build`
- `npm run lint`
- `npm run preview`

## Deploy

Terdapat `vercel.json` dengan rewrite semua route ke `index.html`, sehingga routing client-side React tetap berjalan saat deploy ke Vercel.

## Catatan Implementasi Saat Ini

Beberapa hal penting yang terlihat dari kode saat ini:

- frontend masih sangat bergantung pada kontrak endpoint backend
- beberapa file mock data masih ada di repository, tetapi flow utama sudah menggunakan API nyata
- file kosong `src/hooks/useAuth.ts` yang tidak dipakai dihapus; hook aktif tetap diekspor dari authentication
- `src/app/App.css` masih berisi sisa template Vite dan tidak dipakai aktif
- ada dokumen audit internal di `docs/AUDIT_LOGIN.md` untuk evaluasi auth/login

## File Penting

Jika ingin mulai membaca kode, file paling penting adalah:

- `src/app/router/index.tsx`
- `src/features/authentication/state/AuthContext.tsx`
- `src/shared/api/api.ts`
- `src/features/authentication/api/auth.service.ts`
- `src/features/case-intake/pages/OperatorDashboardPage.tsx`
- `src/features/image-upload/pages/OperatorUploadPage.tsx`
- `src/features/pathology-review/pages/PatologDashboard.tsx`
- `src/features/pathology-review/pages/PatologImageValidationPage.tsx`

Baseline lint frontend terdiri dari 51 error dan 6 warning. Gate refactor membandingkan identitas temuan setelah normalisasi path; jumlah yang sama saja belum cukup. Bukti build, lint, dan replay UI disimpan di laporan control worktree, terpisah dari source aplikasi.
