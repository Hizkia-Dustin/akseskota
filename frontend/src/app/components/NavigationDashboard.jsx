"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import CountUp from "./react-bits/CountUp";
import MotionSurface from "./react-bits/MotionSurface";
import MapboxMap from "./MapboxMap";
import {
  AlertTriangle,
  Bookmark,
  Camera,
  Check,
  CheckCircle2,
  ChevronLeft,
  Clock3,
  Flag,
  LogOut,
  MapPin,
  Menu,
  Navigation,
  Route,
  Send,
  Share2,
  ShieldCheck,
  UserRound,
  X,
} from "lucide-react";

const modes = [
  { id: "wheelchair", icon: "♿", label: "Kursi Roda", detail: "Bebas tangga, ramp tersedia" },
  { id: "elderly", icon: "🧓", label: "Lansia", detail: "Bangku & pencahayaan optimal" },
  { id: "stroller", icon: "👶", label: "Stroller", detail: "Trotoar lebar & ramp" },
  { id: "low-vision", icon: "👁️", label: "Low Vision", detail: "Guiding block & lampu jalan" },
  { id: "walking", icon: "🚶", label: "Pejalan Kaki", detail: "Preferensi kenyamanan umum" },
];

const routes = [
  { id: "A", street: "Via Jl. Pandanaran", badge: "Paling Aksesibel", time: "16 mnt", distance: "1.1 km", score: 88, tone: "teal" },
  { id: "B", street: "Via Jl. Pemuda", badge: "Paling Teduh", time: "20 mnt", distance: "1.4 km", score: 74, tone: "orange" },
  { id: "C", street: "Via Jl. Imam Bonjol", badge: "Paling Pendek", time: "12 mnt", distance: "0.8 km", score: 61, tone: "blue" },
];

const routeTone = {
  teal: { card: "bg-gradient-to-br from-[#0c7181] to-[#173c61]", badge: "bg-white/20", ring: "border-white", accent: "text-[#0c6478]" },
  orange: { card: "bg-gradient-to-br from-[#f59e0b] to-[#b94b05]", badge: "bg-white/20", ring: "border-white", accent: "text-[#f59e0b]" },
  blue: { card: "bg-gradient-to-br from-[#4387f7] to-[#2143a5]", badge: "bg-white/20", ring: "border-white", accent: "text-[#3b82f6]" },
};

const initialReports = [
  { title: "Trotoar Rusak", place: "Jl. Pandanaran · 2 jam lalu", status: "Diproses", tone: "bg-[#dbeafe] text-[#155dfc]" },
  { title: "Genangan Air", place: "Jl. Pemuda · 1 hari lalu", status: "Selesai", tone: "bg-[#cbfbf1] text-[#06705f]" },
  { title: "Ramp Tidak Ada", place: "Simpang Lima · 3 hari lalu", status: "Ditinjau", tone: "bg-[#fef3c6] text-[#a34b00]" },
];

const placePreview = {
  name: "Balai Kota Semarang",
  category: "Kantor pemerintahan",
  address: "Jl. Pemuda No.148, Sekayu, Semarang Tengah",
  accessibilityScore: 88,
  coordinates: "-6.9839, 110.4108",
};

