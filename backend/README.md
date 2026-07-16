# AksesKota Backend

Backend REST API untuk **AksesKota** — platform navigasi pejalan kaki inklusif.
Dibangun dengan **Express.js + TypeScript + Prisma + MariaDB 10.4 (native spatial)**, dikonsumsi oleh frontend **Next.js**.

Mengacu pada: `AksesKota_Product_Guide.md`, `AksesKota_Feature_Specification.md`, `AksesKota_System_Architecture.md`.

> Catatan: dokumen System Architecture asli menyebutkan Laravel + Sanctum + PostgreSQL/PostGIS. Tim ini memilih **Express.js + JWT + MariaDB** sebagai gantinya — entity, API mapping, dan hard-constraint routing tetap mengikuti dokumen tersebut, hanya lapisan database & auth yang berbeda.

---

## 1. Persiapan

### Requirement
- Node.js 18+
- **MariaDB 10.4+** (tersedia pada XAMPP; spatial types sudah built-in)
- Akun Cloudinary (untuk upload foto laporan)

### Instalasi

```bash
npm install
cp .env.example .env
# isi .env: DATABASE_URL, JWT secrets, Cloudinary credentials
```

### Setup Database

```bash
# 1. Buat database kosong (MariaDB sudah punya spatial support built-in,
#    tidak perlu install extension apapun seperti PostGIS di Postgres)
mysql -u root -p -e "CREATE DATABASE akseskota CHARACTER SET utf8mb4;"

# 2. Generate & jalankan migration
npx prisma migrate dev --name init

# 3. (opsional) isi data contoh
npm run seed
```

### Menjalankan server

```bash
npm run dev      # development, hot reload
npm run build && npm start   # production
```

Server default di `http://localhost:4000`. Cek `GET /health`.

---

## 2. Struktur Folder

```
src/
  config/        # env, prisma client, cloudinary
  middlewares/    # auth, role guard, validasi, error handler, upload
  utils/          # jwt, password, response envelope, spatial (MariaDB raw SQL)
  routingEngine/  # accessibility filter, comfort scoring, live condition filter, explain
  modules/
    auth/         # F001
    users/        # F002, F014, F015, F019
    routes/       # F004, F005, F006 (pakai routingEngine)
    roadSegments/ # F011
    obstacles/    # F012
    facilities/
    reports/      # F013 (community verification)
    moderator/    # F018 (approve/reject/merge)
    dashboard/    # F016, F017
    admin/        # F020
  app.ts
  server.ts
prisma/
  schema.prisma
  init-mysql.sql
  seed.ts
```

Tiap module: `*.schema.ts` (validasi Zod) → `*.controller.ts` (HTTP layer) → `*.service.ts` (business logic).

---

## 3. Alur Routing Engine (bagian paling penting)

Sesuai System Architecture section 7-9:

```
generateCandidateRoutes()          -> kandidat rute dari road_segments (min. 3)
  -> applyAccessibilityFilter()    -> HARD CONSTRAINT, rute ditolak jika melanggar
  -> applyLiveConditionFilter()    -> cek hambatan aktif (belum expired)
  -> computeComfortScore()         -> SOFT PREFERENCE, weighted by user preference
  -> explainRoute()                -> alasan rekomendasi (bukan cuma skor)
```

**Catatan penting**: `generateCandidateRoutes` di scaffold ini pakai pendekatan buffer/corridor sederhana (bukan real pathfinding). Ini cukup untuk MVP/demo dan menjaga bentuk data (`CandidateRoute`) tetap sama. Untuk produksi, ganti dengan engine routing pejalan kaki sungguhan — misalnya **OSRM** atau **GraphHopper** (self-hosted, walking profile) di atas graph jaringan jalan yang sebenarnya (pgRouting tidak berlaku karena itu khusus Postgres). Pada MariaDB 10.4, jarak LineString dihitung dengan pendekatan planar lokal karena `ST_Distance_Sphere` hanya stabil untuk Point-to-Point. Layer accessibility/comfort/live-condition di atasnya tidak perlu berubah.

---

## 4. API Endpoints

| Modul | Method & Path | Auth | Fitur |
|---|---|---|---|
| Auth | POST /api/auth/register | - | F001 |
| Auth | POST /api/auth/login | - | F001 |
| Auth | POST /api/auth/refresh | - | F001 |
| Users | GET /api/users/me | User | F019 |
| Users | PATCH /api/users/me/preferences | User | F002 |
| Users | GET /api/users/me/contributions | User | F015 |
| Users | GET /api/users/me/route-history | User | F014 |
| Routes | GET /api/routes?originLat&originLng&destLat&destLng&mode | Optional | F004, F005 |
| Routes | GET /api/routes/:searchId/:routeId | Optional | F006 |
| Road Segments | POST /api/road-segments (multipart, field `photo`) | User | F011 |
| Road Segments | GET /api/road-segments?lat&lng&radiusMeters | - | F008/F009 data |
| Obstacles | POST /api/obstacles (multipart, field `photo`) | User | F012 |
| Obstacles | GET /api/obstacles?activeOnly | - | F010 |
| Facilities | GET /api/facilities?lat&lng&type | - | - |
| Facilities | POST /api/facilities | Admin/Mod | - |
| Reports | GET /api/reports?status&targetType | - | - |
| Reports | POST /api/reports/:id/verify | User | F013 |
| Moderator | GET /api/moderator/queue | Moderator/Admin | F018 |
| Moderator | PATCH /api/moderator/reports/:id/approve | Moderator/Admin | F018 |
| Moderator | PATCH /api/moderator/reports/:id/reject | Moderator/Admin | F018 |
| Moderator | POST /api/moderator/reports/merge | Moderator/Admin | F018 |
| Dashboard | GET /api/dashboard/walkability | User | F016 |
| Dashboard | GET /api/dashboard/urban-insight | Admin/Mod | F017 |
| Admin | GET /api/admin/users | Admin | F020 |
| Admin | PATCH /api/admin/users/:id/role | Admin | F020 |
| Admin | GET /api/admin/statistics | Admin | F020 |

Semua response pakai format konsisten:
```json
{ "success": true, "data": ..., "meta": null }
{ "success": false, "message": "...", "errors": null }
```

---

## 5. Untuk Tim Frontend (Next.js)

- Base URL: `http://localhost:4000/api`
- Auth: kirim `Authorization: Bearer <accessToken>` di setiap request yang butuh login.
- CORS sudah diatur ke `CLIENT_URL` di `.env` — samakan dengan origin dev Next.js (default `http://localhost:3000`).
- Upload foto (F011/F012): gunakan `multipart/form-data` dengan field `photo`.
- Search rute mengembalikan `searchId` — pakai itu untuk request detail rute (`GET /api/routes/:searchId/:routeId`), hasil pencarian di-cache 15 menit di server.

---

## 6. Yang belum diimplementasikan (Future Development, sesuai dokumen)

- AI deteksi hambatan dari foto
- Prediksi keteduhan berdasarkan posisi matahari
- Integrasi Open Data pemerintah
- Offline mode / PWA
- Real pathfinding engine (OSRM/GraphHopper) menggantikan `generateCandidateRoutes` sementara
- Job scheduler untuk `deactivateExpiredObstacles()` (sudah ada fungsinya di `obstacles.service.ts`, tinggal di-hook ke cron)
