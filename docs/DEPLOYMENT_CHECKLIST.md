# Deployment Sementara AksesKota

## Arsitektur

- Frontend Next.js: Vercel, Root Directory `frontend`.
- Backend Express: Railway, Root Directory `backend`.
- Database: MySQL Railway.
- Foto: Cloudinary (`UPLOAD_STORAGE=cloudinary`).
- Peta, geocoding, dan kandidat berjalan kaki: Mapbox.
- Angkot: belum diaktifkan dan tidak menjadi bagian deployment ini.

## Environment backend

```env
NODE_ENV=production
CLIENT_URL=https://domain-frontend.vercel.app
DATABASE_URL=mysql://...
JWT_ACCESS_SECRET=acak-minimal-32-karakter
JWT_REFRESH_SECRET=acak-berbeda-minimal-32-karakter
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
UPLOAD_STORAGE=cloudinary
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
REPORT_RATE_LIMIT_WINDOW_MS=3600000
REPORT_RATE_LIMIT_MAX=10
AUTH_RATE_LIMIT_WINDOW_MS=900000
AUTH_RATE_LIMIT_MAX=20
VERIFICATION_RATE_LIMIT_WINDOW_MS=3600000
VERIFICATION_RATE_LIMIT_MAX=60
```

`CLIENT_URL` dapat berisi beberapa origin yang dipisahkan koma. Jangan memakai wildcard.

## Environment frontend

```env
NEXT_PUBLIC_API_URL=https://domain-backend.up.railway.app/api
NEXT_PUBLIC_MAPBOX_TOKEN=pk....
```

Batasi token Mapbox ke domain Vercel dan localhost melalui dashboard Mapbox.

## Perintah data production

Migrasi dijalankan otomatis oleh `backend/railway.json` sebelum aplikasi dimulai:

```text
npm run prisma:migrate:deploy
```

Buat atau perbarui admin tanpa menjalankan seed demo:

```text
ADMIN_NAME="Admin AksesKota"
ADMIN_EMAIL="admin@domain.id"
ADMIN_PASSWORD="password-kuat-minimal-12"
npm run seed:admin
```

Jangan menjalankan `seed.ts` pada database production karena berisi data demo lama.

## Smoke test wajib

1. `GET /health` mengembalikan HTTP 200.
2. Daftar, login, refresh token, dan logout berhasil.
3. Autocomplete hanya menampilkan area Kota Bogor.
4. Pencarian Stasiun Bogor ke Suryakencana menghasilkan geometri yang mengikuti jalan.
5. Kartu rute menampilkan peringkat Dijkstra, cakupan, dan status data.
6. Laporan guest dengan foto menghasilkan URL Cloudinary dan muncul pada peta.
7. Laporan pending tidak memengaruhi rute; laporan verified memengaruhi pencarian ulang.
8. Akun yang sama tidak dapat menggandakan suara atau rating tempat.
9. Admin dapat approve, reject, needs-recheck, dan merge tanpa error unique constraint.
10. Riwayat tersimpan hanya setelah Mulai Navigasi dan dapat dihapus oleh pemiliknya.
11. Navigasi suara dapat dibisukan, diulang, maju/mundur, dan mendeteksi keluar jalur.
12. Refresh halaman tidak menghapus data database.
13. Console browser tidak berisi error CORS, mixed content, atau request localhost.