function LegacyMapCanvas({ activeRoute = "A", highContrast = false }) {
  return (
    <svg aria-label="Peta vektor rute AksesKota" role="img" viewBox="0 0 1440 1024" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 size-full">
      <rect width="1440" height="1024" fill={highContrast ? "#d6e0e4" : "#e4e9eb"} />
      <g fill="none" strokeLinecap="round">
        {[120,260,410,560,720,870].map((y) => <path key={`h-${y}`} d={`M-50 ${y} C240 ${y-80} 430 ${y+90} 720 ${y-10} S1160 ${y-70} 1490 ${y+30}`} stroke="#b9c4ca" strokeWidth="18" />)}
        {[160,390,640,930,1200].map((x) => <path key={`v-${x}`} d={`M${x} -40 C${x-100} 240 ${x+100} 430 ${x-40} 700 S${x+80} 930 ${x+20} 1080`} stroke="#c6d0d5" strokeWidth="13" />)}
        <path d="M-40 330 C260 290 380 360 610 315 S1040 290 1490 350" stroke="#8798a3" strokeWidth="28" />
        <path d="M340 -20 C310 240 490 330 425 530 S410 820 650 1050" stroke="#83949e" strokeWidth="20" />
        <path d="M1010 -30 C950 220 1110 450 1000 700 S1050 920 1160 1060" stroke="#91a0a9" strokeWidth="17" />
        <path d="M800 20 C735 180 570 210 585 370 C605 550 500 650 540 820 C570 915 710 920 785 970" stroke="#312783" strokeWidth={activeRoute === "A" ? 13 : 7} />
        <path d="M800 20 C760 190 610 260 650 410 C690 560 750 650 725 800 C710 900 770 935 785 970" stroke="#4c52ad" strokeWidth={activeRoute === "B" ? 12 : 6} />
        <path d="M800 20 C830 210 740 330 810 480 C900 660 840 800 785 970" stroke="#6f74cd" strokeWidth={activeRoute === "C" ? 12 : 5} />
      </g>
      <g fontFamily="Plus Jakarta Sans" fill="#65717c">
        <text x="390" y="265" fontSize="37" fontWeight="800" fill="#303b44">Bekasi</text>
        <text x="535" y="220" fontSize="16">Stadion Patriot Candrabhaga</text>
        <text x="485" y="465" fontSize="16">Metropolitan Mall Bekasi</text>
        <text x="825" y="640" fontSize="16">Living World Grand Wisata</text>
        <text x="620" y="905" fontSize="16" fill="#4e7e62">Funpark Bekasi Timur</text>
        <text x="1010" y="390" fontSize="16">Gedung Juang 45 Bekasi</text>
      </g>
      <g>
        <circle cx="800" cy="20" r="13" fill="#fff" stroke="#303782" strokeWidth="7" />
        <circle cx="785" cy="970" r="14" fill="#ef4444" stroke="#fff" strokeWidth="5" />
        <circle cx="540" cy="820" r="13" fill="#4f8a67" stroke="#fff" strokeWidth="5" />
      </g>
      <g fontFamily="Plus Jakarta Sans" fontSize="13" fontWeight="700">
        <rect x="430" y="785" width="90" height="50" rx="4" fill="#fff" stroke="#6b7280" />
        <text x="445" y="806" fill="#374151">39 mnt</text><text x="445" y="824" fill="#6b7280">19,4 km</text>
        <rect x="650" y="620" width="90" height="50" rx="4" fill="#fff" stroke="#9ca3af" />
        <text x="665" y="641" fill="#374151">43 mnt</text><text x="665" y="659" fill="#6b7280">20,1 km</text>
      </g>
    </svg>
  );
}

function MapCanvas({ activeRoute = "A", highContrast = false }) {
  return <MapboxMap activeRoute={activeRoute} highContrast={highContrast} />;
}

function ScoreRing({ score, color = "border-white" }) {
  return <span className={`grid size-12 place-items-center rounded-full border-[5px] border-dashed text-[14px] font-extrabold ${color}`}><CountUp to={score} duration={0.75} /></span>;
}

function RouteCard({ route, active = false, onDetail, onSelect }) {
  const tone = routeTone[route.tone];
  if (!active) {
    return (
      <button data-route-card type="button" onClick={onSelect} className="flex w-full items-center rounded-[18px] border-2 border-[#f0f1f3] bg-[#fafbfc] p-4 text-left transition duration-200 hover:-translate-y-0.5 hover:border-[#cddbdc] hover:shadow-md active:scale-[.985]">
        <span className="min-w-0 flex-1"><span className="block text-[12px] font-semibold text-[#99a1af]">{route.street}</span><span className={`mt-2 inline-block rounded-full px-2 py-1 text-[9px] font-extrabold ${route.tone === "orange" ? "bg-[#fef3c6] text-[#a34b00]" : "bg-[#dbeafe] text-[#155dfc]"}`}>{route.badge}</span><span className="mt-3 flex gap-2 text-[10px] text-[#475467]"><b className="rounded-lg bg-white px-2 py-1.5">◷ {route.time}</b><b className="rounded-lg bg-white px-2 py-1.5">➤ {route.distance}</b></span></span><ScoreRing score={route.score} color={route.tone === "orange" ? "border-[#f59e0b] text-[#1f2937]" : "border-[#3b82f6] text-[#1f2937]"} />
      </button>
    );
  }
  return (
    <article data-route-card className={`rounded-[18px] p-5 text-white shadow-[0_10px_20px_rgba(20,50,75,.2)] ${tone.card}`}>
      <div className="flex"><div className="flex-1"><p className="text-[12px] text-white/65">{route.street}</p><span className={`mt-2 inline-block rounded-full px-2 py-1 text-[9px] font-extrabold ${tone.badge}`}>{route.badge}</span><div className="mt-3 flex gap-2 text-[10px]"><b className="rounded-lg bg-white/15 px-2 py-1.5"><Clock3 className="mr-1 inline size-3" />{route.time}</b><b className="rounded-lg bg-white/15 px-2 py-1.5"><Navigation className="mr-1 inline size-3" />{route.distance}</b></div></div><ScoreRing score={route.score} /></div>
      <div className="mt-4 grid grid-cols-[1fr_auto] gap-2"><button type="button" onClick={onDetail} className="rounded-full bg-white py-2.5 text-[11px] font-extrabold text-[#0c6478] transition hover:-translate-y-0.5 hover:shadow-lg active:scale-95">Lihat Detail</button><button type="button" onClick={onSelect} className="rounded-full bg-white/20 px-4 text-[11px] font-bold transition hover:bg-white/30 active:scale-95">Tutup</button></div>
    </article>
  );
}

