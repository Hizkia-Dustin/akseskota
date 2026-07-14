# AksesKota — Product Vision & Development Guide

## 1. Product Vision

**AksesKota** adalah platform navigasi pejalan kaki berbasis web yang membantu setiap orang menemukan **rute yang dapat dilewati dengan aman, nyaman, dan sesuai kebutuhan mobilitasnya**.

AksesKota **bukan** sekadar peta fasilitas disabilitas dan **bukan** sekadar aplikasi pencari jalan tercepat. Produk ini mengevaluasi **keseluruhan perjalanan** menggunakan tiga lapisan utama:

1. **Accessibility Layer** → Apakah rute dapat dilewati?
2. **Comfort Layer** → Seberapa nyaman rute digunakan?
3. **Live Condition Layer** → Apakah kondisi rute masih layak saat ini?

> Prinsip utama:
> **Aksesibilitas menentukan apakah rute bisa dilewati.**
> **Kenyamanan menentukan kualitas perjalanan.**

---

# 2. Problem Statement

Sebagian besar aplikasi navigasi mengoptimalkan waktu dan jarak, tetapi belum mempertimbangkan kebutuhan pengguna yang berbeda.

Akibatnya:
- pengguna kursi roda menemukan tangga di tengah perjalanan,
- lansia harus berjalan jauh tanpa tempat duduk,
- orang tua dengan stroller kesulitan melewati trotoar,
- pejalan kaki berjalan di bawah terik tanpa jalur teduh.

Masalah utama bukan kurangnya informasi fasilitas, tetapi **tidak adanya rekomendasi rute yang benar-benar sesuai dengan kondisi pengguna dan kondisi kota saat ini.**

---

# 3. Tujuan Produk

## Tujuan Utama

Membantu masyarakat bergerak di kota dengan rute yang:

- dapat dilewati,
- aman,
- nyaman,
- sesuai kebutuhan mobilitas masing-masing.

## Tujuan Pendukung

- Mendorong kota yang lebih inklusif.
- Mengumpulkan data kondisi jalur secara kolaboratif.
- Membantu pemerintah menentukan prioritas perbaikan.
- Menjadi media partisipasi warga dalam meningkatkan kualitas ruang publik.

---

# 4. Nilai Inti Produk

Semua keputusan desain dan pengembangan harus mengikuti empat prinsip berikut:

## Inclusive by Default

Sistem menyesuaikan diri terhadap pengguna, bukan memaksa pengguna menyesuaikan diri terhadap kota.

## Human-Centered Navigation

Navigasi berpusat pada pengalaman manusia, bukan sekadar efisiensi waktu.

## Community Driven

Kondisi kota diperbarui melalui kontribusi warga dan proses verifikasi.

## Transparent Recommendation

Setiap rekomendasi rute harus disertai alasan yang dapat dipahami pengguna.

---

# 5. Target Pengguna

## Primary User

- Pengguna kursi roda
- Lansia
- Orang tua dengan stroller
- Pengguna low vision
- Pejalan kaki umum

## Secondary User

- Komunitas disabilitas
- Kampus
- Pemerintah daerah
- Dinas Perhubungan
- Dinas PUPR

---

# 6. Konsep Sistem

Alur utama:

Pengguna memilih kebutuhan perjalanan

↓

Menentukan titik awal dan tujuan

↓

Sistem menghasilkan beberapa alternatif rute

↓

Rute dianalisis menggunakan:

- Accessibility Layer
- Comfort Layer
- Live Condition Layer

↓

Rute yang tidak memenuhi hard constraint dihilangkan

↓

Rute tersisa dibandingkan

↓

Pengguna memilih rute

↓

Setelah perjalanan pengguna dapat mengirim pembaruan kondisi jalur

---

# 7. Arsitektur Konsep

## Layer 1 — Accessibility

Menentukan apakah rute dapat dilewati.

Parameter:

- ramp
- tangga
- guiding block
- lebar trotoar
- permukaan jalan
- lift
- zebra cross
- hambatan permanen

Hard Constraint:
Jika pengguna membutuhkan akses kursi roda dan rute memiliki tangga tanpa alternatif, rute tidak direkomendasikan.

---

## Layer 2 — Comfort

Mengukur kenyamanan perjalanan.

Parameter:

- keteduhan
- pohon
- koridor beratap
- tempat duduk
- shelter
- halte
- air minum
- penerangan

Comfort Layer berasal dari konsep TeduhKota.

