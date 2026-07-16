# Tujuan dan Pembeda AksesKota

Dokumen ini menjadi acuan keputusan produk dan teknis AksesKota untuk lomba. Setiap fitur baru harus membantu tujuan di bawah, bukan sekadar meniru pengalaman Google Maps.

## 1. Pernyataan produk

> AksesKota bukan aplikasi untuk mencari rute tercepat. AksesKota mencari rute yang benar-benar dapat dilalui berdasarkan kebutuhan mobilitas pengguna, kondisi fisik jalur, kenyamanan, dan hambatan aktual yang dilaporkan komunitas.

Google Maps atau Mapbox tetap dapat dipakai sebagai penyedia peta dasar, pencarian tempat, estimasi jarak, dan kandidat rute. Nilai utama AksesKota berada pada lapisan keputusan aksesibilitas di atas layanan tersebut.

## 2. Masalah yang diselesaikan

Rute terpendek belum tentu dapat dilalui oleh:

- pengguna kursi roda;
- lansia;
- orang tua dengan stroller;
- pengguna low vision;
- pejalan kaki dengan kebutuhan aksesibilitas lainnya.

Rute umum dapat memiliki tangga, trotoar terlalu sempit, permukaan rusak, ramp yang tidak tersedia, guiding block terputus, penerangan buruk, banjir, atau kendaraan yang menutup jalur. Informasi tersebut tidak cukup direpresentasikan oleh estimasi jarak dan waktu saja.

## 3. Pembeda utama dari Google Maps

| Google Maps/layanan peta umum | AksesKota |
|---|---|
| Mengoptimalkan jarak dan waktu | Mengutamakan apakah jalur dapat dilalui pengguna |
| Profil berjalan kaki bersifat umum | Profil kursi roda, lansia, stroller, low vision, dan umum |
| Hambatan aksesibilitas lokal terbatas | Laporan komunitas dan verifikasi moderator |
| Menampilkan satu estimasi generik | Menjelaskan alasan rute direkomendasikan atau ditolak |
| Data tempat menjadi fokus utama | Kondisi setiap segmen perjalanan menjadi fokus utama |
| Pengguna hanya menerima rute | Pengguna ikut memperbarui kondisi kota |
| Data berhenti sebagai navigasi | Data agregat menjadi insight bagi pemerintah |

## 4. Prinsip keputusan rute

Urutan pemrosesan tidak boleh dibalik:

1. Ambil kandidat rute pejalan kaki dari Mapbox Directions.
2. Cocokkan geometri kandidat dengan segmen jalan AksesKota.
3. Terapkan **hard constraint** sesuai profil pengguna.
4. Periksa hambatan aktif dan laporan terverifikasi.
5. Hitung kenyamanan sebagai **soft preference**.
6. Urutkan rute yang lolos.
7. Tampilkan alasan yang dapat dipahami pengguna.

Contoh hard constraint:

- Kursi roda: tangga tanpa ramp harus menggugurkan rute.
- Kursi roda dan stroller: trotoar di bawah lebar minimum harus menggugurkan rute.
- Semua profil: jalur yang benar-benar tertutup harus digugurkan.

Contoh soft preference:

- Lansia memprioritaskan bangku, shelter, dan jarak istirahat.
- Low vision memprioritaskan guiding block dan pencahayaan.
- Pengguna umum dapat memprioritaskan keteduhan dan kenyamanan.

## 5. Sumber data

### Data eksternal

- **Mapbox Search Box:** nama tempat, alamat, kategori tempat, dan koordinat.
- **Mapbox Directions:** kandidat rute berjalan kaki, jarak, waktu, dan instruksi.
- **Google Street View:** pemeriksaan visual tambahan, bukan sumber skor otomatis.
- **OpenStreetMap/Open Data pemerintah:** data awal fasilitas dan jaringan jalan jika tersedia.

### Data milik AksesKota

- kondisi permukaan trotoar;
- lebar jalur;
- ramp dan tangga;
- guiding block;
- keteduhan;
- pencahayaan;
- bangku, shelter, dan fasilitas pendukung;
- hambatan aktif;
- status verifikasi dan waktu pembaruan data.

Data tempat tidak boleh langsung dianggap aksesibel hanya karena ditemukan di Mapbox. Skor aksesibilitas hanya boleh muncul jika ada data jalur atau fasilitas yang dapat dipertanggungjawabkan.

## 6. Target demo lomba

Demo harus membuktikan perbedaan hasil, bukan hanya memperlihatkan antarmuka peta.

### Skenario wajib