function SearchBox({ origin, destination, setOrigin, setDestination, onSearch, onPlace, mode, onMode }) {
  return (
    <MotionSurface direction="down" distance={18} duration={0.65} className="absolute left-[61px] right-5 top-[22px] z-20 sm:left-[84px] sm:right-auto sm:top-3 sm:w-[272px] sm:max-w-[calc(100vw-100px)]">
      <div className="overflow-hidden rounded-[16px] bg-white shadow-[0_8px_22px_rgba(30,50,65,.18)]">
        <label className="relative z-10 flex h-[42px] items-center gap-3 border-b border-[#edf0f2] bg-white px-4 sm:h-12"><span className="size-2.5 rounded-full bg-[#0c6478]" /><input aria-label="Lokasi awal" value={origin} onChange={(e) => setOrigin(e.target.value)} className="min-w-0 flex-1 bg-white text-[13px] font-semibold outline-none sm:text-[11px]" /></label>
        <label className="relative z-10 flex h-[42px] items-center gap-3 border-b border-[#edf0f2] bg-white px-4 sm:h-12"><span className="size-2.5 rounded-full bg-[#f59e0b]" /><input aria-label="Tujuan" value={destination} onFocus={onPlace} onChange={(e) => setDestination(e.target.value)} className="min-w-0 flex-1 bg-white text-[13px] font-semibold outline-none sm:text-[11px]" /><X className="size-3 text-[#b2bac5]" /></label>
        <button type="button" onClick={onSearch} className="m-3 hidden h-10 w-[calc(100%-24px)] rounded-xl bg-[#0c6478] text-[11px] font-extrabold text-white transition duration-200 hover:-translate-y-0.5 hover:bg-[#09596a] hover:shadow-lg active:scale-[.98] sm:block">Cari Rute →</button>
      </div>
      <button type="button" onClick={onMode} className="mt-2 hidden items-center gap-2 rounded-full bg-white px-3 py-2 text-[10px] font-bold text-[#0c6478] shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl active:scale-95 sm:flex"><span>{mode.icon}</span>{mode.label}<span>›</span></button>
    </MotionSurface>
  );
}

