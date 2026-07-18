import AccessibilityIllustration from "./components/AccessibilityIllustration";
import AllUsersIcon from "./components/AllUsersIcon";
import ComfortIllustration from "./components/ComfortIllustration";
import CtaSection from "./components/CtaSection";
import ElderlyIcon from "./components/ElderlyIcon";
import FooterSection from "./components/FooterSection";
import HeroIllustration from "./components/HeroIllustration";
import ImpactSection from "./components/ImpactSection";
import LiveIllustration from "./components/LiveIllustration";
import ProcessParallax from "./components/ProcessParallax";
import RouteMapIllustration from "./components/RouteMapIllustration";
import RouteComparisonSection from "./components/RouteComparisonSection";
import StrollerIcon from "./components/StrollerIcon";
import WheelchairIcon from "./components/WheelchairIcon";
import ScrollStack, { ScrollStackItem } from "./components/react-bits/ScrollStack";
import AnimatedContent from './components/react-bits/AnimatedContent';
import ScrollFloat from "./components/react-bits/ScrollFloat";
import CountUp from "./components/react-bits/CountUp";
import NewsletterForm from "./components/NewsletterForm";
import CtaMotion from "./components/CtaMotion";
import HeroEntrance from "./components/HeroEntrance";
import Link from "next/link";

const issues = [
  { icon: <WheelchairIcon />, title: "Kursi Roda", text: "Menemukan tangga di tengah perjalanan tanpa peringatan", tone: "border-[#96f7e4] bg-[#f0fdfa]" },
  { icon: <ElderlyIcon />, title: "Lansia", text: "Berjalan jauh tanpa satu pun tempat duduk tersedia", tone: "border-[#bedbff] bg-[#eff6ff]" },
  { icon: <StrollerIcon />, title: "Stroller", text: "Trotoar terlalu sempit atau rusak, tidak bisa dilewati", tone: "border-[#fee685] bg-[#fffbeb]" },
  { icon: <AllUsersIcon />, title: "Semua Pengguna", text: "Tidak ada info jalur teduh saat terik matahari", tone: "border-[#ffc9c9] bg-[#fef2f2]" },
];

const steps = [
  { n: "01", title: "Pilih Profil", text: "Tentukan kebutuhanmu — kursi roda, lansia, stroller, atau pejalan kaki umum." },
  { n: "02", title: "Masukkan Tujuan", text: "Sistem menghasilkan 3+ alternatif rute yang lolos hard constraint aksesibilitas." },
  { n: "03", title: "Pilih & Berangkat", text: "Bandingkan rute berdasarkan skor riil dengan alasan yang jelas dan mudah dipahami." },
];

const layers = [
  { illustration: <AccessibilityIllustration />, title: "Accessibility Layer", sub: "Apakah rute bisa dilewati?", items: ["Ramp & tangga", "Guiding block", "Lebar trotoar", "Lift & zebra cross", "Hambatan permanen"], cls: "bg-[#0c6478] text-white" },
  { illustration: <ComfortIllustration />, title: "Comfort Layer", sub: "Seberapa nyaman rute itu?", items: ["Keteduhan & pohon", "Koridor beratap", "Tempat duduk", "Shelter & halte", "Penerangan malam"], cls: "bg-[#bb5b00] text-white" },
  { illustration: <LiveIllustration />, title: "Live Condition Layer", sub: "Kondisi jalur saat ini", items: ["Genangan & banjir", "Proyek jalan", "Kendaraan parkir", "Ramp & lift rusak", "Pohon tumbang"], cls: "bg-[#a82025] text-white" },
];

const routes = [
  { letter: "A", title: "Rute A", badge: "Paling Aksesibel", meta: "1.1 km · 16 mnt", score: "88", color: "bg-[#0c6478]", badgeCls: "bg-[#cbfbf1] text-[#005f5a]" },
  { letter: "B", title: "Rute B", badge: "Paling Teduh", meta: "1.4 km · 20 mnt", score: "74", color: "bg-[#f59e0b]", badgeCls: "bg-[#fef3c6] text-[#bb4d00]" },
  { letter: "C", title: "Rute C", badge: "Paling Pendek", meta: "0.8 km · 12 mnt", score: "61", color: "bg-[#3b82f6]", badgeCls: "bg-[#dbeafe] text-[#1447e6]" },
];