1. Pilih titik awal dan tujuan yang sama.
2. Cari dengan profil **Pejalan Kaki**.
3. Cari kembali dengan profil **Kursi Roda**.
4. Tunjukkan bahwa kandidat bertangga ditolak atau rutenya berubah.
5. Tampilkan alasan: misalnya “ditolak karena tangga tanpa ramp”.
6. Tambahkan laporan hambatan pada salah satu segmen.
7. Moderator memverifikasi laporan.
8. Cari ulang dan tunjukkan rekomendasi berubah.
9. Tampilkan dampaknya pada dashboard insight kota.

Jika hasil rute semua profil tetap sama tanpa penjelasan berbasis data, maka demo belum menunjukkan nilai utama AksesKota.

## 7. Definition of done pembeda produk

- [ ] Profil mobilitas dikirim dari frontend ke backend pada setiap pencarian.
- [ ] Kandidat Mapbox diproses oleh routing engine AksesKota.
- [ ] Kursi roda dan stroller tidak diarahkan ke tangga tanpa ramp.
- [ ] Rute yang ditolak memiliki alasan yang jelas.
- [ ] Rute yang direkomendasikan memiliki sumber data dan waktu pembaruan.
- [ ] Laporan `pending` tidak langsung dianggap fakta terverifikasi.
- [ ] Laporan `verified` memengaruhi pencarian berikutnya.
- [ ] Skor aksesibilitas tidak dibuat dari angka contoh atau asumsi.
- [ ] UI membedakan data aktual, data belum tersedia, dan data kedaluwarsa.
- [ ] Minimal satu area demo memiliki data segmen yang cukup lengkap.
- [ ] Perubahan profil menghasilkan perbedaan rute atau penjelasan yang masuk akal.
- [ ] Dashboard menunjukkan masalah kota berdasarkan data agregat.

## 8. Prioritas implementasi

### P0 — wajib untuk lomba

- Integrasikan kandidat rute Mapbox dengan backend AksesKota.
- Kirim profil mobilitas saat mencari rute.
- Terapkan hard constraint kursi roda dan stroller.
- Siapkan satu koridor demo dengan data ramp, tangga, lebar, dan hambatan nyata.
- Pastikan laporan terverifikasi memengaruhi rekomendasi.
- Tampilkan alasan rekomendasi dan penolakan.

### P1 — memperkuat demo

- Autocomplete tempat dan detail lokasi.
- Preferensi lansia dan low vision.
- Skor kenyamanan, keteduhan, bangku, dan pencahayaan.
- Riwayat kontribusi dan rute pengguna.
- Dashboard insight kota.

### P2 — setelah lomba

- Cakupan data banyak kota.
- Impor dan sinkronisasi OpenStreetMap/Open Data.
- Deteksi kondisi jalur berbantuan AI.
- Navigasi real-time dan offline.
- Integrasi resmi dengan pemerintah kota.

## 9. Aturan anti-dummy

- Jangan menampilkan skor aksesibilitas tanpa sumber data.
- Jangan mengklaim ramp, bangku, guiding block, atau kondisi jalur jika belum tersimpan di database.
- Tandai data sebagai `terverifikasi`, `belum terverifikasi`, atau `belum tersedia`.
- Gunakan data contoh hanya pada seed/demo yang diberi label jelas.
- Estimasi Mapbox harus dibedakan dari skor dan rekomendasi AksesKota.

## 10. Kalimat presentasi lomba

> Google Maps menjawab “bagaimana cara tercepat sampai ke tujuan?”. AksesKota menjawab “apakah saya benar-benar bisa melewati jalur itu, mengapa jalur ini aman untuk kebutuhan saya, dan apa yang sedang terjadi di sepanjang perjalanan?”.

Ukuran keberhasilan AksesKota bukan banyaknya tempat yang dapat dicari, melainkan kemampuan mencegah pengguna menerima rute yang secara fisik tidak dapat atau tidak aman mereka lalui.

## 11. Fokus wilayah lomba: Kota Bogor

MVP lomba dibatasi pada wilayah administratif **Kota Bogor**, bukan Kabupaten Bogor dan bukan seluruh Indonesia. Pembatasan ini diperlukan agar kualitas dan keterbaruan data aksesibilitas lebih penting daripada luas cakupan.

Konsekuensi produk:

- peta awal berpusat di Kota Bogor;
- eksplorasi peta dibatasi pada batas Kota Bogor;
- autocomplete hanya mengembalikan tempat di Kota Bogor;
- pencarian rute menolak titik awal atau tujuan di luar Kota Bogor;
- data survei dan laporan komunitas diprioritaskan untuk koridor terpilih di Kota Bogor;
- UI tidak perlu menampilkan label wilayah; pembatasan diterapkan langsung pada peta dan pencarian.

