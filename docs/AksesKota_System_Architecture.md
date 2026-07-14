# AksesKota_System_Architecture

# 1. Tujuan Dokumen

Dokumen ini menjadi acuan teknis seluruh tim agar implementasi sistem tetap konsisten dengan Product Guide. Seluruh keputusan arsitektur harus mendukung tiga layer utama:

- Accessibility Layer
- Comfort Layer
- Live Condition Layer

---

# 2. Arsitektur Sistem

```text
                User Browser
                     │
              React / Next.js
                     │
         REST API / Laravel Backend
                     │
 ┌──────────────┬───────────────┬──────────────┐
 │ PostgreSQL   │ File Storage  │ Map Services │
 │ + PostGIS    │ Cloudinary    │ OSM/MapLibre │
 └──────────────┴───────────────┴──────────────┘
```

Frontend bertanggung jawab pada UI, visualisasi peta, dan interaksi pengguna.

Backend menangani autentikasi, routing, penilaian rute, validasi data, dan manajemen laporan.

PostGIS menyimpan data spasial.

---

# 3. Technology Stack

## Frontend

- React / Next.js
- Tailwind CSS
- MapLibre GL JS
- React Query
- React Hook Form

## Backend

- Laravel 12
- REST API
- Sanctum Authentication

## Database

- PostgreSQL
- PostGIS

## Storage

- Cloudinary

## Maps

- OpenStreetMap
- GeoJSON

---

# 4. User Roles

## User

- mencari rute
- mengirim laporan
- memperbarui kondisi jalur
- melihat riwayat

## Moderator

- memverifikasi laporan
- menggabungkan laporan duplikat
- menolak laporan tidak valid

## Admin

- mengelola pengguna
- kategori
- statistik
- dashboard

---

# 5. Database Concept

## users

- id
- name
- email
- role

---

## user_preferences

- wheelchair_mode
- stroller_mode
- elderly_mode
- lowvision_mode
- custom_priority

---

## road_segments

Menyimpan data setiap segmen jalan.

Field:

- geometry
- surface_condition
- width
- shade_level
- lighting
- accessibility_score

---

## facilities

Jenis:

- ramp
- lift
- bench
- shelter
- drinking_water
- accessible_toilet

Lokasi berupa Point.

---

## obstacles

Jenis:

- stairs
- pothole
- flood
- parked_vehicle
- construction
- fallen_tree

Status:

- temporary
- permanent

---

## reports

Laporan warga.

- photo
- description
- created_at
- expires_at
- verification_status

---

## route_history

Riwayat pencarian rute.

---

# 6. Data Model

## Geometry

Point
- fasilitas

LineString
- segmen jalan

Polygon
- area publik

---

# 7. Routing Engine

Flow:

```text
Origin

↓

Destination

↓

Generate candidate routes

↓

Accessibility Filter

↓

Comfort Scoring

↓

Live Condition Filter

↓

Recommendation
```

---

# 8. Hard Constraint

Rute langsung ditolak apabila:

- terdapat tangga untuk mode kursi roda
- jalur terlalu sempit
- tidak tersedia ramp
- hambatan permanen tanpa alternatif

---

# 9. Soft Preference

Setelah lolos hard constraint, sistem memberi bobot:

- keteduhan
- tempat duduk
- penerangan
- kualitas permukaan
- panjang rute
- crossing aman

Bobot mengikuti preferensi pengguna.

---

# 10. Route Recommendation Response

```json
{
  "route":"A",
  "distance":"1.1 km",
  "duration":"16 min",
  "accessibility":88,
  "comfort":72,
  "safety":81,
  "reason":[
    "Tidak ada tangga",
    "Ramp tersedia",
    "68% jalur teduh"
  ]
}
```

---

# 11. API Modules

Authentication

- POST /login
- POST /register

Navigation

- GET /routes

Road Condition

- POST /reports
- GET /road-segments

Facilities

- GET /facilities

Dashboard

- GET /urban-dashboard

Moderator

- PATCH /reports/{id}/verify

---

# 12. Frontend Pages

Public

- Landing
- Login
- Register

User

- Home
- Navigation
- Route Comparison
- Route Detail
- Report Condition
- Report Obstacle
- History
- Profile

Moderator

- Verification Queue

Admin

- Dashboard
- User Management
- Analytics

---

# 13. Security

- Authentication menggunakan Sanctum
- Role-based Access Control
- Validasi upload foto
- Rate limiting laporan
- Audit log moderator

---

# 14. Deployment

Frontend:
- Vercel

Backend:
- VPS / Railway

Database:
- PostgreSQL + PostGIS

Storage:
- Cloudinary

---

# 15. Future Development

- AI deteksi hambatan dari foto
- Integrasi data pemerintah
- Prediksi keteduhan berdasarkan waktu
- Offline navigation
- Mobile PWA

---

# 16. Engineering Principles

- Semua fitur harus mendukung Product Guide.
- Hindari fitur yang tidak berkaitan dengan pengalaman perjalanan.
- Data spasial disimpan sebagai GeoJSON/PostGIS.
- Routing harus selalu memprioritaskan hard constraint sebelum kenyamanan.
- Seluruh rekomendasi harus dapat dijelaskan kepada pengguna.
