# AksesKota — Catatan Handoff Backend

Dokumen ini menjelaskan kebutuhan backend berdasarkan frontend yang berjalan saat ini. Bagian peta sudah memakai **Mapbox GL JS**, sedangkan data rute, skor aksesibilitas, langkah perjalanan, dan laporan masih berupa data mock di frontend.

## 1. Kondisi frontend saat ini

- Framework: Next.js + React.
- Peta: Mapbox GL JS dengan Mapbox Standard dan gedung 3D.
- Token publik dibaca dari `NEXT_PUBLIC_MAPBOX_TOKEN`.
- UI login email dan Google sudah tersedia, tetapi implementasi autentikasi final belum ditentukan.
- Profil mobilitas disimpan sementara di `localStorage`.
- Titik awal, tujuan, tiga alternatif rute, skor, dan detail langkah masih hardcoded.
- Form laporan hanya memperbarui state React dan belum mengirim data ke server.
- Tombol lokasi saya memakai Geolocation API dari browser.

Data mock utama berada di:

- `src/app/components/MapboxMap.jsx`
- `src/app/components/NavigationDashboard.jsx`
- `src/app/components/RouteOnboarding.jsx`

## 2. Pembagian tanggung jawab

### Frontend

- Merender Mapbox dan bangunan 3D.
- Meminta izin lokasi perangkat.
- Menampilkan GeoJSON rute dari backend.
- Menampilkan skor, alasan rekomendasi, instruksi, dan laporan aktif.
- Mengirim session cookie atau access token sesuai kontrak yang dipilih backend.

### Backend

- Memverifikasi identitas pengguna.
- Menyimpan profil mobilitas pengguna.
- Melakukan geocoding atau menormalisasi hasil pencarian lokasi.
- Menghasilkan beberapa alternatif rute.
- Menghitung skor accessibility, comfort, dan live condition.
- Memasukkan laporan terverifikasi sebagai penalti atau hambatan rute.
- Menyimpan laporan, foto, status moderasi, dan riwayat pengguna.

Mapbox GL JS tidak membutuhkan backend hanya untuk menampilkan peta. Backend tetap diperlukan karena algoritma rute AksesKota tidak cukup menggunakan rute pejalan kaki umum.

## 3. Autentikasi

Kebutuhan produknya adalah:

- login dengan akun Google;
- daftar dan login dengan email;
- lanjut sebagai tamu;
- logout;
- mengambil data pengguna aktif;
- menjaga sesi setelah halaman dimuat ulang.

Cara implementasinya menjadi keputusan tim backend. Backend dapat memakai Laravel Socialite/OAuth, OpenID Connect, Auth.js, atau penyedia identitas lain selama kontrak API frontend tetap konsisten. Dokumen ini tidak mewajibkan provider tertentu.

Jika memakai backend Laravel dan domain frontend/backend masih satu ekosistem, session cookie `HttpOnly`, `Secure`, dan `SameSite` merupakan pilihan yang baik. Jika memakai access token, frontend mengirim:

```http
Authorization: Bearer <access-token>
```

Endpoint autentikasi yang disarankan:

```http
GET  /auth/google/redirect
GET  /auth/google/callback
POST /api/v1/auth/register
POST /api/v1/auth/login
POST /api/v1/auth/logout
GET  /api/v1/me
```

Alur Google login berbasis redirect:

1. Frontend membuka `/auth/google/redirect`.
2. Backend mengarahkan pengguna ke consent screen Google.
3. Google mengembalikan authorization code ke `/auth/google/callback`.
4. Backend menukar code, mengambil profil Google, lalu membuat atau memperbarui user lokal.
5. Backend membuat session atau access token.
6. Backend mengarahkan pengguna kembali ke frontend.

Frontend tidak boleh menerima atau menyimpan `GOOGLE_CLIENT_SECRET`. Jika backend memilih popup atau mekanisme lain, hasil akhirnya tetap harus berupa session/token aplikasi yang dapat dipakai untuk mengakses endpoint terproteksi.

Tamu tetap boleh mencari rute. Endpoint laporan, riwayat, dan penyimpanan profil memerlukan autentikasi.

## 4. Endpoint minimum

Prefix yang disarankan: `/api/v1`.

### Profil pengguna

```http
GET /api/v1/me
PATCH /api/v1/me/profile
```

Request:

```json
{
  "mobility_profile": "wheelchair"
}
```

Nilai yang diterima:

- `walking`
- `wheelchair`
- `elderly`
- `stroller`
- `low-vision`

### Pencarian lokasi

```http
GET /api/v1/places/search?q=Balai%20Kota%20Semarang&proximity=110.4167,-6.9872
```

Response:

```json
{
  "data": [
    {
      "id": "place-id",
      "name": "Balai Kota Semarang",
      "address": "Jl. Pemuda, Semarang",
      "coordinates": [110.4108, -6.9839]
    }
  ]
}
```

Backend boleh meneruskan request ke Mapbox Geocoding API, tetapi hasil perlu dinormalisasi dan sebaiknya di-cache. Jangan mengirim Mapbox secret token ke browser.

### Mencari alternatif rute

```http
POST /api/v1/routes/search
```

Request:

```json
{
  "origin": {
    "coordinates": [110.4227, -6.9904]
  },
  "destination": {
    "coordinates": [110.4108, -6.9839]
  },
  "mobility_profile": "wheelchair",
  "depart_at": "2026-07-14T10:00:00+07:00"
}
```