---

## Layer 3 — Live Condition

Menampilkan kondisi aktual.

Parameter:

- motor parkir
- proyek jalan
- genangan
- pohon tumbang
- ramp rusak
- guiding block rusak
- lift mati

Data berasal dari laporan warga dan memiliki masa berlaku.

---

# 8. Struktur Website

## A. Landing Page

- Hero
- Penjelasan masalah
- Cara kerja
- Fitur utama
- Dampak SDG
- CTA

---

## B. Authentication

- Login
- Register

Role:
- User
- Moderator
- Admin

---

## C. Onboarding

Memilih profil perjalanan.

Pilihan:

- Kursi roda
- Lansia
- Stroller
- Low Vision
- Pejalan kaki umum

Pengguna juga dapat mengatur prioritas sendiri.

---

## D. Navigation

Fitur utama.

Input:

- lokasi awal
- tujuan

Output:

- beberapa alternatif rute

---

## E. Route Comparison

Menampilkan:

- jarak
- waktu
- accessibility
- comfort
- keamanan
- alasan rekomendasi

Label:

- Paling aksesibel
- Paling teduh
- Paling pendek
- Paling nyaman

---

## F. Route Detail

Menampilkan:

- langkah navigasi
- titik istirahat
- fasilitas
- hambatan
- keteduhan
- kondisi jalur

---

## G. Tambah Kondisi Jalur

Pengguna menggambar segmen jalan.

Data:

- kondisi permukaan
- ramp
- guiding block
- keteduhan
- tempat duduk
- foto
- waktu observasi

---

## H. Laporkan Hambatan

Form cepat untuk:

- trotoar terhalang
- lubang
- genangan
- proyek
- tangga
- ramp rusak

Status:

- sementara
- permanen

---

## I. Riwayat Kontribusi

- laporan saya
- status verifikasi
- riwayat perjalanan

---

## J. Urban Insight Dashboard

Untuk pemerintah atau komunitas.

Menampilkan:

- Walkability Index
- area prioritas
- hambatan terbanyak
- area minim keteduhan
- perubahan kondisi
- status tindak lanjut

---

# 9. Fitur Utama

1. Personalized Navigation
2. Accessibility-aware Routing
3. Comfort Layer (TeduhKota)
4. Live Condition Reporting
5. Community Verification
6. Route Comparison
7. Route Explanation
8. Walkability Dashboard
9. Urban Insight Analytics

---

# 10. Batasan Produk (Scope)

## Yang HARUS ada (MVP)

- Peta interaktif 2D
- Pencarian rute
- Tiga alternatif rute
- Personal Mode
- Perbandingan rute
- Tambah kondisi jalur
- Laporan hambatan
- Dashboard sederhana

## Yang TIDAK menjadi fokus MVP

- Simulasi 3D
- Digital twin kota
- AI vision otomatis
- Integrasi IoT
- Prediksi lalu lintas

---

# 11. Prinsip UI/UX

- Sederhana dan mudah dipahami.
- Aksesibel (WCAG).
- Kontras tinggi.
- Ikon konsisten.
- Informasi spasial mudah dibaca.
- Alasan rekomendasi selalu terlihat.

---

# 12. Indikator Keberhasilan

Bagi pengguna:
- menemukan rute yang lebih sesuai
- menghindari hambatan
- perjalanan lebih nyaman

Bagi kota:
- meningkatnya data kondisi jalur
- prioritas perbaikan lebih akurat
- partisipasi warga meningkat

---

# 13. Hal yang Tidak Boleh Bergeser

Selama proses desain dan pengembangan, seluruh tim harus menjaga prinsip berikut:

- Produk bukan Google Maps.
- Produk bukan direktori fasilitas.
- Produk bukan aplikasi pelaporan semata.
- Produk selalu berpusat pada **perjalanan pengguna**.
- Setiap fitur baru harus mendukung tiga layer utama (Accessibility, Comfort, Live Condition).
- Jika sebuah fitur tidak meningkatkan kualitas perjalanan atau kualitas data kota, fitur tersebut tidak perlu ditambahkan.

---

# 14. Pitch Satu Kalimat

> **AksesKota adalah platform navigasi pejalan kaki inklusif yang merekomendasikan rute berdasarkan kebutuhan pengguna, kondisi aksesibilitas, kenyamanan, dan kondisi aktual jalur, sekaligus menghasilkan data untuk membantu kota menjadi lebih inklusif dan berkelanjutan.**