Target data Kota Bogor:

1. Pilih satu koridor yang menghubungkan tempat penting dan transportasi umum.
2. Survei segmen trotoar, penyeberangan, ramp, tangga, guiding block, keteduhan, dan pencahayaan.
3. Catat akses masuk/keluar halte atau stasiun yang berada di koridor.
4. Simpan foto, waktu observasi, sumber, status verifikasi, dan tanggal pembaruan.
5. Pastikan sedikitnya dua profil mobilitas menghasilkan keputusan rute yang berbeda dan dapat dijelaskan.

Perluasan ke wilayah lain hanya dilakukan setelah definition of done Kota Bogor terpenuhi.

## 12. Integrasi angkot dan pengguna disabilitas

Fitur transportasi umum AksesKota harus berbentuk perjalanan multimoda, bukan sekadar menggambar trayek di peta:

1. rute akses dari titik awal menuju titik naik;
2. perjalanan menggunakan angkot atau BisKita;
3. perpindahan kendaraan jika diperlukan;
4. rute akses dari titik turun menuju tujuan.

Setiap bagian perjalanan harus dievaluasi sesuai profil mobilitas. Perjalanan tidak boleh diberi label "aksesibel" hanya karena trayek melewati titik awal dan tujuan.

### Data transportasi yang disimpan

- operator dan jenis layanan (`ANGKOT` atau `BISKITA`);
- nomor, nama, warna, arah, dan geometri trayek;
- titik naik/turun dan urutannya;
- jam layanan atau headway jika tersedia;
- tarif dan tanggal pembaruan;
- sumber data serta status verifikasi;
- aksesibilitas kendaraan: `ACCESSIBLE`, `NOT_ACCESSIBLE`, atau `UNKNOWN`;
- aksesibilitas titik naik/turun: ramp, tinggi curb, ruang tunggu, shelter, bangku, guiding block, dan penyeberangan terdekat.

Status `UNKNOWN` berbeda dari `NOT_ACCESSIBLE`. Data kosong tidak boleh dianggap aksesibel maupun tidak aksesibel.

### Sumber data angkot

Urutan sumber yang digunakan:

1. data resmi dan konfirmasi terbaru dari Dishub Kota Bogor;
2. dokumen perencanaan resmi Kota Bogor untuk daftar koridor dan konteks layanan;
3. GTFS atau data terbuka sebagai data awal trayek dan titik berhenti;
4. survei lapangan untuk mengoreksi geometri, titik naik/turun informal, headway, dan kondisi aktual;
5. laporan komunitas yang sudah diverifikasi untuk perubahan sementara.

Feed lama atau data tanpa tanggal pembaruan boleh diimpor sebagai `NEEDS_RECHECK`, tetapi tidak boleh langsung dipakai sebagai rekomendasi aktif.

### Aturan per profil

**Kursi roda**

- akses berjalan ke titik naik harus lolos hard constraint;
- titik naik dan turun harus dapat dicapai tanpa tangga yang tidak memiliki alternatif;
- kendaraan harus terverifikasi dapat mengangkut pengguna beserta kursi rodanya;
- jika kendaraan atau proses naik-turun berstatus `UNKNOWN`, tampilkan sebagai informasi trayek, bukan rekomendasi aksesibel.

**Low vision**

- prioritaskan titik naik yang memiliki landmark jelas, guiding block, pencahayaan, atau bantuan petugas;
- instruksi harus menyebut nama trayek, arah, landmark naik, dan landmark turun;
- sediakan urutan instruksi yang dapat dibaca screen reader.

**Lansia**

- minimalkan jarak berjalan dan jumlah perpindahan;
- prioritaskan shelter, bangku, waktu tunggu lebih pendek, dan akses naik yang tidak terlalu tinggi;
- hindari penyeberangan berisiko dan jarak perpindahan yang panjang.

**Stroller dan pengguna umum**

- prioritaskan jalur rata, ruang kendaraan yang cukup, shelter, dan perpindahan yang sederhana.

### Logika rekomendasi multimoda

Urutan proses backend:

1. cari titik naik yang dapat dicapai dari lokasi awal;
2. cari titik turun yang dapat mencapai tujuan;
3. hubungkan keduanya melalui trayek dan kemungkinan transfer;
4. hitung rute jalan kaki untuk setiap sisi perjalanan;
5. cocokkan bagian berjalan kaki dengan `road_segments` AksesKota;
6. terapkan hard constraint profil pada bagian berjalan kaki, titik naik/turun, dan kendaraan;
7. buang perjalanan yang terbukti tidak dapat digunakan;
8. tandai perjalanan yang datanya belum lengkap sebagai `DATA_TIDAK_LENGKAP`;
9. urutkan perjalanan yang lolos berdasarkan aksesibilitas, jumlah transfer, waktu tunggu, jarak berjalan, dan kenyamanan;
10. tampilkan alasan rekomendasi serta sumber dan umur data.