Response minimum:

```json
{
  "data": {
    "recommended_route_id": "route-a",
    "routes": [
      {
        "id": "route-a",
        "label": "Rute A",
        "badge": "Paling Aksesibel",
        "distance_m": 1100,
        "duration_min": 16,
        "score": 88,
        "scores": {
          "accessibility": 94,
          "comfort": 81,
          "live_condition": 89
        },
        "reasons": [
          "Tidak ada tangga",
          "Ramp tersedia di 3 titik",
          "Trotoar lebar di 82% rute"
        ],
        "geometry": {
          "type": "LineString",
          "coordinates": [[110.4227, -6.9904], [110.4108, -6.9839]]
        },
        "steps": [
          {
            "instruction": "Mulai dari lokasi saat ini",
            "distance_m": 120,
            "accessibility_note": "Trotoar rata"
          }
        ]
      }
    ]
  }
}
```

Koordinat GeoJSON wajib memakai urutan `[longitude, latitude]`, bukan sebaliknya.

### Laporan hambatan

```http
POST /api/v1/reports
GET /api/v1/reports/me
GET /api/v1/reports/nearby?lng=110.4167&lat=-6.9872&radius=1000
```

Gunakan `multipart/form-data` untuk pengiriman foto:

```text
type=broken_sidewalk
description=Trotoar berlubang dan sulit dilewati kursi roda
latitude=-6.9872
longitude=110.4167
photo=<file>
```

Jenis hambatan awal:

- `broken_sidewalk`
- `flood`
- `missing_ramp`
- `broken_light`
- `blocked_path`
- `other`

Status laporan:

- `pending`
- `verified`
- `rejected`
- `resolved`

Hanya laporan `verified` yang langsung memengaruhi skor rute. Laporan `pending` dapat diberi penalti lebih kecil jika jumlah pelapor independennya mencukupi.

## 5. Model data minimum

### users

- `id`
- `auth_provider` nullable, contoh `google` atau `email`
- `provider_user_id` nullable
- `email`
- `name`
- `avatar_url`
- `mobility_profile`
- timestamps

### reports

- `id`
- `user_id`
- `type`
- `description`
- `location` sebagai `geography(Point, 4326)`
- `photo_url`
- `status`
- `verified_by`
- `verified_at`
- `resolved_at`
- timestamps

### route_segments

- `id`
- `geometry` sebagai `geometry(LineString, 4326)`
- `surface_type`
- `width_cm`
- `slope_percent`
- `has_ramp`
- `has_stairs`
- `has_guiding_block`
- `shade_score`
- `lighting_score`
- `last_verified_at`

### route_search_logs

- `id`
- `user_id` nullable
- origin dan destination
- mobility profile
- route IDs yang dihasilkan
- route yang dipilih
- waktu pencarian

Gunakan PostgreSQL + PostGIS untuk query jarak, laporan di sekitar rute, dan pemotongan segmen spasial.

## 6. Logika skor awal

Skor akhir dapat dimulai dari bobot berikut:

```text
final_score =
  accessibility_score * 0.50 +
  comfort_score       * 0.25 +
  live_condition      * 0.25
```

Bobot harus berubah berdasarkan profil. Contoh untuk kursi roda, tangga atau kemiringan ekstrem merupakan hard constraint dan rute harus dieliminasi, bukan sekadar dikurangi skornya.

Backend harus mengembalikan alasan yang dapat dipahami pengguna, bukan hanya angka skor.

## 7. Mapbox dan keamanan token

- `NEXT_PUBLIC_MAPBOX_TOKEN` adalah public token dan memang dikirim ke browser.
- Batasi token public berdasarkan URL produksi dan `localhost` melalui dashboard Mapbox.
- Secret token Mapbox harus disimpan hanya pada environment backend.
- Jangan commit `.env.local`.
- Terapkan caching, rate limit, timeout, dan fallback pada geocoding/routing eksternal.

Environment backend yang disarankan:

```env
MAPBOX_SECRET_TOKEN=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=
SESSION_SECRET=
DATABASE_URL=
CLOUDINARY_URL=
FRONTEND_URL=http://localhost:3000
```

## 8. Integrasi frontend berikutnya

Urutan pengerjaan yang disarankan:

1. Tentukan strategi autentikasi backend dan implementasikan login Google, email, logout, serta endpoint `/me`.
2. Simpan profil mobilitas ke database.
3. Hubungkan autocomplete tujuan ke `/places/search`.
4. Ganti `routeFeatures` dan array `routes` mock dengan response `/routes/search`.
5. Hubungkan form serta riwayat laporan.
6. Tambahkan loading, error, retry, dan empty state untuk seluruh request.
7. Tambahkan WebSocket atau polling untuk laporan kondisi langsung jika diperlukan.

## 9. Definition of done backend MVP

- User dapat login dengan Google atau email dan dikenali oleh endpoint `/me`.
- Tamu dan user dapat mencari rute dari koordinat aktual.
- API mengembalikan minimal tiga alternatif dalam GeoJSON.
- Setiap rute memiliki skor dan alasan rekomendasi.
- User dapat mengunggah laporan beserta lokasi dan foto.
- Moderator dapat mengubah status laporan.
- Laporan terverifikasi memengaruhi rekomendasi berikutnya.
- Secret tidak pernah terkirim ke client atau tercatat di log.
