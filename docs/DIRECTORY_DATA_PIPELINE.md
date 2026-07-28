# Pipeline data Direktori AksesKota

Dokumen ini menjelaskan sumber data Direktori Bogor, jalur impor ke backend, serta batas antara data hasil pengumpulan otomatis dan data aksesibilitas yang sudah diverifikasi.

## Kondisi dataset lokal

Dataset terakhir berada di:

```text
C:\Users\User\Desktop\Lomba\bogor-place-scraper\output\processed\database_import.json
```

Ringkasannya:

| Bagian | Jumlah |
| --- | ---: |
| Destinasi | 293 |
| Bukti aksesibilitas awal | 399 |
| Gambar | 292 |
| Ulasan terkait aksesibilitas | 0 |

Angka `0` pada ulasan berarti hasil scraping terakhir belum membawa ulasan yang cocok dengan kata kunci aksesibilitas. Ini tidak boleh diterjemahkan sebagai “tidak aksesibel”.

## Alur yang digunakan sekarang

```text
queries.txt
  → gosom/google-maps-scraper melalui Docker
  → output/raw/results.json
  → normalisasi Python
  → output/processed/database_import.json
  → backend/prisma/importDestinations.ts
  → MySQL
  → GET /api/destinations
  → Direktori di frontend
```

Jalankan pengumpulan ulang dari folder scraper:

```powershell
cd C:\Users\User\Desktop\Lomba\bogor-place-scraper
.\run.bat
```

Pilih menu `9` untuk scraping baru sekaligus membuat JSON database. Untuk mengolah ulang data mentah yang sudah ada tanpa scraping, pilih menu `8`.

Impor hasilnya dari folder backend:

```powershell
cd C:\Users\User\Desktop\Lomba\akseskota\AksesKota\backend
npm run import:destinations -- "C:\Users\User\Desktop\Lomba\bogor-place-scraper\output\processed\database_import.json"
```

Importer bersifat idempoten. Tempat diperbarui berdasarkan `externalId`, bukan diduplikasi.

## Sumber yang disarankan agar profil tempat lebih lengkap

Gunakan beberapa sumber dengan fungsi yang berbeda:

1. **Google Places/Maps** untuk nama, kategori, alamat, koordinat, jam buka, rating, website, telepon, dan foto. Pipeline lama menggunakan scraper pihak ketiga; untuk produksi, utamakan [Places API resmi](https://developers.google.com/maps/documentation/places/web-service/reference/rest/v1/places) serta patuhi [ketentuan atribusi Places](https://developers.google.com/maps/documentation/places/web-service/policies).
2. **OpenStreetMap** untuk data terbuka melalui [Overpass API](https://wiki.openstreetmap.org/wiki/Overpass_API) dan tag seperti [`wheelchair`](https://wiki.openstreetmap.org/wiki/Key%3Awheelchair), `toilets:wheelchair`, `ramp`, [`tactile_paving`](https://wiki.openstreetmap.org/wiki/Tactile_paving), `lit`, `opening_hours`, dan `step_count`. Simpan identitas elemen OSM serta atribusi ODbL.
3. **Website resmi tempat** untuk jam operasional, tiket, kontak, dan fasilitas yang dipublikasikan pengelola.
4. **Survei dan laporan komunitas AksesKota** untuk kondisi faktual: lebar pintu, kemiringan ramp, jumlah anak tangga, guiding block, kondisi toilet, area teduh, permukaan jalan, serta tanggal pemeriksaan.

Google/OSM membantu menemukan kandidat tempat. Status “terverifikasi aksesibel” hanya boleh berasal dari bukti lapangan, pengelola, atau beberapa laporan komunitas yang konsisten.

## Field yang masih perlu dilengkapi

Setiap tempat idealnya memiliki:

- identitas sumber dan waktu pengambilan;
- koordinat, alamat, kategori, dan jam buka;
- foto utama yang legal ditampilkan;
- pintu masuk, parkir, tempat duduk, dan toilet aksesibel;
- ramp, tangga, lift, guiding block, pencahayaan, serta lebar jalur;
- kualitas permukaan dan tingkat keteduhan;
- bukti foto, pelapor, tanggal verifikasi, dan status verifikasi;
- skor kelengkapan data agar frontend dapat membedakan “tidak tersedia” dari “belum diketahui”.

## Aturan status

- `UNVERIFIED`: baru berasal dari scraping atau satu klaim.
- `COMMUNITY_VERIFIED`: didukung bukti komunitas yang cukup dan masih baru.
- `OWNER_VERIFIED`: dikonfirmasi pengelola tempat.
- `STALE`: bukti sudah melewati batas waktu pemeriksaan ulang.

Jangan mengubah nilai kosong menjadi `false`. Nilai kosong berarti data belum diketahui.