function Logo({ light = false }) {
  return <a href="#top" className={`flex items-center gap-2.5 font-extrabold ${light ? "text-white" : "text-[#101828]"}`}><span className={`grid size-6 place-items-center rounded-full ${light ? "bg-white/15" : "bg-[#0c6478]"}`}><span className="text-[11px]">🗺️</span></span><span className="text-[17px] tracking-[-.04em]">AksesKota</span></a>;
}

function Wave({ dark = false, flip = false }) {
  return <div aria-hidden="true" className={`wave ${dark ? "wave-dark" : ""} ${flip ? "wave-flip" : ""}`} />;
}

export default function Home() {
  return (
    <main id="top" className="overflow-hidden bg-white text-[#101828]">
      <div className="hidden h-[60px] lg:block" />
      <HeroEntrance>
      <header className="hero-nav mx-auto flex h-[60px] w-[calc(100%-32px)] max-w-[1080px] items-center justify-between rounded-full bg-[#e7f1f3] px-6 md:px-8">
        <Logo />
        <nav className="hidden items-center gap-8 text-[12px] font-semibold text-[#6a7282] md:flex">
          <a href="#cara-kerja">Cara Kerja</a><a href="#fitur">Fitur</a><a href="#dampak">Dampak</a>
        </nav>
        <Link href="/masuk" className="rounded-full bg-[#0c6478] px-5 py-3 text-[12px] font-bold text-white shadow-[0_3px_8px_rgba(12,100,120,.25)]">Coba Sekarang</Link>
      </header>

      <section className="mx-auto grid min-h-130.75 max-w-[1080px] items-center gap-8 px-[30px] py-12 lg:grid-cols-2 lg:py-0">
        <div className="max-w-[495px]">
          <span className="hero-badge inline-block rounded-full bg-[#cbfbf1] px-2.5 py-1 text-[11px] font-bold text-[#005f5a]">🗺️ Navigasi Inklusif</span>
          <h1 className="hero-title mt-7 text-[42px] leading-[1.1] font-extrabold tracking-[-.04em] md:text-[45px]">Temukan rute yang <span className="text-[#0c6478]">benar-benar</span> bisa kamu lewati</h1>
          <p className="hero-copy mt-6 max-w-[420px] text-[16px] leading-[1.65] text-[#6a7282]">Navigasi pejalan kaki yang menyesuaikan kebutuhan mobilitas kamu — aksesibilitas, kenyamanan, dan kondisi jalur aktual saat ini.</p>
          <div className="hero-actions mt-7 flex flex-wrap gap-3">
            <Link href="/masuk" className="rounded-full bg-[#0c6478] px-8 py-4 text-[14px] font-bold text-white shadow-[0_8px_14px_rgba(12,100,120,.3)]">Cari Rute Sekarang →</Link>
            <a href="#fitur" className="rounded-full border-2 border-[#e5e7eb] px-8 py-4 text-[14px] font-bold text-[#4a5565]">Pelajari Lebih Lanjut</a>
          </div>
          <div className="hero-stats mt-8 flex gap-8">
            {[[12400,"Rute dihasilkan"],[3800,"Laporan terverifikasi"],[920,"Kontributor"]].map(([value,label]) => <div key={label}><strong className="block text-[22px] font-extrabold"><CountUp to={value} suffix="+" /></strong><span className="text-[10px] font-semibold text-[#99a1af]">{label}</span></div>)}
          </div>
        </div>
        <div role="img" aria-label="Ilustrasi navigasi AksesKota" className="hero-illustration flex justify-center lg:justify-end"><div className="aspect-[515/462] w-full max-w-[516px]"><HeroIllustration /></div></div>
      </section>
      </HeroEntrance>

      <section id="fitur" className="mx-auto max-w-[1080px] px-0 pb-[75px] pt-[95px] text-center lg:pt-[135px]">
        <div className="min-h-[134px] px-[30px]">
          <span className="rounded-full bg-[#ffe2e2] px-[9px] py-[4px] text-[11px] font-bold text-[#e7000b]">Masalah nyata di jalan</span>
          <h2 className="mt-[17px] text-[34px] leading-[38px] font-extrabold tracking-[-.04em]">Navigasi biasa belum cukup</h2>
          <p className="mx-auto mt-[11px] max-w-[480px] text-[15px] leading-[22px] text-[#99a1af]">Kebanyakan aplikasi mengoptimalkan waktu dan jarak — bukan kebutuhan pengguna.</p>
        </div>
        <div className="mt-[45px] grid gap-[15px] px-[30px] text-left sm:grid-cols-2 lg:grid-cols-4 lg:px-0">
          {issues.map((x, index) => (
            <AnimatedContent
              key={x.title}
              className="h-full"
              distance={45}
              duration={0.65}
              ease="power3.out"
              initialOpacity={0}
              scale={0.96}
              threshold={0.2}
              delay={index * 0.1}
            >
              <div className={`h-[168px] rounded-[18px] border-2 p-[19px] ${x.tone}`}>
                <div aria-hidden="true" className="h-[45px] w-[45px]">{x.icon}</div>
                <h3 className="text-[13px] leading-[34px] font-extrabold text-[#101828]">{x.title}</h3>
                <p className="text-[11px] leading-[18px] text-[#6a7282]">{x.text}</p>
              </div>
            </AnimatedContent>
          ))}
        </div>
      </section>

      <section id="cara-kerja" className="overflow-hidden bg-[#f0fdf9]">
        <div className="hidden min-[1200px]:block">
          <ProcessParallax />
        </div>
        <div className="relative bg-[#213a58] px-6 py-20 text-white min-[1200px]:hidden">
          <div className="mx-auto grid max-w-[720px] gap-5 md:grid-cols-3">
            {steps.map((x) => <div key={x.n} className="rounded-[15px] bg-white p-5 text-[#101828] shadow-xl"><span className="text-[28px] font-extrabold text-[#46dfb1]">{x.n}</span><h3 className="text-[15px] font-extrabold">{x.title}</h3><p className="mt-1 text-[11px] leading-[18px] text-[#99a1af]">{x.text}</p></div>)}
          </div>
        </div>
      </section>

      <section className="bg-[#f0fdf9] pt-[75px]">
        <div className="mx-auto max-w-[1080px] px-[30px] text-center">
          <span className="rounded-full bg-[#cbfbf1] px-3 py-1 text-[11px] font-bold text-[#005f5a]">Tiga Layer Evaluasi</span>
          <ScrollFloat
            containerClassName="mt-5"
            textClassName="text-[34px] leading-[1.2] font-extrabold tracking-[-.04em]"
            animationDuration={1}
            ease="back.inOut(2)"
            scrollStart="center bottom+=35%"
            scrollEnd="bottom bottom-=25%"
            stagger={0.025}
          >
            Setiap rute dinilai dari tiga dimensi
          </ScrollFloat>
          <div className="mt-12 grid gap-5 pb-[75px] text-left md:hidden">
            {layers.map((x) => <article key={x.title} className={`overflow-hidden rounded-[18px] shadow-[0_15px_25px_rgba(12,100,120,.18)] ${x.cls}`}><div className="flex h-[195px] items-center justify-center bg-white/5"><div aria-hidden="true" className="h-[151px] w-[244px]">{x.illustration}</div></div><div className="px-7 pb-7 pt-4"><h3 className="text-[18px] font-extrabold">{x.title}</h3><p className="mt-1 text-[12px] opacity-80">{x.sub}</p><ul className="mt-4 space-y-2 text-[11px] opacity-90">{x.items.map(i => <li key={i}>• &nbsp;{i}</li>)}</ul></div></article>)}
          </div>
        </div>
        <ScrollStack useWindowScroll className="mx-auto hidden max-w-[650px] md:block" itemDistance={110} itemScale={0} itemStackDistance={0} stackPosition="16%" scaleEndPosition="7%" baseScale={1} blurAmount={0}>
          {layers.map((x) => (
            <ScrollStackItem key={x.title} itemClassName={`mx-auto h-[420px]! max-w-[340px] overflow-hidden rounded-[18px]! border border-white/15 p-0! text-white shadow-[0_15px_25px_rgba(12,100,120,.18)]! ${x.cls}`}>
              <div className="flex h-[195px] items-center justify-center bg-white/5">
                <div aria-hidden="true" className="h-[151px] w-[244px]">{x.illustration}</div>
              </div>
              <div className="px-7 pb-7 pt-4 text-left">
                <h3 className="text-[18px] font-extrabold">{x.title}</h3>
                <p className="mt-1 text-[12px] opacity-80">{x.sub}</p>
                <ul className="mt-4 space-y-2 text-[11px] opacity-90">
                  {x.items.map((item) => <li key={item}>• &nbsp;{item}</li>)}
                </ul>
              </div>
            </ScrollStackItem>
          ))}
        </ScrollStack>
      </section>
      <Wave flip />

      <section id="perbandingan-rute" className="hidden h-[607px] min-[1200px]:block"><AnimatedContent className="h-full" distance={35} duration={0.8} scale={0.985} threshold={0.18}><RouteComparisonSection /></AnimatedContent></section>
      <section className="mx-auto grid max-w-[1080px] items-center gap-12 px-[30px] py-[75px] min-[1200px]:hidden lg:grid-cols-2">
        <div>
          <span className="rounded-full bg-[#cbfbf1] px-3 py-1 text-[11px] font-bold text-[#005f5a]">Perbandingan Rute</span>
          <h2 className="mt-5 text-[34px] leading-[1.12] font-extrabold tracking-[-.04em]">Tiga rute, satu pilihan<br/><span className="text-[#0c6478]">terbaik untukmu</span></h2>
          <p className="mt-5 max-w-[500px] text-[14px] leading-[1.65] text-[#99a1af]">Sistem menghasilkan beberapa alternatif rute dan menjelaskan alasan setiap rekomendasi — bukan sekadar menampilkan skor.</p>
          <div className="mt-7 space-y-3">{routes.map(r => <div key={r.letter} className="flex items-center rounded-[14px] bg-[#f8fafc] p-3.5"><span className={`grid size-9 place-items-center rounded-full text-sm font-extrabold text-white ${r.color}`}>{r.letter}</span><div className="ml-4"><div className="flex flex-wrap items-center gap-2"><b className="text-[13px]">{r.title}</b><span className={`rounded-full px-2 py-1 text-[9px] font-bold ${r.badgeCls}`}>{r.badge}</span></div><small className="text-[10px] text-[#99a1af]">{r.meta}</small></div><div className="ml-auto text-right"><strong className="text-[18px] text-[#0c6478]">{r.score}</strong><small className="block text-[8px] text-[#99a1af]">aksesibel</small></div></div>)}</div>
        </div>
        <div role="img" aria-label="Peta perbandingan rute dari Simpang Lima ke Balai Kota" className="aspect-[517/300] w-full overflow-hidden rounded-[20px] shadow-[0_15px_30px_rgba(12,100,120,.12)]"><RouteMapIllustration /></div>
      </section>

      <Wave />
      <section id="dampak" className="hidden h-[554px] min-[1200px]:block"><AnimatedContent className="h-full" distance={35} duration={0.8} scale={0.985} threshold={0.18}><ImpactSection /></AnimatedContent></section>
      <section className="bg-[#f0fdf9] py-[75px] min-[1200px]:hidden">
        <div className="mx-auto grid max-w-[1080px] gap-12 px-[30px] lg:grid-cols-2">
          <div><span className="rounded-full bg-[#dbeafe] px-3 py-1 text-[11px] font-bold text-[#155dfc]">SDG 11 — Kota Inklusif</span><h2 className="mt-5 max-w-[480px] text-[34px] leading-[1.15] font-extrabold tracking-[-.04em]">Data bersama untuk kota yang lebih baik</h2><p className="mt-5 max-w-[500px] text-[14px] leading-[1.65] text-[#99a1af]">Setiap laporan warga membantu sistem dan pemerintah memahami kondisi jalur aktual prioritas perbaikan jadi lebih tepat sasaran.</p><div className="mt-8 grid grid-cols-2 gap-4"><div className="metric"><b><CountUp to={73} suffix="%" /></b><span>Pengguna temukan rute lebih baik</span></div><div className="metric bg-[#eff6ff]!"><b className="text-[#155dfc]!"><CountUp to={2.1} decimals={1} suffix="×" /></b><span>Peningkatan data kondisi jalur</span></div><div className="metric bg-[#fffbeb]!"><b className="text-[#bb4d00]!"><CountUp to={4} suffix=" kota" /></b><span>Sedang diujicobakan</span></div></div></div>
          <div className="space-y-4 pt-3">{[["♿","Inclusive by Default","Sistem menyesuaikan diri terhadap pengguna, bukan sebaliknya."],["♡","Transparent Recommendation","Setiap rekomendasi rute disertai alasan konkret yang bisa dipahami."],["⌂","Community Driven","Kondisi kota diperbarui oleh warga, diverifikasi moderator, langsung berdampak."]].map(([i,t,d]) => <div key={t} className="flex items-center rounded-[16px] bg-white p-5 shadow-sm"><span className="grid size-11 shrink-0 place-items-center rounded-[12px] bg-[#f0fdfa] text-[#0c6478]">{i}</span><div className="ml-4"><h3 className="text-[15px] font-extrabold">{t}</h3><p className="mt-1 text-[12px] text-[#99a1af]">{d}</p></div></div>)}</div>
        </div>
      </section>

      <section id="mulai" className="hidden h-[643px] overflow-hidden bg-[#0c6478] min-[1200px]:block"><CtaMotion><CtaSection /></CtaMotion></section>

      <div className="min-[1200px]:hidden"><Wave dark /></div>
      <section className="cta relative bg-[#0c7181] px-6 pb-[165px] pt-14 text-center text-white min-[1200px]:hidden">
        <div className="text-4xl">🗺️</div><h2 className="mt-5 text-[34px] font-extrabold tracking-[-.04em]">Siap berjalan lebih cerdas?</h2><p className="mx-auto mt-3 max-w-[420px] text-[14px] leading-relaxed text-white/65">Bergabung bersama ribuan pengguna yang menemukan rute lebih baik setiap hari.</p><Link href="/masuk" className="relative z-10 mt-8 inline-block min-w-[270px] rounded-full bg-white px-10 py-4 text-[14px] font-bold text-[#0c6478] shadow-lg transition hover:scale-[1.02] active:scale-[0.98]">Mulai Sekarang</Link><div className="pointer-events-none cityline" />
      </section>

      <footer className="hidden h-[515px] overflow-hidden bg-[#0c6478] min-[1200px]:block"><FooterSection /></footer>

      <footer className="bg-[#0c7181] px-6 pb-12 text-white min-[1200px]:hidden">
        <div className="mx-auto grid max-w-[1230px] gap-10 border-t border-white/15 pt-16 md:grid-cols-[1.4fr_.6fr_.7fr_1.25fr]">
          <div><Logo light /><p className="mt-5 max-w-[385px] text-[12px] leading-[1.55] text-white/70">AksesKota membantu pejalan kaki menemukan rute yang lebih aman, nyaman, dan ramah bagi semua melalui informasi aksesibilitas dan kondisi jalur secara aktual.</p></div>
          <div><h3 className="font-bold">Akses</h3><div className="mt-6 space-y-2 text-[12px] text-white/70"><a className="block" href="#cara-kerja">› Cara Kerja</a><a className="block" href="#fitur">› Fitur</a><a className="block" href="#dampak">› Dampak</a></div></div>
          <div><h3 className="font-bold">Support</h3><p className="mt-6 text-[12px] text-white/70">link.supportkaloada</p></div>
          <div><h3 className="text-[20px] font-bold">Subscribe to our newsletter</h3><p className="mt-4 text-[12px] leading-relaxed text-white/70">Dapatkan informasi terbaru seputar aksesibilitas, pembaruan fitur, serta tips mobilitas untuk menciptakan perjalanan yang lebih aman.</p><NewsletterForm compact /></div>
        </div>
        <div className="mx-auto mt-16 flex max-w-[1230px] flex-col gap-5 border-t border-white/10 pt-7 text-[10px] tracking-[.2em] text-white/60 sm:flex-row sm:items-center sm:justify-between"><span>🧡 © 2026 AKSESKOTA | PRIVACY POLICY | TERMS OF SERVICE</span><span className="text-sm tracking-[.5em] text-white">f  ♥  ◎  in  ▶</span></div>
      </footer>
    </main>
  );
}
