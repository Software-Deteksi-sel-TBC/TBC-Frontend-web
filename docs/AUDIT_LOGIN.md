# Audit Keamanan & Fungsionalitas Login — TBC Frontend

**Tanggal**: 2026-05-25  
**Scope**: Sistem autentikasi frontend (Login, AuthContext, RBAC, API interceptors)  
**Branch**: `main`

---

## Ringkasan Eksekutif

Audit dilakukan oleh 3 agent paralel yang masing-masing menginspeksi:
1. Keamanan `AuthContext` & token storage
2. Alur login & validasi input
3. Role-based access control (RBAC) & API interceptors

**Hasil:** Ditemukan 6 isu kritis, 7 peringatan, dan 4 saran best practice.  
**Status fungsional:** Login hanya berfungsi penuh untuk role `OPERATOR_LAB`. User `PATOLOG_LAB` tidak dapat mengakses aplikasi setelah login.

---

## Temuan Kritis

### 1. Token Disimpan di `localStorage` (XSS Vulnerable)

- **File:** [src/context/AuthContext.tsx](src/context/AuthContext.tsx) — baris 42  
- **Detail:** Default parameter `remember = true` membuat token selalu masuk ke `localStorage`. Selain itu, nilai `remember` di [src/pages/auth/Login.tsx](src/pages/auth/Login.tsx#L13) di-hardcode sebagai `false` tapi tidak berpengaruh karena tidak diteruskan ke `contextLogin`.
- **Risiko:** Token dapat dicuri melalui serangan XSS.
- **Rekomendasi:** Gunakan `httpOnly` secure cookies (koordinasi dengan backend), atau setidaknya gunakan `sessionStorage` sebagai default.

---

### 2. Tidak Ada Validasi Expiry Token

- **File:** [src/routes/index.tsx](src/routes/index.tsx#L16-L17)  
- **Detail:** `RequireAuth` hanya memeriksa *keberadaan* token, bukan validitasnya. Token yang sudah expired di sisi backend tetap dianggap valid oleh frontend hingga localStorage dihapus manual.
- **Risiko:** Session tidak pernah kedaluwarsa secara otomatis di sisi client.
- **Rekomendasi:** Decode JWT dan periksa field `exp`, atau implementasikan token refresh + penanganan error 401.

---

### 3. Credentials Dikirim via `location.state`

- **File:** [src/pages/auth/Login.tsx](src/pages/auth/Login.tsx#L52-L57)  
- **Detail:** Setelah login berhasil dengan `is_first_login = true`, email dan password dalam bentuk plaintext dikirim ke halaman `/update-credentials` melalui React Router state.
- **Risiko:** Credentials dapat bocor melalui browser history dan alat debugging.
- **Rekomendasi:** Gunakan token sementara dari server atau simpan di session yang dienkripsi, bukan di router state.

---

### 4. Reset Password Token Exposed di URL

- **File:** [src/pages/auth/ResetPassword.tsx](src/pages/auth/ResetPassword.tsx#L11)  
- **Detail:** Token reset password dikirim sebagai query parameter di URL.
- **Risiko:** Token bocor ke server logs, browser history, dan referrer headers.
- **Rekomendasi:** Kirim token via POST request di body/header, bukan URL.

---

### 5. Flag `is_first_login` Bisa Dimanipulasi

- **File:** [src/context/AuthContext.tsx](src/context/AuthContext.tsx#L46)  
- **Detail:** Data user termasuk `is_first_login` dan `role` disimpan sebagai plain JSON di `localStorage`. User dapat mengedit nilai ini melalui browser DevTools untuk melewati redirect ke `/update-credentials`.
- **Risiko:** User dapat melewati paksa ganti password pertama kali.
- **Rekomendasi:** Validasi `is_first_login` di sisi server pada setiap request ke endpoint protected.

---

### 6. Tidak Ada Response Interceptor (401/403 Tidak Ditangani)

- **File:** [src/services/api.ts](src/services/api.ts)  
- **Detail:** Hanya ada request interceptor untuk menyisipkan token. Tidak ada error interceptor. Token expired atau invalid tidak memicu logout otomatis.
- **Risiko:** User dengan token invalid tetap di dalam aplikasi tanpa feedback yang jelas.
- **Rekomendasi:** Tambahkan response interceptor yang menangkap error 401/403 dan memanggil `logout()` secara global.

---

## Peringatan

### 7. Role dari Server Bisa Di-spoof

- **File:** [src/context/AuthContext.tsx](src/context/AuthContext.tsx#L46), [src/routes/index.tsx](src/routes/index.tsx#L18)  
- **Detail:** Field `role` disimpan plain JSON di `localStorage`. Jika user mengubah nilai ini melalui DevTools, frontend akan memperlakukan mereka sesuai role yang dimodifikasi.
- **Rekomendasi:** Jangan percayai role dari client-side; validasi di backend setiap API call.

---

### 8. Route `PATOLOG_LAB` Tidak Terdaftar — Bug Fungsional

- **File:** [src/routes/index.tsx](src/routes/index.tsx)  
- **Detail:** `RequireAuth` menolak semua role selain `OPERATOR_LAB` dengan redirect ke `/login` (baris 18). Tidak ada route yang terdaftar untuk dashboard patolog. Akibatnya, user `PATOLOG_LAB` yang login dengan credentials yang benar akan langsung dikembalikan ke halaman login.
- **Rekomendasi:** Daftarkan route patolog dan implementasikan logika RBAC yang memisahkan redirect berdasarkan role.

---

### 9. Validasi Form Sangat Minim

- **File:** [src/pages/auth/Login.tsx](src/pages/auth/Login.tsx#L26)  
- **Detail:** Hanya memeriksa apakah field kosong. Tidak ada validasi format email. Tidak ada proteksi brute force (countdown, disabled state setelah beberapa kali gagal).
- **Rekomendasi:** Gunakan library validasi (Zod/Yup) dan tambahkan throttle di level frontend.

---

### 10. Email Bisa Diubah Tanpa Verifikasi

- **File:** [src/pages/auth/UpdateCredentials.tsx](src/pages/auth/UpdateCredentials.tsx#L119)  
- **Detail:** User dapat mengganti email ke alamat manapun saat update credentials pertama kali, tanpa verifikasi kepemilikan email baru.
- **Rekomendasi:** Backend harus memvalidasi bahwa email baru belum dipakai user lain dan mengirim konfirmasi.

---

### 11. Persyaratan Password Tidak Konsisten

- **File:** [src/pages/auth/UpdateCredentials.tsx](src/pages/auth/UpdateCredentials.tsx), [src/pages/auth/ResetPassword.tsx](src/pages/auth/ResetPassword.tsx#L28)  
- **Detail:** Syarat kekuatan password berbeda antara halaman `UpdateCredentials` dan `ResetPassword`.
- **Rekomendasi:** Buat satu fungsi validasi password terpusat dan pakai di semua form.

---

### 12. Inkonsistensi Logic Token Storage

- **File:** [src/context/AuthContext.tsx](src/context/AuthContext.tsx#L21-L22)  
- **Detail:** `getStoredToken()` memeriksa `localStorage` terlebih dahulu baru `sessionStorage`, tapi `login()` menyimpan berdasarkan flag `remember`. Ada risiko token tersimpan di dua tempat sekaligus.
- **Rekomendasi:** Bersihkan storage yang tidak digunakan saat login.

---

### 13. Data User Tersimpan Utuh di Storage

- **File:** [src/context/AuthContext.tsx](src/context/AuthContext.tsx#L46)  
- **Detail:** Seluruh objek user (id, name, role, email) disimpan tidak terenkripsi di `localStorage`.
- **Rekomendasi:** Simpan sesedikit mungkin data di client; fetch ulang user dari backend saat aplikasi dimuat.

---

## Saran Best Practice

| # | Saran | File Terkait |
|---|-------|--------------|
| 14 | Implementasikan `httpOnly` secure cookies untuk token (perlu koordinasi backend) | `src/services/api.ts` |
| 15 | Tambahkan CSRF protection di request headers | `src/services/api.ts` |
| 16 | Hapus manual `JSON.stringify` di `updateCredential` — axios menanganinya otomatis | [src/features/auth/services/auth.service.ts](src/features/auth/services/auth.service.ts#L73) |
| 17 | Pertimbangkan token obfuscation atau enkripsi ringan sebelum disimpan di storage | `src/context/AuthContext.tsx` |

---

## Status Fungsionalitas Login

| Role | Bisa Login? | Keterangan |
|------|-------------|------------|
| `OPERATOR_LAB` | **Ya** | Alur login lengkap berjalan normal |
| `PATOLOG_LAB` | **Tidak** | Login API berhasil, tapi langsung di-redirect kembali ke `/login` oleh `RequireAuth` |
| Role lainnya | **Tidak** | Sama seperti `PATOLOG_LAB` |

---

## Prioritas Perbaikan

1. **[KRITIS] Tambah response interceptor** untuk auto-logout saat 401 — [src/services/api.ts](src/services/api.ts)
2. **[KRITIS] Daftarkan route patolog dan perbaiki RBAC** — [src/routes/index.tsx](src/routes/index.tsx)
3. **[KRITIS] Implementasikan validasi expiry token** di `RequireAuth` — [src/routes/index.tsx](src/routes/index.tsx)
4. **[KRITIS] Hapus credentials dari `location.state`** — [src/pages/auth/Login.tsx](src/pages/auth/Login.tsx)
5. **[KRITIS] Pindahkan reset password token** dari URL ke request body — [src/pages/auth/ResetPassword.tsx](src/pages/auth/ResetPassword.tsx)
6. **[PERINGATAN] Tambah validasi form** dengan Zod/Yup dan proteksi brute force — [src/pages/auth/Login.tsx](src/pages/auth/Login.tsx)