Mapbox tetap dipakai untuk peta dasar, pencarian tempat, dan bagian berjalan kaki. Rute angkot tidak boleh diharapkan dari Mapbox Directions karena profil transit tidak tersedia; graf transit harus dibangun dari data trayek AksesKota/GTFS.

### Bentuk hasil di antarmuka

Contoh hasil pencarian:

> Jalan 180 m melalui jalur terverifikasi → naik BisKita Koridor 3 di Halte A → turun di Halte B → jalan 120 m menuju tujuan.

Setiap hasil harus menampilkan:

- total waktu dan jarak berjalan;
- perkiraan waktu tunggu dan jumlah perpindahan;
- trayek serta arah kendaraan;
- status akses setiap bagian perjalanan;
- alasan rute cocok atau tidak cocok untuk profil pengguna;
- label `terverifikasi`, `perlu diperiksa ulang`, atau `data belum tersedia`.

### Batas implementasi lomba

Jangan langsung memasukkan seluruh 30 trayek. Mulai dengan satu koridor yang memiliki nilai demo kuat, misalnya koridor yang menghubungkan Stasiun Bogor dengan tempat publik penting. Untuk koridor tersebut:

- digitalkan geometri dan titik naik/turun;
- survei minimal dua arah perjalanan;
- verifikasi kendaraan dan proses naik-turun bersama pengguna disabilitas;
- survei jalur pejalan kaki dalam radius sekitar titik naik/turun;
- siapkan sedikitnya satu contoh rute yang lolos dan satu yang ditolak dengan alasan nyata.

### Definition of done transit aksesibel

- [ ] Data trayek memiliki sumber dan tanggal pembaruan.
- [ ] Titik naik/turun memiliki status aksesibilitas tiga keadaan, bukan boolean default.
- [ ] Kendaraan memiliki status aksesibilitas yang terpisah dari halte.
- [ ] Frontend mengirim profil mobilitas pada pencarian multimoda.
- [ ] Backend mengevaluasi seluruh bagian perjalanan.
- [ ] Data `UNKNOWN` tidak menghasilkan klaim aksesibel.
- [ ] Rute menampilkan bagian jalan kaki, kendaraan, dan transfer secara terpisah.
- [ ] Pengguna memahami alasan rute direkomendasikan, ditolak, atau belum dapat dipastikan.
- [ ] Sedikitnya satu perjalanan telah diuji bersama pengguna dari profil sasaran.

## 13. Alur laporan warga dan moderasi

Laporan hambatan harus mempunyai titik koordinat, jenis hambatan, deskripsi, foto, pelapor, waktu, dan status verifikasi. Setelah dikirim:

1. marker langsung dapat muncul di peta dengan status `UNVERIFIED`;
2. laporan belum boleh memengaruhi rekomendasi rute;
3. moderator/admin memeriksa foto, lokasi, deskripsi, dan kemungkinan duplikat;
4. laporan yang disetujui berubah menjadi `VERIFIED` dan hambatannya mulai memengaruhi routing;
5. laporan yang ditolak dihilangkan dari layer publik;
6. laporan yang belum cukup jelas berubah menjadi `NEEDS_RECHECK` dan tetap tidak memengaruhi routing.

Warna marker harus membedakan status dan popup harus menjelaskan apakah laporan telah diverifikasi. Pengguna biasa tidak membutuhkan dashboard admin. Mereka membutuhkan formulir laporan, marker peta, serta riwayat dan status laporan sendiri. Dashboard moderasi hanya diberikan kepada peran `MODERATOR` dan `ADMIN`.

Survei ramp tetap menjadi proses lapangan terpisah. Selama survei belum dilakukan, data ramp harus tetap `unknown` dan tidak boleh disimpulkan dari laporan hambatan lain.

Pelaporan boleh dilakukan tanpa login. Untuk laporan guest, `userId` disimpan sebagai `null` dan server membuat kunci akses acak agar riwayat guest dapat dibaca kembali dari perangkat pengirim tanpa menciptakan akun atau identitas palsu. Database tetap menjadi sumber utama status laporan; perangkat hanya menyimpan kunci akses tersebut.