function PlaceCard({ place, onRoute, onClose }) {
  const [saved, setSaved] = useState(false);
  const [shared, setShared] = useState(false);

  async function sharePlace() {
    const text = `${place.name} — ${place.address}`;
    try {
      if (navigator.share) await navigator.share({ title: place.name, text });
      else await navigator.clipboard.writeText(text);
      setShared(true);
      window.setTimeout(() => setShared(false), 1600);
    } catch {
      setShared(false);
    }
  }

  return (
    <MotionSurface as="aside" direction="left" distance={30} scale={0.98} className="absolute inset-x-0 bottom-0 z-40 overflow-hidden rounded-t-[28px] bg-white shadow-[0_-10px_30px_rgba(30,50,65,.2)] sm:bottom-3 sm:left-auto sm:right-3 sm:top-3 sm:w-[360px] sm:max-w-[calc(100vw-24px)] sm:rounded-[20px] sm:shadow-[0_14px_38px_rgba(30,50,65,.24)]">
      <div className="relative h-32 overflow-hidden bg-gradient-to-br from-[#d7f8f2] via-[#eaf9f6] to-[#dbeafe] sm:h-40">
        <div className="absolute -bottom-10 -left-8 size-40 rounded-full border-[22px] border-white/55" />
        <div className="absolute -right-6 -top-12 size-44 rounded-full border-[26px] border-[#35cbb0]/25" />
        <div className="absolute inset-x-0 bottom-0 flex h-20 items-end justify-center gap-2 opacity-65">
          {[44, 66, 52, 82, 58].map((height, index) => <span key={height + index} className="w-10 rounded-t-lg bg-[#0c6478]/25" style={{ height }} />)}
        </div>
        <span className="absolute left-1/2 top-1/2 grid size-14 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-4 border-white bg-[#f59e0b] text-white shadow-xl"><MapPin className="size-6" /></span>
        <button type="button" onClick={onClose} aria-label="Tutup detail lokasi" className="absolute right-3 top-3 grid size-9 place-items-center rounded-full bg-white/90 text-[#344054] shadow-md backdrop-blur"><X className="size-4" /></button>
        <span className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1.5 text-[9px] font-extrabold text-[#0c6478] shadow-sm">DATA LOKASI DEMO</span>
      </div>

      <div className="p-5 sm:p-5">
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1"><h2 className="truncate text-[19px] font-extrabold text-[#101828]">{place.name}</h2><p className="mt-1 text-[11px] font-semibold text-[#667085]">{place.category}</p></div>
          <span className="grid size-12 shrink-0 place-items-center rounded-full border-4 border-[#35cbb0] bg-[#effaf8] text-[13px] font-extrabold text-[#0c6478]">{place.accessibilityScore}</span>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2">
          <button type="button" onClick={onRoute} className="grid min-h-16 place-items-center rounded-[15px] bg-[#0c6478] px-2 text-[10px] font-extrabold text-white shadow-lg shadow-[#0c6478]/15"><Route className="size-4" />Rute</button>
          <button type="button" onClick={() => setSaved(value => !value)} className={`grid min-h-16 place-items-center rounded-[15px] border-2 px-2 text-[10px] font-extrabold ${saved ? "border-[#35cbb0] bg-[#effaf8] text-[#0c6478]" : "border-[#edf0f2] text-[#475467]"}`}><Bookmark className={`size-4 ${saved ? "fill-[#35cbb0]" : ""}`} />{saved ? "Tersimpan" : "Simpan"}</button>
          <button type="button" onClick={sharePlace} className="grid min-h-16 place-items-center rounded-[15px] border-2 border-[#edf0f2] px-2 text-[10px] font-extrabold text-[#475467]"><Share2 className="size-4" />{shared ? "Disalin" : "Bagikan"}</button>
        </div>

        <div className="mt-5 space-y-3 border-t border-[#edf0f2] pt-4">
          <div className="flex gap-3"><MapPin className="mt-0.5 size-4 shrink-0 text-[#0c6478]" /><div><p className="text-[11px] font-bold text-[#344054]">{place.address}</p><p className="mt-1 text-[9px] text-[#98a2b3]">{place.coordinates}</p></div></div>
          <div className="flex gap-3"><ShieldCheck className="mt-0.5 size-4 shrink-0 text-[#12a594]" /><div><p className="text-[11px] font-bold text-[#344054]">Skor aksesibilitas {place.accessibilityScore}/100</p><p className="mt-1 text-[9px] leading-4 text-[#98a2b3]">Ramp terdeteksi pada rute utama. Detail perlu diverifikasi komunitas.</p></div></div>
          <div className="flex gap-3"><Clock3 className="mt-0.5 size-4 shrink-0 text-[#f59e0b]" /><div><p className="text-[11px] font-bold text-[#344054]">Jam operasional belum diverifikasi</p><p className="mt-1 text-[9px] text-[#98a2b3]">Hubungkan Places API atau data pemerintah untuk informasi aktual.</p></div></div>
        </div>
      </div>
    </MotionSurface>
  );
}

function LeftRail({ onReport, onProfile }) {
  const [open, setOpen] = useState(false);
  return (
    <MotionSurface as="aside" direction="right" distance={18} delay={0.1} className={`absolute left-[10px] top-[22px] z-30 flex flex-col items-center rounded-[18px] bg-white/95 shadow-[0_8px_22px_rgba(30,50,65,.17)] transition-all sm:bottom-3 sm:left-3 sm:top-3 sm:h-auto sm:w-[66px] sm:px-0 sm:py-4 ${open ? "w-[52px] p-1.5" : "h-[42px] w-[42px]"}`}>
      <button type="button" onClick={() => setOpen(value => !value)} aria-label="Buka menu" className="grid size-[42px] place-items-center rounded-full text-[#1f2937] sm:hidden"><Menu className="size-5" /></button>
      <span className="hidden size-10 place-items-center rounded-full bg-[#35cbb0] text-white sm:grid"><MapPin className="size-5" /></span>
      <button type="button" onClick={onReport} aria-label="Buka laporan" className={`${open ? "grid" : "hidden"} mt-1 size-10 place-items-center rounded-xl text-[#0c6478] hover:bg-[#effaf8] sm:mt-5 sm:grid`}><Flag className="size-5" /></button>
      <button type="button" onClick={onProfile} aria-label="Buka profil" className={`${open ? "grid" : "hidden"} mt-1 size-10 place-items-center rounded-xl text-[#78909c] hover:bg-[#effaf8] sm:mt-2 sm:grid`}><UserRound className="size-5" /></button>
      <span className="mt-auto hidden size-2 rounded-full bg-[#46dfb1] sm:block" />
    </MotionSurface>
  );
}

function ModePanel({ current, onChange, onClose }) {
  return (
    <MotionSurface direction="down" distance={14} scale={0.97} staggerSelector="[data-mode-item]" className="absolute left-[84px] top-[194px] z-40 hidden w-[260px] rounded-[16px] bg-white shadow-[0_12px_30px_rgba(30,50,65,.22)] sm:block">
      <div className="flex items-center justify-between border-b border-[#edf0f2] px-4 py-3"><strong className="text-[12px]">Mode Perjalanan</strong><button onClick={onClose} aria-label="Tutup mode"><X className="size-4 text-[#9aa3af]" /></button></div>
      <div className="py-2">{modes.map((mode) => <button data-mode-item key={mode.id} type="button" onClick={() => onChange(mode.id)} className={`flex w-full items-center px-4 py-2.5 text-left transition hover:bg-[#effaf8] active:scale-[.98] ${current === mode.id ? "bg-[#effaf8]" : ""}`}><span className="w-8 text-lg">{mode.icon}</span><span><b className="block text-[11px]">{mode.label}</b><small className="text-[9px] text-[#99a1af]">{mode.detail}</small></span>{current === mode.id && <CheckCircle2 className="ml-auto size-4 text-[#0c6478]" />}</button>)}</div>
    </MotionSurface>
  );
}

function RoutesPanel({ selected, setSelected, onDetail, onClose }) {
  return (
    <MotionSurface as="aside" direction="left" distance={34} staggerSelector="[data-route-card]" className="absolute inset-x-0 bottom-0 z-40 max-h-[52dvh] overflow-y-auto rounded-t-[28px] bg-white p-5 shadow-[0_-8px_30px_rgba(30,50,65,.18)] sm:bottom-3 sm:left-auto sm:right-3 sm:top-3 sm:max-h-none sm:w-[368px] sm:max-w-[calc(100vw-24px)] sm:rounded-[18px] sm:shadow-[0_12px_35px_rgba(30,50,65,.22)]">
      <div className="mx-auto mb-5 h-1 w-12 rounded-full bg-[#dfe3e7] sm:hidden" />
      <div className="flex items-start justify-between"><div><h2 className="text-[18px] font-extrabold sm:text-[20px]">3 rute alternatif</h2><p className="mt-1 text-[11px] text-[#99a1af]">Menuju <b className="text-[#344054]">Balai Kota Semarang</b></p></div><button onClick={onClose} aria-label="Tutup rute" className="grid size-9 place-items-center rounded-full bg-[#f4f5f6]"><X className="size-4" /></button></div>
      <p className="mt-4 hidden items-center gap-2 rounded-xl border border-[#fecaca] bg-[#fef2f2] px-3 py-2.5 text-[10px] font-bold text-[#e7000b] sm:flex"><AlertTriangle className="size-4" />Genangan aktif di Rute C</p>
      <div className="mt-4 space-y-2.5 sm:mt-6 sm:space-y-3">{routes.map((route) => <RouteCard key={route.id} route={route} active={selected === route.id} onSelect={() => setSelected(selected === route.id ? "" : route.id)} onDetail={() => onDetail(route.id)} />)}</div>
    </MotionSurface>
  );
}

function DetailPanel({ route, profile, onBack, onReport, onNavigate }) {
  const reasons = profile === "stroller" ? ["Tidak ada tangga", "Ramp tersedia di 3 titik", "Trotoar lebar di 82% rute"] : profile === "low-vision" ? ["Guiding block di jalur utama", "6 persimpangan bersuara", "Pencahayaan malam baik"] : ["Tidak ada tangga", "Ramp tersedia di 3 titik", "68% jalur teduh"];
  const steps = ["Halte Trans Semarang — Simpang Lima", "Belok kiri, Jl. Pandanaran — 320 m", "Seberang zebra cross — Jl. Pemuda", "Koridor beratap — 180 m", "Balai Kota Semarang"];
  return (
    <MotionSurface as="aside" direction="left" distance={34} className="absolute inset-x-0 bottom-0 top-[175px] z-50 flex flex-col overflow-hidden rounded-t-[28px] bg-white shadow-[0_-8px_30px_rgba(30,50,65,.2)] sm:bottom-3 sm:left-auto sm:right-3 sm:top-3 sm:w-[352px] sm:max-w-[calc(100vw-24px)] sm:rounded-[18px] sm:shadow-[0_12px_35px_rgba(30,50,65,.24)]">
      <div className="mx-auto mt-5 h-1 w-12 shrink-0 rounded-full bg-[#dfe3e7] sm:hidden" />
      <div className="flex items-center border-b border-[#edf0f2] p-4"><button onClick={onBack} className="grid size-9 place-items-center rounded-full bg-[#f5f6f7]"><ChevronLeft className="size-5" /></button><div className="ml-3"><h2 className="text-[13px] font-extrabold">Rute {route.id} — Detail</h2><p className="text-[10px] text-[#99a1af]">Menuju Balai Kota Semarang</p></div></div>
      <div className="grid grid-cols-3 border-b border-[#edf0f2] text-center">{[[route.distance,"Jarak"],[route.time,"Waktu"],[route.score,"Skor"]].map(([value,label])=><div key={label} className="border-r border-[#edf0f2] py-4 last:border-0"><b className="block text-[18px]">{label === "Skor" ? <CountUp to={Number(value)} duration={0.8} /> : value}</b><small className="text-[10px] text-[#99a1af]">{label}</small></div>)}</div>
      <div className="flex-1 overflow-y-auto p-4 pb-6">
        {[['Aksesibilitas',route.score],['Kenyamanan',72],['Keamanan',81]].map(([label,value])=><div key={label} className="mb-3"><div className="flex justify-between text-[10px]"><span>{label}</span><b className="text-[#0c6478]">{value}</b></div><div className="mt-1 h-2 rounded-full bg-[#eef1f3]"><div className="h-full rounded-full bg-[#0c6478]" style={{width:`${value}%`}} /></div></div>)}
        <div className="mt-4 rounded-[16px] bg-[#effaf8] p-4"><h3 className="text-[10px] font-extrabold text-[#006b63]">MENGAPA DIREKOMENDASIKAN?</h3>{reasons.map(reason=><p key={reason} className="mt-2 flex items-center gap-2 text-[11px] font-semibold text-[#008b7f]"><CheckCircle2 className="size-4" />{reason}</p>)}</div>
        <h3 className="mt-6 text-[14px] font-extrabold sm:mt-5 sm:text-[12px]">Langkah Perjalanan</h3><div className="mt-3">{steps.map((step,index)=><div key={step} className="relative flex gap-3 pb-4 before:absolute before:bottom-0 before:left-[14px] before:top-7 before:w-px before:bg-[#d9dfe3] last:before:hidden"><span className={`relative z-10 grid size-7 shrink-0 place-items-center rounded-full text-[10px] font-bold text-white ${index===0?'bg-[#0c6478]':index===4?'bg-[#f59e0b]':'bg-[#6b7280]'}`}>{index+1}</span><div><b className="text-[13px] sm:text-[11px]">{step}</b><p className="mt-1 text-[11px] text-[#99a1af] sm:text-[9px]">✓ Akses sesuai profil {modes.find(m=>m.id===profile)?.label}</p></div></div>)}</div>
        <h3 className="mt-2 text-[10px] font-extrabold text-[#99a1af]">FASILITAS DI RUTE</h3><div className="mt-2 flex flex-wrap gap-2">{["3 Ramp","2 Bangku","1 Shelter","Guiding Block","Zebra Cross","Air Minum"].map(x=><span key={x} className="rounded-full bg-[#f3f4f6] px-3 py-2 text-[9px] font-bold text-[#5f6b7a]">{x}</span>)}</div>
      </div>
      <div className="grid grid-cols-[100px_1fr] gap-2 border-t border-[#edf0f2] p-3"><button onClick={onReport} className="rounded-xl border-2 border-[#e3e7ea] text-[11px] font-bold"><Flag className="mr-1 inline size-4" />Lapor</button><button onClick={onNavigate} className="rounded-xl bg-[#0c6478] text-[11px] font-extrabold text-white">Mulai Navigasi →</button></div>
    </MotionSurface>
  );
}

function SideShell({ title, icon, onClose, children }) {
  return <MotionSurface as="aside" direction="right" distance={34} className="absolute inset-0 z-50 w-full overflow-y-auto bg-white p-[23px] sm:bottom-3 sm:left-3 sm:right-auto sm:top-3 sm:w-[345px] sm:max-w-[calc(100vw-24px)] sm:rounded-[18px] sm:p-5 sm:shadow-[0_12px_35px_rgba(30,50,65,.24)]"><div className="flex items-center"><span className="grid size-9 place-items-center rounded-[14px] bg-gradient-to-br from-[#0c6478] to-[#46dfb1] text-white sm:hidden">{icon}</span><span className="hidden size-10 place-items-center rounded-full bg-[#35cbb0] text-white sm:grid"><MapPin className="size-5" /></span><b className="ml-3 text-[18px]"><span className="sm:hidden">{title}</span><span className="hidden sm:inline">AksesKota</span></b><button onClick={onClose} aria-label={`Tutup ${title}`} className="ml-auto grid size-9 place-items-center rounded-full bg-[#f4f5f6] transition hover:rotate-90 hover:bg-[#e9edef]"><X className="size-4" /></button></div><div className="mt-5 hidden items-center gap-3 rounded-[15px] bg-[#effaf8] px-4 py-3 text-[#0c6478] sm:flex">{icon}<b>{title}</b></div>{children}</MotionSurface>;
}

function ReportPanel({ reports, setReports, onClose }) {
  const [tab,setTab]=useState("create"); const [type,setType]=useState("Trotoar Rusak"); const [description,setDescription]=useState("");
  function submit(e){e.preventDefault();setReports([{title:type,place:"Lokasi saat ini · baru saja",status:"Diproses",tone:"bg-[#dbeafe] text-[#155dfc]"},...reports]);setDescription("");setTab("history");}
  return <SideShell title="Laporan" icon={<Flag className="size-5" />} onClose={onClose}><div className="mt-5 grid grid-cols-2 rounded-[20px] bg-[#f0f3f4] p-1 sm:mt-4 sm:rounded-[15px]"><button onClick={()=>setTab("create")} className={`rounded-[17px] py-3 text-[14px] font-bold sm:rounded-xl sm:py-2.5 sm:text-[11px] ${tab==='create'?'bg-white text-[#0c6478] shadow-sm':'text-[#99a1af]'}`}>Buat Laporan</button><button onClick={()=>setTab("history")} className={`rounded-[17px] py-3 text-[14px] font-bold sm:rounded-xl sm:py-2.5 sm:text-[11px] ${tab==='history'?'bg-white text-[#0c6478] shadow-sm':'text-[#99a1af]'}`}>Riwayat</button></div>{tab==='create'?<form onSubmit={submit} className="mt-6 sm:mt-5"><label className="text-[11px] font-extrabold tracking-[.1em] text-[#99a1af] sm:text-[10px]">LOKASI<input defaultValue="Lokasi saat ini" className="mt-2 h-14 w-full rounded-[18px] border-2 border-[#f0f1f3] bg-[#fafbfc] px-5 text-[15px] outline-none sm:h-13 sm:rounded-[15px] sm:px-4 sm:text-[12px]" /></label><p className="mt-6 text-[11px] font-extrabold tracking-[.1em] text-[#99a1af] sm:mt-5 sm:text-[10px]">JENIS HAMBATAN</p><div className="mt-2 flex flex-wrap gap-2">{["Trotoar Rusak","Genangan Air","Ramp Tidak Ada","Lampu Mati","Lainnya"].map(x=><button type="button" onClick={()=>setType(x)} key={x} className={`rounded-full px-3 py-2 text-[13px] font-bold sm:text-[10px] ${type===x?'bg-[#0c6478] text-white':'bg-[#f3f4f6] text-[#6b7280]'}`}>{x}</button>)}</div><label className="mt-6 block text-[11px] font-extrabold tracking-[.1em] text-[#99a1af] sm:mt-5 sm:text-[10px]">DESKRIPSI<textarea value={description} onChange={e=>setDescription(e.target.value)} placeholder="Jelaskan hambatan yang kamu temui..." className="mt-2 h-25 w-full resize-none rounded-[18px] border-2 border-[#f0f1f3] bg-[#fafbfc] p-5 text-[14px] outline-none sm:h-24 sm:rounded-[15px] sm:p-4 sm:text-[11px]" /></label><label className="mt-6 grid h-25 cursor-pointer place-items-center rounded-[18px] border-2 border-dashed border-[#dde3e7] text-center text-[13px] text-[#8b96a5] sm:mt-5 sm:h-24 sm:rounded-[15px] sm:text-[10px]"><input type="file" accept="image/*" className="sr-only" /><span><Camera className="mx-auto mb-2 size-5" />Tap untuk menambah foto</span></label><button className="mt-4 h-14 w-full rounded-[17px] bg-[#0c6478] text-[14px] font-extrabold text-white shadow-lg sm:mt-5 sm:h-13 sm:rounded-[15px] sm:text-[12px]">Kirim Laporan</button></form>:<div className="mt-6 sm:mt-5"><p className="text-[11px] font-extrabold tracking-[.1em] text-[#99a1af] sm:text-[10px]">LAPORAN YANG KAMU KIRIM:</p><div className="mt-3 space-y-3">{reports.map((r,i)=><article key={`${r.title}-${i}`} className="flex items-center rounded-[18px] border-2 border-[#f0f1f3] p-5 sm:rounded-[16px] sm:p-4"><div><b className="text-[15px] sm:text-[12px]">{r.title}</b><p className="mt-1 text-[13px] text-[#99a1af] sm:text-[10px]">{r.place}</p></div><span className={`ml-auto rounded-full px-3 py-2 text-[11px] font-bold sm:text-[9px] ${r.tone}`}>{r.status}</span></article>)}</div></div>}</SideShell>;
}

function ProfilePanel({ profile, onClose, onLogout }) {
  const mode=modes.find(m=>m.id===profile);
  return <SideShell title="Profil Saya" icon={<UserRound className="size-5" />} onClose={onClose}><div className="mt-5 flex items-center rounded-[18px] bg-gradient-to-r from-[#0c7181] to-[#173c61] p-5 text-white"><span className="grid size-16 place-items-center rounded-[16px] bg-white/20 text-2xl">?</span><div className="ml-4"><b className="text-[17px]">Tamu</b><p className="mt-1 text-[11px] text-[#7be3dc]">Mode tamu</p></div></div><div className="mt-5 flex items-center rounded-[16px] border-2 border-[#f0f1f3] p-4"><span className="text-xl">{mode.icon}</span><div className="ml-3"><small className="text-[9px] font-bold text-[#99a1af]">MODE PERJALANAN</small><b className="block text-[13px]">{mode.label}</b></div><span className="ml-auto rounded-full bg-[#effaf8] px-3 py-2 text-[9px] font-bold text-[#0c6478]">Aktif</span></div><div className="mt-5 grid grid-cols-2 gap-3">{[[3,"Laporan","dikirim"],[5,"Rute","tersimpan"]].map(([n,t,s])=><div key={t} className="rounded-[16px] border-2 border-[#f0f1f3] p-5 text-center transition hover:-translate-y-1 hover:shadow-md"><b className="block text-[32px] text-[#0c6478]"><CountUp to={n} duration={0.8} /></b><span className="text-[11px] font-bold">{t}</span><small className="block text-[9px] text-[#99a1af]">{s}</small></div>)}</div><button onClick={onLogout} className="mt-5 flex h-14 w-full items-center justify-center gap-2 rounded-[16px] border-2 border-[#fecaca] text-[12px] font-bold text-[#ff5a5f] transition hover:bg-[#fff5f5] active:scale-[.98]"><LogOut className="size-4" />Keluar dari Akun</button></SideShell>;
}

function MobileMapActions({ onSearch }) {
  return <>
    <button type="button" onClick={() => window.dispatchEvent(new Event("akseskota:locate"))} aria-label="Pusatkan lokasi saya" className="absolute bottom-[100px] right-[10px] z-30 grid size-12 place-items-center rounded-[18px] bg-white text-[#1f2937] shadow-[0_5px_18px_rgba(30,50,65,.2)] sm:hidden"><Navigation className="size-5 -rotate-12" /></button>
    <MotionSurface direction="up" distance={20} className="absolute inset-x-0 bottom-0 z-30 rounded-t-[26px] bg-white px-3 pb-4 pt-8 shadow-[0_-8px_24px_rgba(30,50,65,.16)] sm:hidden">
      <span className="absolute left-1/2 top-3 h-1 w-12 -translate-x-1/2 rounded-full bg-[#dfe3e7]" />
      <button type="button" onClick={onSearch} className="h-11 w-full rounded-[15px] bg-[#0c6478] text-[14px] font-extrabold text-white active:scale-[.98]">Cari Rute</button>
    </MotionSurface>
  </>;
}

export default function NavigationDashboard({ initialProfile="walking" }) {
  const router=useRouter(); const [profile,setProfile]=useState(initialProfile); const [panel,setPanel]=useState(null); const [selected,setSelected]=useState("A"); const [detail,setDetail]=useState("A"); const [origin,setOrigin]=useState("Lokasi saya"); const [destination,setDestination]=useState("Balai Kota Semarang"); const [reports,setReports]=useState(initialReports); const [navigating,setNavigating]=useState(false); const mode=modes.find(m=>m.id===profile)||modes[4]; const activeRoute=routes.find(r=>r.id===detail)||routes[0];
  function changeMode(id){setProfile(id);localStorage.setItem("akseskota-profile",id);setPanel(null);}
  return <main className={`relative h-dvh min-h-0 overflow-hidden bg-[#dfe5e8] sm:min-h-[620px] ${profile==='low-vision'?'contrast-[1.08]':''}`}><MapCanvas activeRoute={selected||detail} highContrast={profile==='low-vision'} />{!['report','profile'].includes(panel)&&<LeftRail onReport={()=>setPanel('report')} onProfile={()=>setPanel('profile')} />}<SearchBox origin={origin} destination={destination} setOrigin={setOrigin} setDestination={setDestination} onSearch={()=>setPanel('routes')} onPlace={()=>setPanel('place')} mode={mode} onMode={()=>setPanel(panel==='mode'?null:'mode')} />{!panel&&<MobileMapActions onSearch={()=>setPanel('routes')} />}{panel==='mode'&&<ModePanel current={profile} onChange={changeMode} onClose={()=>setPanel(null)} />}{panel==='place'&&<PlaceCard place={placePreview} onRoute={()=>setPanel('routes')} onClose={()=>setPanel(null)} />}{panel==='routes'&&<RoutesPanel selected={selected} setSelected={setSelected} onDetail={id=>{setDetail(id);setPanel('detail')}} onClose={()=>setPanel(null)} />}{panel==='detail'&&<DetailPanel route={activeRoute} profile={profile} onBack={()=>setPanel('routes')} onReport={()=>setPanel('report')} onNavigate={()=>{setNavigating(true);setPanel(null)}} />}{panel==='report'&&<ReportPanel reports={reports} setReports={setReports} onClose={()=>setPanel(null)} />}{panel==='profile'&&<ProfilePanel profile={profile} onClose={()=>setPanel(null)} onLogout={()=>router.push('/masuk')} />}{navigating&&<MotionSurface role="status" direction="up" distance={20} scale={0.96} ease="back.out(1.6)" className="absolute bottom-5 left-1/2 z-40 flex w-[min(520px,calc(100%-32px))] -translate-x-1/2 items-center rounded-[18px] bg-[#173c61] p-4 text-white shadow-2xl"><span className="grid size-11 shrink-0 place-items-center rounded-full bg-[#35cbb0]"><Navigation className="size-5" /></span><div className="ml-3"><b className="text-[12px]">Navigasi dimulai</b><p className="text-[10px] text-white/65">Ikuti Rute {activeRoute.id} menuju Balai Kota Semarang</p></div><button onClick={()=>setNavigating(false)} className="ml-auto grid size-9 place-items-center rounded-full bg-white/10 transition hover:rotate-90 hover:bg-white/20"><X className="size-4" /></button></MotionSurface>}</main>;
}
