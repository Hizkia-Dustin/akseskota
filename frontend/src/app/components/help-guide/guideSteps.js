export const helpGuideSteps = [
  {
    id: "welcome",
    eyebrow: "SELAMAT DATANG",
    title: "Kenali AksesKota dalam 2 menit",
    description:
      "Panduan singkat ini memperagakan cara mencari rute, memahami fitur peta, dan mengirim laporan kondisi jalan.",
    hint: "Kamu tetap dapat membuka panduan ini melalui tombol tanda tanya.",
    target: null,
    panel: null,
    demo: "overview",
  },
  {
    id: "search",
    eyebrow: "MENCARI RUTE · 01",
    title: "Masukkan awal dan tujuan",
    description:
      "Titik awal dapat memakai GPS atau nama tempat. Ketik tujuan, pilih hasil yang sesuai, lalu tekan Cari rute.",
    hint: "Contoh: Lokasi saya → Kebun Raya Bogor",
    target: "search",
    panel: null,
    demo: "search",
  },
  {
    id: "mode",
    eyebrow: "PREFERENSI · 02",
    title: "Pilih kebutuhan mobilitas",
    description:
      "Profil mengubah bobot penilaian. Kursi Roda mengutamakan ramp, Lansia mengutamakan tempat duduk, dan Low Vision mengutamakan guiding block.",
    hint: "Profil dapat diganti kapan saja tanpa menghapus tujuan.",
    target: "mode",
    panel: null,
    demo: "mode",
  },
  {
    id: "shade",
    eyebrow: "KENYAMANAN · 03",
    title: "Cari jalur yang lebih teduh",
    description:
      "Rute teduh membandingkan ruas berdasarkan observasi naungan pohon. Jika data belum cukup, AksesKota tidak membuat nilai palsu.",
    hint: "Aktifkan sebelum menekan Cari rute.",
    target: "shade",
    panel: null,
    demo: "shade",
  },
  {
    id: "heat",
    eyebrow: "LAPISAN PETA · 04",
    title: "Lihat estimasi paparan panas",
    description:
      "Lapisan panas membantu membandingkan area pada jam yang berbeda berdasarkan cuaca, ruang hijau, dan observasi ruas.",
    hint: "Ini estimasi pendukung, bukan sensor suhu permukaan realtime.",
    target: "heat",
    panel: null,
    demo: "heat",
  },
  {
    id: "directory",
    eyebrow: "TEMPAT · 05",
    title: "Jelajahi Direktori Bogor",
    description:
      "Direktori berisi tempat, foto, ulasan, rating, serta bukti fasilitas seperti ramp, toilet, tempat duduk, dan parkir aksesibel.",
    hint: "Pilih tempat untuk menjadikannya tujuan perjalanan.",
    target: "directory",
    panel: null,
    demo: "directory",
  },
  {
    id: "assistant",
    eyebrow: "PENCARIAN BANTUAN · 06",
    title: "Tanyakan pada Asisten Akses",
    description:
      "Tulis kebutuhan dengan bahasa sehari-hari. Asisten menyaring tempat dari data AksesKota, bukan mengarang fasilitas.",
    hint: "Contoh: cari kafe tanpa tangga dekat IPB.",
    target: "assistant",
    panel: null,
    demo: "assistant",
  },
  {
    id: "report",
    eyebrow: "LAPORAN · 07",
    title: "Bantu perbarui kondisi jalan",
    description:
      "Menu Laporan dipakai untuk mengirim hambatan baru dan melihat riwayat kontribusimu.",
    hint: "Laporan warga akan melalui proses verifikasi.",
    target: "report",
    panel: null,
    demo: "report",
  },
  {
    id: "report-location",
    eyebrow: "MEMBUAT LAPORAN · 08",
    title: "Tentukan lokasi dan jenis hambatan",
    description:
      "Gunakan GPS atau klik titik pada peta. Setelah itu pilih jenis hambatan, tulis judul, dan jelaskan dampaknya bagi pengguna.",
    hint: "Lokasi yang akurat membantu laporan lain memverifikasi kondisi yang sama.",
    target: "report-location",
    panel: "report",
    demo: "report-steps",
  },
  {
    id: "report-photo",
    eyebrow: "BUKTI LAPORAN · 09",
    title: "Ambil foto langsung dari kamera",
    description:
      "Tekan Ambil foto untuk membuka kamera belakang di ponsel. Kamu juga dapat memilih foto yang sudah ada dari galeri.",
    hint: "Foto wajib dan sebaiknya menunjukkan hambatan serta konteks jalannya.",
    target: "report-photo",
    panel: "report",
    demo: "camera",
  },
];