Foto harus berhasil diunggah ke Cloudinary sebelum record laporan dibuat. Database menyimpan URL HTTPS Cloudinary, bukan gambar contoh atau path lokal. Formulir harus menampilkan preview foto, judul laporan, petunjuk penulisan judul, dan petunjuk deskripsi dampak aksesibilitas sebelum dikirim.

## 14. Verifikasi komunitas, skor rute, dan cerita tempat

### Konsensus laporan

Laporan warga tidak langsung mengubah rekomendasi. Satu laporan menjadi `VERIFIED` setelah memperoleh sedikitnya **3 suara `VERIFIED` dari 3 akun berbeda**. Aturannya:

- satu akun hanya mempunyai satu suara per laporan dan boleh memperbarui pilihannya;
- pelapor yang memakai akun tidak boleh memverifikasi laporannya sendiri;
- 3 suara `NEEDS_RECHECK` atau `REJECTED` memindahkan laporan ke `NEEDS_RECHECK`, bukan langsung menghapusnya;
- moderator/admin tetap dapat mengambil keputusan manual untuk penyalahgunaan, kondisi darurat, atau bukti yang perlu pemeriksaan khusus;
- hanya laporan `VERIFIED` yang mengaktifkan hambatan dan dipakai pada evaluasi rute berikutnya.

Nilai dasar sebuah segmen jalan tidak ditimpa secara permanen oleh satu laporan hambatan sementara. Hambatan terverifikasi menjadi lapisan kondisi aktual yang menambah penalti atau menggugurkan kandidat rute. Nilai dasar segmen baru diperbarui dari survei kondisi permanen atau hasil agregasi berkala yang dapat diaudit.

### Kartu rute A, B, dan C

Setiap kandidat Mapbox dievaluasi ulang oleh backend AksesKota. Kartu rute boleh menampilkan:

- skor aksesibilitas;
- skor kenyamanan;
- tingkat keteduhan;
- persentase cakupan data AksesKota;
- jumlah hambatan terverifikasi;
- alasan rute ditolak atau direkomendasikan;
- label pembanding seperti `Paling Aksesibel`, `Paling Teduh`, dan `Paling Nyaman`.

Label hanya muncul dari perbandingan data aktual antar kandidat. Jika cakupan segmen yang cocok kurang dari 40%, skor ditampilkan sebagai **data belum cukup**, bukan angka perkiraan atau dummy. Hambatan keras seperti tangga atau jalur tertutup dapat menggugurkan rute untuk profil yang terdampak meskipun data kenyamanan belum lengkap.

### Tempat ramah disabilitas berbasis pengalaman warga

Hasil pencarian tempat dari Mapbox hanya menyediakan identitas, alamat, dan koordinat. AksesKota menambahkan lapisan komunitas berupa artikel singkat, foto, bintang tempat, serta bintang ramah disabilitas. Kontributor wajib login agar setiap penilaian memiliki penulis yang jelas.

Rating tempat tidak boleh otomatis menjadi skor jalan menuju tempat tersebut. Rating menjelaskan pengalaman di lokasi, sedangkan skor rute tetap dihitung dari segmen jalan dan hambatan terverifikasi. Dengan pemisahan ini, tempat yang mempunyai ramp tidak otomatis dianggap mudah dicapai jika jalur menuju pintunya masih tidak aksesibel.

## 15. Asisten akses, quick filter, riwayat, dan navigasi suara

- Asisten pencarian hanya merekomendasikan tempat yang sudah memiliki pengalaman komunitas di database AksesKota. Asisten tidak boleh mengarang fasilitas dari data Mapbox.
- Quick filter mencakup ramp, lift, toilet difabel, parkir difabel, guiding block, dan bebas tangga. Sebuah fasilitas hanya dapat dipakai sebagai filter setelah dicatat oleh kontributor pada artikel tempat.
- Setiap hasil asisten harus menampilkan rating aksesibilitas, fasilitas yang dilaporkan, dan jumlah bukti komunitas. Hasil kosong harus dijelaskan sebagai data belum tersedia.
- Riwayat perjalanan disimpan saat pengguna menekan mulai navigasi, bukan saat sekadar melihat kandidat. Detail menyimpan tujuan, mode, waktu, jarak, skor yang tersedia, dan langkah perjalanan.
- Navigasi suara membaca petunjuk Mapbox dalam Bahasa Indonesia, menyediakan ulangi, bisukan, langkah sebelumnya/berikutnya, serta instruksi teks sebagai fallback.
- Riwayat akun dan navigasi suara tidak mengubah penilaian aksesibilitas rute; keduanya membantu penggunaan dan audit pengalaman perjalanan.
