import Link from "next/link";
import AuthFlow from "../components/AuthFlow";

export const metadata = {
  title: "Masuk — AksesKota",
  description: "Masuk atau buat akun AksesKota untuk menyimpan rute dan laporan.",
};

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-[#203e5e] text-[#101828]">
      <Link href="/" aria-label="Kembali ke beranda" className="fixed left-5 top-5 z-50 flex items-center gap-2 rounded-full bg-white/90 px-4 py-2.5 text-[12px] font-extrabold text-[#0c6478] shadow-lg backdrop-blur md:left-8 md:top-8">
        <span aria-hidden="true">←</span> AksesKota
      </Link>
      <AuthFlow />
    </main>
  );
}
