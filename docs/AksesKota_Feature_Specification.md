# AksesKota_Feature_Specification

# 1. Tujuan Dokumen

Dokumen ini menjadi **Product Requirement Document (PRD)** untuk seluruh tim. Setiap fitur yang dibangun harus mengacu pada dokumen ini agar desain UI/UX, frontend, backend, dan proposal tetap konsisten.

---

# 2. Prioritas Fitur

| Priority | Keterangan |
|----------|------------|
| P0 | Wajib ada pada MVP |
| P1 | Penting, dapat ditambahkan jika waktu memungkinkan |
| P2 | Future Development |

---

# 3. Role

## User
Mencari rute, mengirim laporan, melihat riwayat.

## Moderator
Memverifikasi laporan warga.

## Admin
Mengelola sistem dan dashboard.

---

# 4. Feature List

## F001 - Authentication
Priority: P0

### User Story
Sebagai pengguna saya ingin memiliki akun sehingga preferensi perjalanan dapat disimpan.

### Acceptance Criteria
- Register
- Login
- Logout
- Validasi email

---

## F002 - Onboarding & Personal Mode
Priority: P0

### Tujuan
Menyesuaikan rekomendasi rute.

### Pilihan Mode
- Kursi roda
- Lansia
- Stroller
- Low Vision
- Pejalan kaki umum

### Acceptance Criteria
- Pengguna memilih mode
- Dapat mengubah mode kapan saja
- Preferensi tersimpan

---

## F003 - Home Dashboard
Priority: P0

### Menampilkan
- Search route
- Riwayat
- Shortcut laporan
- Statistik kontribusi

---

## F004 - Search Route
Priority: P0

### Input
- Titik awal
- Tujuan

### Output
Minimal tiga alternatif rute.

Acceptance:
- Tidak boleh kosong
- Menampilkan loading
- Error jika lokasi gagal ditemukan

---

## F005 - Route Comparison
Priority: P0

Menampilkan setiap rute beserta:

- Jarak
- Durasi
- Accessibility
- Comfort
- Safety

Label:
- Paling aksesibel
- Paling teduh
- Paling pendek

---

## F006 - Route Detail
Priority: P0

Menampilkan:

- Langkah perjalanan
- Ramp
- Tangga
- Tempat duduk
- Shelter
- Area teduh
- Hambatan

### Acceptance
Semua informasi divisualisasikan pada peta.

---

## F007 - Route Explanation
Priority: P0

Sistem menjelaskan alasan rekomendasi.

Contoh:

- Tidak memiliki tangga
- Memiliki ramp
- 72% jalur teduh

Tidak hanya menampilkan skor.

---

## F008 - Accessibility Layer
Priority: P0

Parameter:

- Ramp
- Tangga
- Guiding block
- Lebar trotoar
- Lift
- Zebra cross

Hard Constraint berlaku.

---

## F009 - Comfort Layer
Priority: P0

Parameter:

- Pohon
- Kanopi
- Koridor beratap
- Tempat duduk
- Shelter
- Air minum
- Penerangan

---

## F010 - Live Condition Layer
Priority: P0

Parameter:

- Genangan
- Proyek
- Kendaraan parkir
- Lubang
- Ramp rusak
- Lift mati

Status:
- Aktif
- Kedaluwarsa

---

## F011 - Tambah Kondisi Jalur
Priority: P0

### User Story

Sebagai warga saya ingin memperbarui kondisi jalur.

Input:

- Gambar segmen
- Foto
- Kondisi permukaan
- Ramp
- Guiding block
- Tingkat keteduhan
- Tempat duduk

Acceptance:

- Foto wajib
- Lokasi wajib
- Timestamp otomatis

---

## F012 - Laporkan Hambatan
Priority: P0

Jenis:

- Lubang
- Genangan
- Tangga
- Kendaraan
- Pohon tumbang
- Proyek

Status:

- sementara
- permanen

Acceptance:
- Dapat diberi masa berlaku

---

## F013 - Community Verification
Priority: P1

Fungsi:

- Konfirmasi laporan
- Tolak laporan
- Perbarui kondisi

Acceptance:
- Riwayat verifikasi tersimpan

---

## F014 - Riwayat Perjalanan
Priority: P1

Menampilkan:

- Rute sebelumnya
- Waktu perjalanan
- Mode pengguna

---

## F015 - Riwayat Kontribusi
Priority: P1

Menampilkan:

- Semua laporan
- Status verifikasi
- Total kontribusi

---

## F016 - Walkability Dashboard
Priority: P1

Visualisasi:

- Area merah
- Area kuning
- Area hijau

Menampilkan:

- Accessibility
- Comfort
- Safety

---

## F017 - Urban Insight Dashboard
Priority: P1

Untuk pemerintah.

Data:

- Hambatan terbanyak
- Area prioritas
- Segmen minim keteduhan
- Ramp rusak
- Guiding block rusak

---

## F018 - Moderator Verification
Priority: P1

Moderator dapat:

- Approve
- Reject
- Merge duplicate

---

## F019 - User Profile
Priority: P0

Data:

- Nama
- Preferensi
- Kontribusi
- Riwayat

---

## F020 - Admin Panel
Priority: P1

Mengelola:

- User
- Reports
- Categories
- Statistics

---

# 5. Error States

Semua halaman wajib memiliki:

- Loading State
- Empty State
- Error State
- Success Feedback

---

# 6. UI Components

Komponen minimum:

- Navbar
- Sidebar (Dashboard)
- Interactive Map
- Route Card
- Facility Badge
- Report Form
- Modal
- Toast Notification
- Bottom Sheet (Mobile)

---

# 7. API Mapping

| Feature | Endpoint |
|---------|----------|
| Login | POST /login |
| Register | POST /register |
| Search Route | GET /routes |
| Route Detail | GET /routes/{id} |
| Report | POST /reports |
| Facilities | GET /facilities |
| Dashboard | GET /urban-dashboard |

---

# 8. MVP Checklist

- [ ] Login & Register
- [ ] Personal Mode
- [ ] Search Route
- [ ] Route Comparison
- [ ] Route Detail
- [ ] Accessibility Layer
- [ ] Comfort Layer
- [ ] Live Condition Layer
- [ ] Tambah Kondisi Jalur
- [ ] Laporkan Hambatan
- [ ] User Profile
- [ ] Dashboard sederhana

---

# 9. Future Development

- AI deteksi hambatan dari foto
- Prediksi keteduhan berdasarkan posisi matahari
- Integrasi Open Data pemerintah
- PWA
- Offline Mode
- Gamifikasi kontribusi
- Notifikasi perubahan kondisi rute

---

# 10. Definition of Done

Sebuah fitur dianggap selesai apabila:

1. UI selesai dan sesuai design system.
2. Backend API berjalan.
3. Database terhubung.
4. Error state tersedia.
5. Empty state tersedia.
6. Validasi input tersedia.
7. Responsif desktop & mobile.
8. Lolos pengujian internal.
9. Dokumentasi diperbarui.

---

# 11. Product Guardrails

Fitur baru **tidak boleh ditambahkan** apabila:

- Tidak meningkatkan kualitas perjalanan pengguna.
- Tidak memperkaya data kota.
- Tidak berkaitan dengan Accessibility, Comfort, atau Live Condition.
- Menambah kompleksitas tanpa manfaat yang jelas.

Jika ragu, gunakan pertanyaan berikut:

> "Apakah fitur ini membuat pengguna mencapai tujuan dengan lebih aman, lebih nyaman, atau membantu kota memahami kondisi jalur dengan lebih baik?"

Jika jawabannya **tidak**, maka fitur tersebut berada di luar ruang lingkup AksesKota.
