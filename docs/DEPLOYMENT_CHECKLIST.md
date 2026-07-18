# Deployment Sementara AksesKota

## Arsitektur

- Frontend Next.js: Vercel project pertama, Root Directory `frontend`.
- Backend Express: Vercel project kedua, Root Directory `backend`.
- Database: Aiven for MySQL Free Tier.
- Foto: Cloudinary (`UPLOAD_STORAGE=cloudinary`).
- Peta, geocoding, dan kandidat berjalan kaki: Mapbox.
- Angkot: belum diaktifkan dan tidak menjadi bagian deployment ini.

## Environment backend

```env
NODE_ENV=production
CLIENT_URL=https://domain-frontend.vercel.app
DATABASE_URL=mysql://USER:PASSWORD@HOST:PORT/defaultdb?sslcert=aiven-ca.pem&sslaccept=strict&connection_limit=3
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
NEXT_PUBLIC_API_URL=https://domain-backend.vercel.app/api
NEXT_PUBLIC_MAPBOX_TOKEN=pk....
```

Batasi token Mapbox ke domain Vercel dan localhost melalui dashboard Mapbox.

## Membuat database gratis

1. Daftar di Aiven dan buat service **MySQL - Free**.
2. Salin Service URI dari halaman Overview.
3. Gunakan database `defaultdb` atau buat database `akseskota`.
4. Ganti parameter `?ssl-mode=REQUIRED` pada URI menjadi
   `?sslcert=aiven-ca.pem&sslaccept=strict&connection_limit=3`, lalu jadikan
   hasilnya sebagai `DATABASE_URL` pada project backend Vercel.

Aiven Free menyediakan MySQL asli sehingga kolom dan fungsi spatial AksesKota
tetap dapat dipakai. Jangan menggantinya dengan database MySQL-compatible yang
tidak mendukung `POINT`, `LINESTRING`, dan fungsi `ST_*`.

## Migrasi dan admin production

Vercel tidak menjalankan proses migrasi database secara otomatis. Sebelum
deployment backend pertama, jalankan dari PowerShell pada folder `backend`:

```powershell
$env:DATABASE_URL="mysql://USER:PASSWORD@HOST:PORT/defaultdb?sslcert=aiven-ca.pem&sslaccept=strict&connection_limit=3"
npm run prisma:migrate:deploy
```

Buat atau perbarui admin pada database Aiven tanpa menjalankan seed demo:

```powershell
$env:ADMIN_NAME="Admin AksesKota"
$env:ADMIN_EMAIL="admin@domain.id"
$env:ADMIN_PASSWORD="password-kuat-minimal-12"
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

## Urutan deployment Vercel

1. Import repository yang sama sebagai project backend dengan Root Directory
   `backend`, lalu isi seluruh environment backend.
2. Deploy backend dan pastikan `https://domain-backend.vercel.app/health`
   mengembalikan HTTP 200.
3. Import repository lagi sebagai project frontend dengan Root Directory
   `frontend`.
4. Isi `NEXT_PUBLIC_API_URL` menggunakan domain backend dan deploy frontend.
5. Masukkan domain frontend final ke `CLIENT_URL` project backend, lalu redeploy
   backend agar CORS menerima aplikasi tersebut.

Pada Vercel, backend berjalan sebagai serverless function. Pembersihan obstacle
kedaluwarsa melalui timer tidak dijadikan sumber kebenaran; query rute dan peta
tetap mengecualikan obstacle yang `expiresAt`-nya sudah lewat.
