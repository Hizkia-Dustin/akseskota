import Link from "next/link";
import RouteOnboarding from "../components/RouteOnboarding";

export const metadata = {
  title: "Mulai Perjalanan — AksesKota",
  description: "Pilih kebutuhan mobilitas dan cari rute pejalan kaki yang lebih sesuai untukmu.",
};

export default async function StartPage({ searchParams }) {
  const requestedProfile = (await searchParams).profile;
  const initialProfile = ["wheelchair", "elderly", "stroller", "walking"].includes(requestedProfile)
    ? requestedProfile
    : "wheelchair";
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f0fdfa] text-[#101828]">
      <div aria-hidden="true" className="absolute -left-32 -top-40 size-[420px] rounded-full bg-[#cbfbf1]/80 blur-3xl" />
      <div aria-hidden="true" className="absolute -right-32 top-24 size-[390px] rounded-full bg-[#dbeafe]/65 blur-3xl" />

      <header className="relative z-10 mx-auto flex h-24 w-[calc(100%-40px)] max-w-[1180px] items-center justify-between">
        <Link href="/" aria-label="Kembali ke beranda AksesKota" className="flex items-center gap-2.5 font-extrabold text-[#101828]">
          <span className="grid size-9 place-items-center rounded-full bg-[#0c6478] text-[16px] shadow-[0_5px_15px_rgba(12,100,120,.18)]">🗺️</span>
          <span className="text-[19px] tracking-[-.04em]">AksesKota</span>
        </Link>
        <Link href="/" className="rounded-full border border-[#cddfe2] bg-white/80 px-4 py-2.5 text-[12px] font-bold text-[#0c6478] shadow-sm backdrop-blur">
          ← Kembali
        </Link>
      </header>

      <section className="relative z-10 mx-auto grid w-[calc(100%-40px)] max-w-[1180px] items-start gap-10 pb-16 pt-5 lg:grid-cols-[.8fr_1.2fr] lg:gap-16 lg:pb-24 lg:pt-12">
        <div className="pt-4 lg:sticky lg:top-12">
          <span className="inline-flex items-center gap-2 rounded-full bg-[#cbfbf1] px-3 py-1.5 text-[11px] font-extrabold text-[#005f5a]">
            <span className="size-1.5 rounded-full bg-[#46dfb1]" /> Mulai Perjalanan
          </span>
          <h1 className="mt-6 max-w-[500px] text-[42px] leading-[1.08] font-extrabold tracking-[-.045em] md:text-[52px]">
            Rute yang menyesuaikan <span className="text-[#0c6478]">kebutuhanmu.</span>
          </h1>
          <p className="mt-5 max-w-[470px] text-[15px] leading-7 text-[#6a7282]">
            Beri tahu kami kebutuhan mobilitas serta tujuan perjalananmu. AksesKota akan membandingkan aksesibilitas, kenyamanan, dan kondisi jalur.
          </p>

          <div className="mt-8 grid max-w-[470px] grid-cols-3 gap-3">
            {[["01", "Pilih profil"], ["02", "Isi tujuan"], ["03", "Cari rute"]].map(([number, label]) => (
              <div key={number} className="rounded-2xl border border-[#d9eeee] bg-white/70 p-3 backdrop-blur">
                <strong className="block text-[15px] text-[#0c6478]">{number}</strong>
                <span className="mt-1 block text-[10px] font-semibold text-[#7c8797]">{label}</span>
              </div>
            ))}
          </div>
        </div>

        <RouteOnboarding initialProfile={initialProfile} />
      </section>
    </main>
  );
}
