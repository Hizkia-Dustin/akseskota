# AksesKota

Monorepo aplikasi AksesKota untuk navigasi pejalan kaki yang inklusif.

## Struktur repository

```text
AksesKota/
├── frontend/   # Next.js, React, Tailwind CSS, Mapbox GL JS
├── backend/    # Express API (akan dikembangkan tim backend)
└── docs/       # Spesifikasi produk, arsitektur, dan handoff backend
```

## Menjalankan frontend

```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev
```

Isi `frontend/.env.local` dengan konfigurasi lokal. File environment asli tidak disimpan di Git.

## Backend

Kontrak awal dan kebutuhan backend tersedia di `docs/BACKEND_HANDOFF.md`.

## Arah produk untuk lomba

Tujuan, pembeda dari Google Maps, skenario demo, dan prioritas implementasi tersedia di `docs/AKSESKOTA_DIFFERENTIATION_GOALS.md`. Dokumen ini menjadi acuan agar pengembangan tetap berfokus pada navigasi aksesibel, bukan hanya pencarian rute umum.
