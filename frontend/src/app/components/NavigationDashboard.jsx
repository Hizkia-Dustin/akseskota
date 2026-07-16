"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import CountUp from "./react-bits/CountUp";
import MotionSurface from "./react-bits/MotionSurface";
import MapboxMap from "./MapboxMap";
import { geocodeMapboxPlace, isInsideBogor, openGoogleStreetView, requestMapboxWalkingRoutes, searchMapboxPlaces } from "../../lib/mapboxRouting";
import { apiRequest, clearSession, getStoredSession } from "../../lib/api";
import {
  AlertTriangle,
  Bot,
  Bookmark,
  Camera,
  Check,
  CheckCircle2,
  ChevronLeft,
  Clock3,
  Flag,
  History,
  LogOut,
  MapPin,
  Menu,
  Mic,
  Navigation,
  Play,
  Route,
  Send,
  Share2,
  ShieldCheck,
  SlidersHorizontal,
  Star,
  UserRound,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";

const modes = [
  { id: "wheelchair", icon: "♿", label: "Kursi Roda", detail: "Bebas tangga, ramp tersedia" },
  { id: "elderly", icon: "🧓", label: "Lansia", detail: "Bangku & pencahayaan optimal" },
  { id: "stroller", icon: "👶", label: "Stroller", detail: "Trotoar lebar & ramp" },
  { id: "low-vision", icon: "👁️", label: "Low Vision", detail: "Guiding block & lampu jalan" },
  { id: "walking", icon: "🚶", label: "Pejalan Kaki", detail: "Preferensi kenyamanan umum" },
];

const accessibilityFeatures = [
  { value: "RAMP", label: "Ada Ramp" },
  { value: "LIFT", label: "Lift" },
  { value: "ACCESSIBLE_TOILET", label: "Toilet Difabel" },
  { value: "ACCESSIBLE_PARKING", label: "Parkir Difabel" },
  { value: "GUIDING_BLOCK", label: "Guiding Block" },
  { value: "STEP_FREE", label: "Bebas Tangga" },
];

const profileModeMap = { wheelchair: "WHEELCHAIR", elderly: "ELDERLY", stroller: "STROLLER", "low-vision": "LOW_VISION", walking: "GENERAL" };

function featureLabel(value) {
  return accessibilityFeatures.find((feature) => feature.value === value)?.label || value;
}

const routeTone = {
  teal: { card: "bg-gradient-to-br from-[#0c7181] to-[#173c61]", badge: "bg-white/20", ring: "border-white", accent: "text-[#0c6478]" },
  orange: { card: "bg-gradient-to-br from-[#f59e0b] to-[#b94b05]", badge: "bg-white/20", ring: "border-white", accent: "text-[#f59e0b]" },
  blue: { card: "bg-gradient-to-br from-[#4387f7] to-[#2143a5]", badge: "bg-white/20", ring: "border-white", accent: "text-[#3b82f6]" },
};

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

function MapCanvas({ routes, reports, activeRoute = "A", origin, destination, reportDraft, onMapClick, highContrast = false }) {
  return <MapboxMap routes={routes} reports={reports} activeRoute={activeRoute} origin={origin} destination={destination} reportDraft={reportDraft} onMapClick={onMapClick} highContrast={highContrast} />;
}

function ScoreRing({ score, color = "border-white" }) {
  if (!Number.isFinite(score)) return <span className={`grid size-12 place-items-center rounded-full border-2 px-1 text-center text-[7px] font-extrabold leading-3 ${color}`}>DATA<br/>BELUM<br/>CUKUP</span>;
  return <span className={`grid size-12 place-items-center rounded-full border-[5px] border-dashed text-[14px] font-extrabold ${color}`}><CountUp to={score} duration={0.75} /></span>;
}

function RouteCard({ route, active = false, onDetail, onSelect }) {
  const tone = routeTone[route.tone];
  if (!active) {
    return (
      <button data-route-card type="button" onClick={onSelect} className="flex w-full items-center rounded-[18px] border-2 border-[#f0f1f3] bg-[#fafbfc] p-4 text-left transition duration-200 hover:-translate-y-0.5 hover:border-[#cddbdc] hover:shadow-md active:scale-[.985]">
        <span className="min-w-0 flex-1"><span className="block text-[12px] font-semibold text-[#99a1af]">{route.street}</span><span className={`mt-2 inline-block rounded-full px-2 py-1 text-[9px] font-extrabold ${route.blocked ? "bg-[#fee2e2] text-[#b42318]" : route.tone === "orange" ? "bg-[#fef3c6] text-[#a34b00]" : "bg-[#dbeafe] text-[#155dfc]"}`}>{route.badge}</span><span className="mt-3 flex flex-wrap gap-2 text-[10px] text-[#475467]"><b className="rounded-lg bg-white px-2 py-1.5">◷ {route.time}</b><b className="rounded-lg bg-white px-2 py-1.5">➤ {route.distance}</b>{Number.isFinite(route.shade)&&<b className="rounded-lg bg-white px-2 py-1.5">☂ Teduh {route.shade}</b>}</span></span><ScoreRing score={route.score} color={route.tone === "orange" ? "border-[#f59e0b] text-[#1f2937]" : "border-[#3b82f6] text-[#1f2937]"} />
      </button>
    );
  }
  return (
    <article data-route-card className={`rounded-[18px] p-5 text-white shadow-[0_10px_20px_rgba(20,50,75,.2)] ${tone.card}`}>
      <div className="flex"><div className="flex-1"><p className="text-[12px] text-white/65">{route.street}</p><span className={`mt-2 inline-block rounded-full px-2 py-1 text-[9px] font-extrabold ${tone.badge}`}>{route.badge}</span><div className="mt-3 flex flex-wrap gap-2 text-[10px]"><b className="rounded-lg bg-white/15 px-2 py-1.5"><Clock3 className="mr-1 inline size-3" />{route.time}</b><b className="rounded-lg bg-white/15 px-2 py-1.5"><Navigation className="mr-1 inline size-3" />{route.distance}</b>{Number.isFinite(route.shade)&&<b className="rounded-lg bg-white/15 px-2 py-1.5">☂ Teduh {route.shade}/100</b>}<b className="rounded-lg bg-white/15 px-2 py-1.5">Data {route.dataCoverage ?? 0}%</b></div></div><ScoreRing score={route.score} /></div>
      <div className="mt-4 grid grid-cols-[1fr_auto] gap-2"><button type="button" onClick={onDetail} className="rounded-full bg-white py-2.5 text-[11px] font-extrabold text-[#0c6478] transition hover:-translate-y-0.5 hover:shadow-lg active:scale-95">Lihat Detail</button><button type="button" onClick={onSelect} className="rounded-full bg-white/20 px-4 text-[11px] font-bold transition hover:bg-white/30 active:scale-95">Tutup</button></div>
    </article>
  );
}

function PlaceSuggestions({ suggestions, error, label, onChoose }) {
  if (!suggestions.length && !error) return null;
  return <div role="listbox" aria-label={label} className="border-b border-[#edf0f2] bg-white py-1.5">{suggestions.map((place)=><button key={place.id} type="button" role="option" aria-selected="false" onClick={()=>onChoose(place)} className="flex w-full items-start gap-3 px-4 py-2.5 text-left transition hover:bg-[#effaf8]"><MapPin className="mt-0.5 size-4 shrink-0 text-[#0c6478]"/><span className="min-w-0"><b className="block truncate text-[11px] text-[#1f2937]">{place.name}</b><small className="mt-0.5 block truncate text-[9px] text-[#8b96a5]">{place.address}</small></span></button>)}{error&&<p className="px-4 py-3 text-[10px] font-semibold text-[#b42318]">{error}</p>}</div>;
}

function SearchBox({ origin, destination, setOrigin, setDestination, originCoordinates, onSelectOrigin, onSelectDestination, onSearch, mode, onMode, loading }) {
  const [activeField, setActiveField] = useState(null);
  const [originSuggestions, setOriginSuggestions] = useState([]);
  const [destinationSuggestions, setDestinationSuggestions] = useState([]);
  const [originSuggestionError, setOriginSuggestionError] = useState("");
  const [destinationSuggestionError, setDestinationSuggestionError] = useState("");

  useEffect(() => {
    if (activeField !== "origin" || origin.trim().length < 2 || origin.trim().toLowerCase() === "lokasi saya") return undefined;
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
        if (!token) return;
        const results = await searchMapboxPlaces(origin, token, originCoordinates, controller.signal);
        setOriginSuggestions(results);
        setOriginSuggestionError(results.length ? "" : "Tempat tidak ditemukan");
      } catch (error) {
        if (error?.name !== "AbortError") setOriginSuggestionError("Saran tempat gagal dimuat");
      }
    }, 300);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [activeField, origin, originCoordinates]);

  useEffect(() => {
    if (activeField !== "destination" || destination.trim().length < 2) return undefined;
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
        if (!token) return;
        const results = await searchMapboxPlaces(destination, token, originCoordinates, controller.signal);
        setDestinationSuggestions(results);
        setDestinationSuggestionError(results.length ? "" : "Tempat tidak ditemukan");
      } catch (error) {
        if (error?.name !== "AbortError") setDestinationSuggestionError("Saran tempat gagal dimuat");
      }
    }, 300);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [activeField, destination, originCoordinates]);

  function updateOrigin(value) {
    setActiveField("origin");
    setOriginSuggestions([]);
    setOriginSuggestionError("");
    setOrigin(value);
  }

  function updateDestination(value) {
    setActiveField("destination");
    setDestinationSuggestions([]);
    setDestinationSuggestionError("");
    setDestination(value);
  }

  function chooseOrigin(place) {
    setActiveField(null);
    setOriginSuggestions([]);
    setOriginSuggestionError("");
    onSelectOrigin(place);
  }

  function chooseDestination(place) {
    setActiveField(null);
    setDestinationSuggestions([]);
    setDestinationSuggestionError("");
    onSelectDestination(place);
  }

  return (
    <MotionSurface direction="down" distance={18} duration={0.65} className="absolute left-[61px] right-5 top-[22px] z-20 sm:left-[84px] sm:right-auto sm:top-3 sm:w-[272px] sm:max-w-[calc(100vw-100px)]">
      <div className="overflow-hidden rounded-[16px] bg-white shadow-[0_8px_22px_rgba(30,50,65,.18)]">
        <label className="relative z-10 flex h-[42px] items-center gap-3 border-b border-[#edf0f2] bg-white px-4 sm:h-12"><span className="size-2.5 rounded-full bg-[#0c6478]" /><input aria-label="Lokasi awal" autoComplete="off" placeholder="Cari titik awal" value={origin} onFocus={()=>setActiveField("origin")} onChange={(e) => updateOrigin(e.target.value)} onKeyDown={(event)=>{if(event.key==='Enter')onSearch();}} className="min-w-0 flex-1 bg-white text-[13px] font-semibold outline-none placeholder:font-normal placeholder:text-[#98a2b3] sm:text-[11px]" /><button type="button" onClick={()=>updateOrigin("")} aria-label="Hapus titik awal"><X className="size-3 text-[#b2bac5]" /></button></label>
        {activeField === "origin" && <PlaceSuggestions suggestions={originSuggestions} error={originSuggestionError} label="Saran titik awal" onChoose={chooseOrigin} />}
        <label className="relative z-10 flex h-[42px] items-center gap-3 border-b border-[#edf0f2] bg-white px-4 sm:h-12"><span className="size-2.5 rounded-full bg-[#f59e0b]" /><input aria-label="Tujuan" autoComplete="off" placeholder="Cari gedung, mal, jalan, atau kota" value={destination} onFocus={()=>setActiveField("destination")} onChange={(e) => updateDestination(e.target.value)} onKeyDown={(event)=>{if(event.key==='Enter')onSearch();}} className="min-w-0 flex-1 bg-white text-[13px] font-semibold outline-none placeholder:font-normal placeholder:text-[#98a2b3] sm:text-[11px]" /><button type="button" onClick={()=>updateDestination("")} aria-label="Hapus tujuan"><X className="size-3 text-[#b2bac5]" /></button></label>
        {activeField === "destination" && <PlaceSuggestions suggestions={destinationSuggestions} error={destinationSuggestionError} label="Saran tujuan" onChoose={chooseDestination} />}
        <button type="button" onClick={onSearch} disabled={loading} className="m-3 hidden h-10 w-[calc(100%-24px)] rounded-xl bg-[#0c6478] text-[11px] font-extrabold text-white transition duration-200 hover:-translate-y-0.5 hover:bg-[#09596a] hover:shadow-lg active:scale-[.98] disabled:cursor-wait disabled:opacity-60 sm:block">{loading ? "Menghitung…" : "Cari Rute →"}</button>
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

function StarRatingInput({ value, onChange }) {
  return <div className="flex gap-1">{[1, 2, 3, 4, 5].map((number) => <button key={number} type="button" onClick={() => onChange(number)} aria-label={`${number} bintang`}><Star className={`size-5 ${number <= value ? "fill-[#f59e0b] text-[#f59e0b]" : "text-[#d0d5dd]"}`} /></button>)}</div>;
}

function CommunityPlacePanel({ place, session, onRoute, onClose, onLogin }) {
  const [data, setData] = useState({ posts: [], summary: { postCount: 0, rating: null, accessibilityRating: null, features: [] } });
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [rating, setRating] = useState(5);
  const [accessibilityRating, setAccessibilityRating] = useState(5);
  const [features, setFeatures] = useState([]);
  const [photo, setPhoto] = useState(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try { setData(await apiRequest(`/community-places/external/${encodeURIComponent(place.id)}`)); }
    catch (error) { setMessage(error instanceof Error ? error.message : "Ulasan tempat gagal dimuat."); }
  }, [place.id]);

  useEffect(() => { const timer=window.setTimeout(load,0); return()=>window.clearTimeout(timer); }, [load]);

  function toggleFeature(value) {
    setFeatures((current) => current.includes(value) ? current.filter((item) => item !== value) : [...current, value]);
  }

  async function publish(event) {
    event.preventDefault();
    if (!session) return onLogin();
    setBusy(true); setMessage("");
    try {
      const form = new FormData();
      form.append("externalId", place.id); form.append("name", place.name); form.append("address", place.address || "");
      form.append("latitude", String(place.coordinates[1])); form.append("longitude", String(place.coordinates[0]));
      form.append("title", title); form.append("content", content); form.append("rating", String(rating)); form.append("accessibilityRating", String(accessibilityRating)); form.append("features", JSON.stringify(features));
      if (photo) form.append("photo", photo);
      await apiRequest("/community-places/posts", { method: "POST", body: form });
      setTitle(""); setContent(""); setFeatures([]); setPhoto(null); setMessage("Cerita, fasilitas, dan penilaian berhasil diterbitkan."); await load();
    } catch (error) { setMessage(error instanceof Error ? error.message : "Cerita gagal diterbitkan."); }
    finally { setBusy(false); }
  }

  return <SideShell title="Tempat Komunitas" icon={<MapPin className="size-5"/>} onClose={onClose}><div className="mt-5"><h2 className="text-[18px] font-extrabold">{place.name}</h2><p className="mt-1 text-[10px] leading-4 text-[#667085]">{place.address}</p><div className="mt-4 grid grid-cols-2 gap-2"><div className="rounded-[15px] bg-[#fff7ed] p-3"><b className="text-[18px] text-[#a34b00]">{data.summary.rating??'—'}</b><p className="text-[9px] text-[#667085]">Bintang tempat</p></div><div className="rounded-[15px] bg-[#effaf8] p-3"><b className="text-[18px] text-[#0c6478]">{data.summary.accessibilityRating??'—'}</b><p className="text-[9px] text-[#667085]">Ramah disabilitas</p></div></div>{!!data.summary.features?.length&&<div className="mt-3 flex flex-wrap gap-1.5">{data.summary.features.map(feature=><span key={feature} className="rounded-full bg-[#effaf8] px-2.5 py-1.5 text-[9px] font-bold text-[#0c6478]"><Check className="mr-1 inline size-3"/>{featureLabel(feature)}</span>)}</div>}<button onClick={onRoute} className="mt-3 h-11 w-full rounded-xl bg-[#0c6478] text-[11px] font-extrabold text-white">Cari rute ke tempat ini</button>
    <h3 className="mt-6 text-[12px] font-extrabold">Cerita komunitas ({data.summary.postCount})</h3><div className="mt-3 space-y-3">{data.posts.length===0&&<p className="rounded-xl bg-[#f8fafc] p-4 text-[10px] text-[#667085]">Belum ada penilaian. Jangan menyimpulkan tempat ini aksesibel sebelum ada kontribusi.</p>}{data.posts.map(post=><article key={post.id} className="rounded-[15px] border border-[#e4e7ec] p-3">{post.photoUrl&&<Image unoptimized width={280} height={130} src={post.photoUrl} alt="Foto tempat dari komunitas" className="mb-3 h-28 w-full rounded-xl object-cover"/>}<div className="flex items-center gap-1 text-[9px] font-bold text-[#f59e0b]"><Star className="size-3 fill-current"/>{post.rating} · Akses {post.accessibilityRating}/5</div>{Array.isArray(post.features)&&<div className="mt-2 flex flex-wrap gap-1">{post.features.map(feature=><span key={feature} className="rounded-full bg-[#f2f4f7] px-2 py-1 text-[8px] font-semibold text-[#475467]">{featureLabel(feature)}</span>)}</div>}<b className="mt-2 block text-[11px]">{post.title}</b><p className="mt-1 text-[9px] leading-4 text-[#667085]">{post.content}</p><small className="mt-2 block text-[8px] text-[#98a2b3]">{post.author.name} · {new Date(post.createdAt).toLocaleDateString('id-ID')}</small></article>)}</div>
    <form onSubmit={publish} className="mt-6 border-t border-[#e4e7ec] pt-5"><h3 className="text-[12px] font-extrabold">Tulis pengalamanmu</h3>{!session&&<p className="mt-2 rounded-xl bg-[#fff7ed] p-3 text-[9px] text-[#9a3412]">Masuk diperlukan agar artikel dan rating memiliki penulis yang jelas.</p>}<label className="mt-3 block text-[9px] font-bold text-[#667085]">BINTANG TEMPAT<StarRatingInput value={rating} onChange={setRating}/></label><label className="mt-3 block text-[9px] font-bold text-[#667085]">RAMAH DISABILITAS<StarRatingInput value={accessibilityRating} onChange={setAccessibilityRating}/></label><fieldset className="mt-4"><legend className="text-[9px] font-bold text-[#667085]">FASILITAS YANG BENAR-BENAR KAMU LIHAT</legend><div className="mt-2 grid grid-cols-2 gap-2">{accessibilityFeatures.map(feature=><label key={feature.value} className={`flex cursor-pointer items-center gap-2 rounded-xl border p-2.5 text-[9px] font-semibold ${features.includes(feature.value)?'border-[#35cbb0] bg-[#effaf8] text-[#0c6478]':'border-[#e4e7ec] text-[#667085]'}`}><input type="checkbox" checked={features.includes(feature.value)} onChange={()=>toggleFeature(feature.value)} className="accent-[#0c6478]"/>{feature.label}</label>)}</div></fieldset><input required value={title} onChange={event=>setTitle(event.target.value)} placeholder="Judul pengalaman" className="mt-3 h-11 w-full rounded-xl border border-[#d0d5dd] px-3 text-[10px]"/><textarea required minLength={10} value={content} onChange={event=>setContent(event.target.value)} placeholder="Ceritakan akses masuk, ramp, toilet, petugas, atau hambatan yang kamu alami." className="mt-2 h-24 w-full resize-none rounded-xl border border-[#d0d5dd] p-3 text-[10px]"/><label className="mt-2 block rounded-xl border border-dashed border-[#d0d5dd] p-3 text-center text-[9px] text-[#667085]"><input type="file" accept="image/jpeg,image/png,image/webp" onChange={event=>setPhoto(event.target.files?.[0]||null)} className="sr-only"/>{photo?photo.name:'Tambah foto tempat (opsional)'}</label>{message&&<p className="mt-2 rounded-xl bg-[#f8fafc] p-3 text-[9px] font-semibold text-[#475467]">{message}</p>}<button disabled={busy||!session} className="mt-3 h-11 w-full rounded-xl bg-[#0c6478] text-[10px] font-extrabold text-white disabled:opacity-50">{busy?'Menerbitkan...':'Terbitkan artikel & rating'}</button></form>
  </div></SideShell>;
}

function LeftRail({ onReport, onProfile, onAssistant, onHistory }) {
  const [open, setOpen] = useState(false);
  return (
    <MotionSurface animate={false} as="aside" className={`absolute left-[10px] top-[22px] z-30 flex w-[52px] flex-col items-center overflow-hidden rounded-[18px] bg-white/95 p-1.5 shadow-[0_8px_22px_rgba(30,50,65,.17)] transition-[max-height,box-shadow] duration-300 ease-out sm:bottom-3 sm:left-3 sm:top-3 sm:max-h-none sm:w-[66px] sm:overflow-visible sm:px-0 sm:py-4 ${open ? "max-h-[280px] shadow-[0_12px_28px_rgba(30,50,65,.2)]" : "max-h-[52px]"}`}>
      <button type="button" onClick={() => setOpen(value => !value)} aria-label="Buka menu" className="grid size-[42px] place-items-center rounded-full text-[#1f2937] sm:hidden"><Menu className="size-5" /></button>
      <span className="hidden size-10 place-items-center rounded-full bg-[#35cbb0] text-white sm:grid"><MapPin className="size-5" /></span>
      <button type="button" onClick={onReport} aria-label="Buka laporan" className={`mt-1 grid size-10 shrink-0 place-items-center rounded-xl text-[#0c6478] transition duration-200 hover:bg-[#effaf8] sm:mt-5 sm:translate-y-0 sm:opacity-100 ${open ? "translate-y-0 opacity-100" : "pointer-events-none -translate-y-1 opacity-0 sm:pointer-events-auto"}`}><Flag className="size-5" /></button>
      <button type="button" onClick={onAssistant} aria-label="Buka asisten aksesibilitas" className={`mt-1 grid size-10 shrink-0 place-items-center rounded-xl text-[#7c3aed] transition duration-200 hover:bg-[#f5f3ff] sm:mt-2 sm:translate-y-0 sm:opacity-100 ${open ? "translate-y-0 opacity-100" : "pointer-events-none -translate-y-1 opacity-0 sm:pointer-events-auto"}`}><Bot className="size-5" /></button>
      <button type="button" onClick={onHistory} aria-label="Buka riwayat perjalanan" className={`mt-1 grid size-10 shrink-0 place-items-center rounded-xl text-[#f59e0b] transition duration-200 hover:bg-[#fff7ed] sm:mt-2 sm:translate-y-0 sm:opacity-100 ${open ? "translate-y-0 opacity-100" : "pointer-events-none -translate-y-1 opacity-0 sm:pointer-events-auto"}`}><History className="size-5" /></button>
      <button type="button" onClick={onProfile} aria-label="Buka profil" className={`mt-1 grid size-10 shrink-0 place-items-center rounded-xl text-[#78909c] transition duration-200 hover:bg-[#effaf8] sm:mt-2 sm:translate-y-0 sm:opacity-100 ${open ? "translate-y-0 opacity-100" : "pointer-events-none -translate-y-1 opacity-0 sm:pointer-events-auto"}`}><UserRound className="size-5" /></button>
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

function RoutesPanel({ routes, destination, status, error, selected, setSelected, onDetail, onClose }) {
  return (
    <MotionSurface as="aside" direction="left" distance={34} staggerSelector="[data-route-card]" className="absolute inset-x-0 bottom-0 z-40 max-h-[52dvh] overflow-y-auto rounded-t-[28px] bg-white p-5 shadow-[0_-8px_30px_rgba(30,50,65,.18)] sm:bottom-3 sm:left-auto sm:right-3 sm:top-3 sm:max-h-none sm:w-[368px] sm:max-w-[calc(100vw-24px)] sm:rounded-[18px] sm:shadow-[0_12px_35px_rgba(30,50,65,.22)]">
      <div className="mx-auto mb-5 h-1 w-12 rounded-full bg-[#dfe3e7] sm:hidden" />
      <div className="flex items-start justify-between"><div><h2 className="text-[18px] font-extrabold sm:text-[20px]">{status === "loading" ? "Menghitung rute…" : `${routes.length} rute Mapbox`}</h2><p className="mt-1 text-[11px] text-[#99a1af]">Menuju <b className="text-[#344054]">{destination}</b></p></div><button onClick={onClose} aria-label="Tutup rute" className="grid size-9 place-items-center rounded-full bg-[#f4f5f6]"><X className="size-4" /></button></div>
      {error && <p role="alert" className="mt-4 flex items-center gap-2 rounded-xl border border-[#fecaca] bg-[#fef2f2] px-3 py-2.5 text-[10px] font-bold text-[#e7000b]"><AlertTriangle className="size-4" />{error}</p>}
      {status === "loading" && <div className="mt-6 space-y-3">{[1,2,3].map((item)=><div key={item} className="h-28 animate-pulse rounded-[18px] bg-[#eef2f3]" />)}</div>}
      {status === "ready" && <div className="mt-4 space-y-2.5 sm:mt-6 sm:space-y-3">{routes.map((route) => <RouteCard key={route.id} route={route} active={selected === route.id} onSelect={() => setSelected(route.id)} onDetail={() => onDetail(route.id)} />)}</div>}
    </MotionSurface>
  );
}

function DetailPanel({ route, profile, destination, destinationCoordinates, onBack, onReport, onNavigate }) {
  const steps = route.steps?.length ? route.steps : [{ instruction: `Tiba di ${destination}`, distance: route.distance }];
  return (
    <MotionSurface as="aside" direction="left" distance={34} className="absolute inset-x-0 bottom-0 top-[175px] z-50 flex flex-col overflow-hidden rounded-t-[28px] bg-white shadow-[0_-8px_30px_rgba(30,50,65,.2)] sm:bottom-3 sm:left-auto sm:right-3 sm:top-3 sm:w-[352px] sm:max-w-[calc(100vw-24px)] sm:rounded-[18px] sm:shadow-[0_12px_35px_rgba(30,50,65,.24)]">
      <div className="mx-auto mt-5 h-1 w-12 shrink-0 rounded-full bg-[#dfe3e7] sm:hidden" />
      <div className="flex items-center border-b border-[#edf0f2] p-4"><button onClick={onBack} className="grid size-9 place-items-center rounded-full bg-[#f5f6f7]"><ChevronLeft className="size-5" /></button><div className="ml-3"><h2 className="text-[13px] font-extrabold">Rute {route.id} — Detail</h2><p className="text-[10px] text-[#99a1af]">Menuju {destination}</p></div></div>
      <div className="grid grid-cols-2 border-b border-[#edf0f2] text-center">{[[route.distance,"Jarak Mapbox"],[route.time,"Waktu berjalan"]].map(([value,label])=><div key={label} className="border-r border-[#edf0f2] py-4 last:border-0"><b className="block text-[18px]">{value}</b><small className="text-[10px] text-[#99a1af]">{label}</small></div>)}</div>
      <div className="flex-1 overflow-y-auto p-4 pb-6">
        <div className={`rounded-[16px] p-4 ${route.blocked?'bg-[#fff1f2]':'bg-[#effaf8]'}`}><h3 className={`text-[10px] font-extrabold ${route.blocked?'text-[#b42318]':'text-[#006b63]'}`}>{route.blocked?'RUTE TIDAK SESUAI PROFIL':'PENILAIAN AKSESKOTA'}</h3><p className={`mt-2 text-[11px] font-semibold leading-5 ${route.blocked?'text-[#b42318]':'text-[#008b7f]'}`}>{Number.isFinite(route.score)?`Skor aksesibilitas ${route.score}/100 · keteduhan ${Number.isFinite(route.shade)?`${route.shade}/100`:'belum cukup data'} · cakupan data ${route.dataCoverage}%`:`Cakupan data komunitas baru ${route.dataCoverage||0}%. Angka skor belum ditampilkan agar tidak menyesatkan.`}</p>{route.evaluationReasons?.map(reason=><p key={reason} className="mt-2 text-[10px] font-bold text-[#667085]">• {reason}</p>)}</div>
        <h3 className="mt-6 text-[14px] font-extrabold sm:mt-5 sm:text-[12px]">Langkah Perjalanan</h3><div className="mt-3">{steps.map((step,index)=><div key={`${step.instruction}-${index}`} className="relative flex gap-3 pb-4 before:absolute before:bottom-0 before:left-[14px] before:top-7 before:w-px before:bg-[#d9dfe3] last:before:hidden"><span className={`relative z-10 grid size-7 shrink-0 place-items-center rounded-full text-[10px] font-bold text-white ${index===0?'bg-[#0c6478]':index===steps.length-1?'bg-[#f59e0b]':'bg-[#6b7280]'}`}>{index+1}</span><div><b className="text-[13px] sm:text-[11px]">{step.instruction}</b><p className="mt-1 text-[11px] text-[#99a1af] sm:text-[9px]">{step.distance} · petunjuk Mapbox</p></div></div>)}</div>
      </div>
      <div className="grid grid-cols-[82px_105px_1fr] gap-2 border-t border-[#edf0f2] p-3"><button onClick={onReport} className="rounded-xl border-2 border-[#e3e7ea] text-[10px] font-bold"><Flag className="mr-1 inline size-4" />Lapor</button><button onClick={()=>openGoogleStreetView(destinationCoordinates)} className="rounded-xl border-2 border-[#dbeafe] bg-[#eff6ff] text-[10px] font-bold text-[#155dfc]"><Camera className="mr-1 inline size-4" />Street View</button><button onClick={onNavigate} className="rounded-xl bg-[#0c6478] text-[10px] font-extrabold text-white">Mulai →</button></div>
    </MotionSurface>
  );
}

function SideShell({ title, icon, onClose, children }) {
  return <MotionSurface as="aside" direction="right" distance={12} duration={0.28} scale={1} ease="power2.out" className="absolute inset-0 z-50 w-full overflow-y-auto bg-white p-[23px] sm:bottom-3 sm:left-3 sm:right-auto sm:top-3 sm:w-[345px] sm:max-w-[calc(100vw-24px)] sm:rounded-[18px] sm:p-5 sm:shadow-[0_12px_35px_rgba(30,50,65,.24)]"><div className="flex items-center"><span className="grid size-9 place-items-center rounded-[14px] bg-gradient-to-br from-[#0c6478] to-[#46dfb1] text-white sm:hidden">{icon}</span><span className="hidden size-10 place-items-center rounded-full bg-[#35cbb0] text-white sm:grid"><MapPin className="size-5" /></span><b className="ml-3 text-[18px]"><span className="sm:hidden">{title}</span><span className="hidden sm:inline">AksesKota</span></b><button onClick={onClose} aria-label={`Tutup ${title}`} className="ml-auto grid size-9 place-items-center rounded-full bg-[#f4f5f6] transition duration-200 hover:bg-[#e9edef]"><X className="size-4" /></button></div><div className="mt-5 hidden items-center gap-3 rounded-[15px] bg-[#effaf8] px-4 py-3 text-[#0c6478] sm:flex">{icon}<b>{title}</b></div>{children}</MotionSurface>;
}

function AssistantPanel({ onChoose, onClose }) {
  const [prompt, setPrompt] = useState("");
  const [filters, setFilters] = useState([]);
  const [results, setResults] = useState([]);
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");
  const [listening, setListening] = useState(false);

  function toggleFilter(value) {
    setFilters((current) => current.includes(value) ? current.filter((item) => item !== value) : [...current, value]);
  }

  function inferredFilters() {
    const text = prompt.toLowerCase();
    const inferred = [];
    if (text.includes("ramp") || text.includes("kursi roda")) inferred.push("RAMP");
    if (text.includes("lift")) inferred.push("LIFT");
    if (text.includes("toilet")) inferred.push("ACCESSIBLE_TOILET");
    if (text.includes("parkir")) inferred.push("ACCESSIBLE_PARKING");
    if (text.includes("guiding") || text.includes("low vision") || text.includes("tunanetra")) inferred.push("GUIDING_BLOCK");
    if (text.includes("tanpa tangga") || text.includes("bebas tangga")) inferred.push("STEP_FREE");
    return inferred;
  }

  async function search(event) {
    event?.preventDefault();
    const activeFilters = [...new Set([...filters, ...inferredFilters()])];
    setFilters(activeFilters); setStatus("loading"); setMessage("");
    try {
      const params = new URLSearchParams({ query: prompt.trim() });
      if (activeFilters.length) params.set("features", activeFilters.join(","));
      const places = await apiRequest(`/community-places?${params}`);
      setResults(places);
      setMessage(places.length ? `${places.length} tempat ditemukan dari pengalaman komunitas.` : "Belum ada tempat dengan bukti komunitas yang cocok. Coba kurangi filter atau tambahkan kontribusi tempat.");
      setStatus("ready");
    } catch (error) { setResults([]); setMessage(error instanceof Error ? error.message : "Pencarian gagal."); setStatus("error"); }
  }

  function startListening() {
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) return setMessage("Pengenalan suara belum didukung browser ini. Kamu tetap bisa mengetik.");
    const recognition = new Recognition();
    recognition.lang = "id-ID"; recognition.interimResults = false; recognition.maxAlternatives = 1;
    recognition.onstart = () => setListening(true);
    recognition.onend = () => setListening(false);
    recognition.onerror = () => { setListening(false); setMessage("Suara belum terbaca. Coba lagi atau ketik permintaanmu."); };
    recognition.onresult = (event) => setPrompt(event.results[0][0].transcript);
    recognition.start();
  }

  return <SideShell title="Asisten Akses" icon={<Bot className="size-5" />} onClose={onClose}><div className="mt-5">
    <div className="rounded-[18px] bg-gradient-to-br from-[#173c61] to-[#0c6478] p-4 text-white"><Bot className="size-7 text-[#7be3dc]"/><h2 className="mt-3 text-[16px] font-extrabold">Cari tempat sesuai kebutuhanmu</h2><p className="mt-1 text-[10px] leading-5 text-white/70">Asisten hanya memakai artikel, rating, dan fasilitas yang dilaporkan komunitas AksesKota.</p></div>
    <form onSubmit={search} className="mt-4"><div className="relative"><textarea value={prompt} onChange={(event)=>setPrompt(event.target.value)} placeholder="Contoh: Aku pakai kursi roda, cari kafe tanpa tangga dekat IPB" className="h-24 w-full resize-none rounded-[15px] border-2 border-[#e4e7ec] p-3 pr-12 text-[11px] outline-none focus:border-[#35cbb0]"/><button type="button" onClick={startListening} aria-label="Ucapkan pencarian" className={`absolute bottom-3 right-3 grid size-8 place-items-center rounded-full ${listening?'animate-pulse bg-[#fee2e2] text-[#b42318]':'bg-[#effaf8] text-[#0c6478]'}`}><Mic className="size-4"/></button></div>
      <fieldset className="mt-4"><legend className="flex items-center gap-2 text-[10px] font-extrabold text-[#475467]"><SlidersHorizontal className="size-4"/>Quick Filter</legend><div className="mt-2 grid grid-cols-2 gap-2">{accessibilityFeatures.map(feature=><label key={feature.value} className={`flex cursor-pointer items-center gap-2 rounded-xl border p-2.5 text-[9px] font-semibold ${filters.includes(feature.value)?'border-[#35cbb0] bg-[#effaf8] text-[#0c6478]':'border-[#e4e7ec] text-[#667085]'}`}><input type="checkbox" checked={filters.includes(feature.value)} onChange={()=>toggleFilter(feature.value)} className="accent-[#0c6478]"/>{feature.label}</label>)}</div></fieldset>
      <button disabled={status==='loading'} className="mt-4 h-11 w-full rounded-xl bg-[#0c6478] text-[11px] font-extrabold text-white disabled:opacity-50">{status==='loading'?'Mencari data komunitas...':'Cari tempat ramah disabilitas'}</button>
    </form>
    {message&&<p role="status" className="mt-3 rounded-xl bg-[#f8fafc] p-3 text-[9px] font-semibold leading-4 text-[#475467]">{message}</p>}
    <div className="mt-4 space-y-3">{results.map(place=><article key={place.id} className="rounded-[16px] border-2 border-[#edf0f2] p-3">{place.latestPhotoUrl&&<Image unoptimized width={280} height={120} src={place.latestPhotoUrl} alt={`Foto ${place.name}`} className="mb-3 h-24 w-full rounded-xl object-cover"/>}<div className="flex items-start gap-2"><div className="min-w-0 flex-1"><b className="block text-[12px]">{place.name}</b><p className="mt-1 text-[9px] leading-4 text-[#667085]">{place.address}</p></div><span className="rounded-full bg-[#effaf8] px-2 py-1 text-[9px] font-extrabold text-[#0c6478]">Akses {place.accessibilityRating ?? '—'}/5</span></div><div className="mt-2 flex flex-wrap gap-1">{place.features.map(feature=><span key={feature} className="rounded-full bg-[#f2f4f7] px-2 py-1 text-[8px] font-semibold text-[#475467]">{featureLabel(feature)}</span>)}</div><p className="mt-2 text-[8px] text-[#98a2b3]">Berdasarkan {place.evidenceCount} pengalaman komunitas</p><button onClick={()=>onChoose(place)} className="mt-3 h-9 w-full rounded-xl bg-[#173c61] text-[10px] font-bold text-white">Lihat detail & cari rute</button></article>)}</div>
  </div></SideShell>;
}

function RouteHistoryPanel({ session, onClose, onLogin }) {
  const [history, setHistory] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!session) return undefined;
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      try { const rows = await apiRequest("/users/me/route-history"); if (!cancelled) setHistory(rows); }
      catch (error) { if (!cancelled) setMessage(error instanceof Error ? error.message : "Riwayat gagal dimuat."); }
    }, 0);
    return () => { cancelled = true; window.clearTimeout(timer); };
  }, [session]);

  return <SideShell title="Riwayat Perjalanan" icon={<History className="size-5"/>} onClose={onClose}><div className="mt-5">
    {!session&&<div className="rounded-[16px] bg-[#fff7ed] p-4"><b className="text-[11px] text-[#9a3412]">Masuk untuk menyimpan perjalanan</b><p className="mt-1 text-[9px] leading-4 text-[#667085]">Riwayat menyimpan rute yang benar-benar kamu mulai.</p><button onClick={onLogin} className="mt-3 rounded-xl bg-[#0c6478] px-4 py-2.5 text-[10px] font-bold text-white">Masuk</button></div>}
    {session&&history.length===0&&<p className="rounded-[15px] bg-[#f8fafc] p-4 text-[10px] text-[#667085]">{message||"Belum ada riwayat. Mulai navigasi sebuah rute agar tersimpan di sini."}</p>}
    <div className="space-y-3">{history.map(item=>{const route=item.chosenRouteJson||{};const open=selectedId===item.id;return <article key={item.id} className="rounded-[16px] border-2 border-[#edf0f2] p-3"><button onClick={()=>setSelectedId(open?null:item.id)} className="w-full text-left"><div className="flex items-start gap-2"><span className="grid size-9 shrink-0 place-items-center rounded-full bg-[#effaf8] text-[#0c6478]"><Route className="size-4"/></span><div className="min-w-0 flex-1"><b className="block truncate text-[11px]">{route.destinationName||"Tujuan tersimpan"}</b><p className="mt-1 text-[9px] text-[#667085]">Rute {route.id||"—"} · {route.time||"Waktu tidak tersedia"} · {route.distance||"Jarak tidak tersedia"}</p><small className="mt-1 block text-[8px] text-[#98a2b3]">{new Date(item.createdAt).toLocaleString("id-ID")}</small></div><ChevronLeft className={`size-4 text-[#98a2b3] transition ${open?'-rotate-90':'rotate-180'}`}/></div></button>{open&&<div className="mt-3 border-t border-[#edf0f2] pt-3"><div className="grid grid-cols-2 gap-2"><div className="rounded-xl bg-[#effaf8] p-2"><small className="text-[8px] text-[#667085]">Mode</small><b className="block text-[10px]">{modes.find(mode=>profileModeMap[mode.id]===item.mode)?.label||item.mode}</b></div><div className="rounded-xl bg-[#fff7ed] p-2"><small className="text-[8px] text-[#667085]">Skor akses</small><b className="block text-[10px]">{Number.isFinite(route.score)?`${route.score}/100`:'Data belum cukup'}</b></div></div><p className="mt-3 text-[9px] font-bold text-[#475467]">Langkah perjalanan</p><ol className="mt-2 space-y-2">{(route.steps||[]).map((step,index)=><li key={`${step.instruction}-${index}`} className="flex gap-2 text-[9px] leading-4 text-[#667085]"><span className="grid size-5 shrink-0 place-items-center rounded-full bg-[#0c6478] text-[8px] font-bold text-white">{index+1}</span>{step.instruction} ({step.distance})</li>)}</ol></div>}</article>})}</div>
  </div></SideShell>;
}

function SpeechNavigation({ route, destination, onStop }) {
  const steps = useMemo(() => route.steps?.length ? route.steps : [{ instruction: `Tiba di ${destination}`, distance: route.distance }], [destination, route.distance, route.steps]);
  const [stepIndex, setStepIndex] = useState(0);
  const [voiceOn, setVoiceOn] = useState(true);
  const supported = typeof window !== "undefined" && "speechSynthesis" in window;

  const speak = useCallback((index) => {
    if (!supported || !voiceOn) return;
    window.speechSynthesis.cancel();
    const step = steps[index];
    const utterance = new SpeechSynthesisUtterance(`${step.instruction}. Jarak ${step.distance}.`);
    utterance.lang = "id-ID"; utterance.rate = 0.92;
    window.speechSynthesis.speak(utterance);
  }, [steps, supported, voiceOn]);

  useEffect(() => { const timer=window.setTimeout(()=>speak(stepIndex),0); return()=>{window.clearTimeout(timer);window.speechSynthesis?.cancel();}; }, [speak, stepIndex]);

  function stop() { window.speechSynthesis?.cancel(); onStop(); }
  function move(next) { setStepIndex(Math.max(0, Math.min(steps.length-1, next))); }

  return <MotionSurface role="region" aria-label="Navigasi suara" direction="up" distance={20} scale={0.96} className="absolute bottom-4 left-1/2 z-50 w-[min(560px,calc(100%-24px))] -translate-x-1/2 rounded-[20px] bg-[#173c61] p-4 text-white shadow-2xl"><div className="flex items-start gap-3"><span className="grid size-11 shrink-0 place-items-center rounded-full bg-[#35cbb0]"><Volume2 className="size-5"/></span><div className="min-w-0 flex-1"><p className="text-[9px] font-bold tracking-[.12em] text-[#7be3dc]">LANGKAH {stepIndex+1} DARI {steps.length}</p><b aria-live="polite" className="mt-1 block text-[13px] leading-5">{steps[stepIndex].instruction}</b><p className="mt-1 text-[10px] text-white/65">{steps[stepIndex].distance} · menuju {destination}</p></div><button onClick={stop} aria-label="Hentikan navigasi" className="grid size-9 place-items-center rounded-full bg-white/10"><X className="size-4"/></button></div>{!supported&&<p className="mt-3 rounded-xl bg-white/10 p-2 text-[9px]">Browser ini belum mendukung pembacaan suara, tetapi instruksi teks tetap dapat digunakan.</p>}<div className="mt-3 grid grid-cols-4 gap-2"><button disabled={stepIndex===0} onClick={()=>move(stepIndex-1)} className="rounded-xl bg-white/10 py-2 text-[9px] font-bold disabled:opacity-30">Sebelumnya</button><button onClick={()=>{setVoiceOn(value=>!value);window.speechSynthesis?.cancel();}} className="grid place-items-center rounded-xl bg-white/10 py-2" aria-label={voiceOn?"Matikan suara":"Aktifkan suara"}>{voiceOn?<Volume2 className="size-4"/>:<VolumeX className="size-4"/>}</button><button onClick={()=>speak(stepIndex)} className="grid place-items-center rounded-xl bg-white/10 py-2" aria-label="Ulangi instruksi"><Play className="size-4"/></button><button disabled={stepIndex===steps.length-1} onClick={()=>move(stepIndex+1)} className="rounded-xl bg-[#35cbb0] py-2 text-[9px] font-extrabold text-[#173c61] disabled:opacity-30">Berikutnya</button></div></MotionSurface>;
}

const reportTypes = [
  { value: "POTHOLE", label: "Trotoar/Jalan Rusak" },
  { value: "FLOOD", label: "Genangan Air" },
  { value: "STAIRS", label: "Tangga Menghalangi" },
  { value: "PARKED_VEHICLE", label: "Jalur Tertutup Kendaraan" },
  { value: "CONSTRUCTION", label: "Pekerjaan Konstruksi" },
  { value: "FALLEN_TREE", label: "Pohon Tumbang" },
];

const reportStatus = {
  UNVERIFIED: { label: "Menunggu verifikasi", tone: "bg-[#fef3c6] text-[#a34b00]" },
  VERIFIED: { label: "Terverifikasi", tone: "bg-[#cbfbf1] text-[#06705f]" },
  REJECTED: { label: "Ditolak", tone: "bg-[#fee2e2] text-[#b42318]" },
  NEEDS_RECHECK: { label: "Perlu diperiksa", tone: "bg-[#ede9fe] text-[#6d28d9]" },
};

function ReportPanel({ reports, coordinates, setCoordinates, session, onSubmitted, onClose }) {
  const [tab, setTab] = useState("create");
  const [type, setType] = useState("POTHOLE");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [selectedHistoryId, setSelectedHistoryId] = useState(null);

  async function useCurrentLocation() {
    setMessage("");
    try { setCoordinates(await currentCoordinates()); }
    catch (error) { setMessage(error instanceof Error ? error.message : "Lokasi tidak tersedia."); }
  }

  async function submit(event) {
    event.preventDefault();
    if (!coordinates) return setMessage("Pilih titik laporan di peta atau gunakan lokasi perangkat.");
    if (!photo) return setMessage("Foto kondisi wajib ditambahkan.");
    setBusy(true);
    setMessage("");
    try {
      const form = new FormData();
      form.append("title", title);
      form.append("type", type);
      form.append("status", "TEMPORARY");
      form.append("geometry", JSON.stringify({ type: "Point", coordinates }));
      form.append("description", description);
      form.append("photo", photo);
      const created = await apiRequest("/obstacles", { method: "POST", body: form });
      if (!session && created.report?.guestAccessKey) {
        const stored = JSON.parse(localStorage.getItem("akseskota-guest-report-keys") || "[]");
        localStorage.setItem("akseskota-guest-report-keys", JSON.stringify([created.report.guestAccessKey, ...stored.filter((key)=>key!==created.report.guestAccessKey)].slice(0, 50)));
      }
      setTitle("");
      setDescription("");
      setPhoto(null);
      setPhotoPreview("");
      setCoordinates(null);
      await onSubmitted(created.report);
      setTab("history");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Laporan gagal dikirim.");
    } finally {
      setBusy(false);
    }
  }

  function choosePhoto(event) {
    const file = event.target.files?.[0] || null;
    setPhoto(file);
    setPhotoPreview("");
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setPhotoPreview(typeof reader.result === "string" ? reader.result : "");
    reader.readAsDataURL(file);
  }

  return <SideShell title="Laporan" icon={<Flag className="size-5" />} onClose={onClose}>
    <div className="mt-5 grid grid-cols-2 rounded-[20px] bg-[#f0f3f4] p-1 sm:mt-4 sm:rounded-[15px]"><button onClick={()=>setTab("create")} className={`rounded-[17px] py-3 text-[14px] font-bold sm:rounded-xl sm:py-2.5 sm:text-[11px] ${tab==='create'?'bg-white text-[#0c6478] shadow-sm':'text-[#99a1af]'}`}>Buat Laporan</button><button onClick={()=>setTab("history")} className={`rounded-[17px] py-3 text-[14px] font-bold sm:rounded-xl sm:py-2.5 sm:text-[11px] ${tab==='history'?'bg-white text-[#0c6478] shadow-sm':'text-[#99a1af]'}`}>Riwayat</button></div>
    {tab === "create" ? <form onSubmit={submit} className="mt-6 sm:mt-5">
      {!session && <div className="mb-4 rounded-[15px] bg-[#effaf8] p-4 text-[11px] font-semibold leading-5 text-[#0c6478]">Kamu sedang melapor sebagai guest. Laporan tetap masuk database dan dapat dimoderasi. Riwayat guest tersimpan di perangkat ini.</div>}
      <p className="text-[10px] font-extrabold tracking-[.1em] text-[#99a1af]">TITIK LAPORAN</p>
      <div className="mt-2 rounded-[15px] border-2 border-[#f0f1f3] bg-[#fafbfc] p-3"><p className="text-[10px] font-semibold text-[#667085]">{coordinates ? `${coordinates[1].toFixed(6)}, ${coordinates[0].toFixed(6)}` : "Klik lokasi pada peta atau gunakan GPS."}</p><button type="button" onClick={useCurrentLocation} className="mt-2 rounded-full bg-[#effaf8] px-3 py-2 text-[10px] font-bold text-[#0c6478]"><Navigation className="mr-1 inline size-3" />Gunakan lokasi saya</button></div>
      <p className="mt-5 text-[10px] font-extrabold tracking-[.1em] text-[#99a1af]">JENIS HAMBATAN</p>
      <div className="mt-2 flex flex-wrap gap-2">{reportTypes.map(item=><button type="button" onClick={()=>setType(item.value)} key={item.value} className={`rounded-full px-3 py-2 text-[10px] font-bold ${type===item.value?'bg-[#0c6478] text-white':'bg-[#f3f4f6] text-[#6b7280]'}`}>{item.label}</button>)}</div>
      <label className="mt-5 block text-[10px] font-extrabold tracking-[.1em] text-[#99a1af]">JUDUL LAPORAN<input required minLength={4} maxLength={100} value={title} onChange={event=>setTitle(event.target.value)} placeholder="Contoh: Trotoar berlubang dekat halte" className="mt-2 h-12 w-full rounded-[15px] border-2 border-[#f0f1f3] bg-[#fafbfc] px-4 text-[11px] font-semibold outline-none"/><small className="mt-1.5 block normal-case tracking-normal text-[#98a2b3]">Tulis masalah utama dan patokan lokasinya.</small></label>
      <label className="mt-5 block text-[10px] font-extrabold tracking-[.1em] text-[#99a1af]">DESKRIPSI<textarea required maxLength={1000} value={description} onChange={event=>setDescription(event.target.value)} placeholder="Contoh: Lubang berada di sisi kiri trotoar, cukup dalam, dan kursi roda harus turun ke jalan untuk melewatinya." className="mt-2 h-24 w-full resize-none rounded-[15px] border-2 border-[#f0f1f3] bg-[#fafbfc] p-4 text-[11px] outline-none" /><small className="mt-1.5 block normal-case leading-4 tracking-normal text-[#98a2b3]">Jelaskan posisi tepat, ukuran/kondisi, dan dampaknya bagi pengguna.</small></label>
      <label className="mt-5 grid min-h-24 cursor-pointer place-items-center overflow-hidden rounded-[15px] border-2 border-dashed border-[#dde3e7] p-3 text-center text-[10px] text-[#8b96a5]"><input type="file" accept="image/jpeg,image/png,image/webp" required onChange={choosePhoto} className="sr-only" />{photoPreview?<span className="w-full"><Image unoptimized width={280} height={150} src={photoPreview} alt="Preview foto laporan" className="mx-auto h-32 w-full rounded-xl object-cover"/><b className="mt-2 block truncate text-[#0c6478]">{photo?.name}</b><small>Klik untuk mengganti foto</small></span>:<span><Camera className="mx-auto mb-2 size-5" />Tambah foto kondisi (wajib)<small className="mt-1 block">JPG, PNG, atau WEBP · maksimal 5 MB</small></span>}</label>
      {message && <p role="alert" className="mt-3 rounded-xl bg-[#fff1f2] px-3 py-2.5 text-[10px] font-semibold text-[#b42318]">{message}</p>}
      <button disabled={busy} className="mt-4 h-13 w-full rounded-[15px] bg-[#0c6478] text-[12px] font-extrabold text-white shadow-lg disabled:cursor-wait disabled:opacity-50">{busy ? "Mengunggah ke Cloudinary..." : "Kirim Laporan"}</button>
    </form> : <div className="mt-5"><p className="text-[10px] font-extrabold tracking-[.1em] text-[#99a1af]">LAPORAN YANG KAMU KIRIM</p><div className="mt-3 space-y-3">{reports.length === 0 && <p className="rounded-[15px] bg-[#f8fafc] p-4 text-[11px] text-[#667085]">Belum ada laporan dari {session ? "akun ini" : "guest pada perangkat ini"}.</p>}{reports.map(report=>{const status=reportStatus[report.verificationStatus]||reportStatus.UNVERIFIED;const open=selectedHistoryId===report.id;return <article key={report.id} className="rounded-[16px] border-2 border-[#f0f1f3] p-3"><Image unoptimized width={280} height={140} src={report.photoUrl} alt="Bukti laporan" className={`${open?'h-44':'h-28'} w-full rounded-xl object-cover transition-all`}/><div className="mt-3 flex items-start gap-2"><div className="min-w-0 flex-1"><b className="block truncate text-[11px]">{report.title || "Laporan hambatan"}</b><p className={`mt-1 text-[9px] leading-4 text-[#667085] ${open?'':'line-clamp-2'}`}>{report.description}</p><p className="mt-1 text-[9px] text-[#99a1af]">{new Date(report.createdAt).toLocaleString("id-ID")}</p></div><span className={`shrink-0 rounded-full px-2 py-1.5 text-[8px] font-bold ${status.tone}`}>{status.label}</span></div>{open&&<div className="mt-3 grid grid-cols-2 gap-2 border-t border-[#edf0f2] pt-3 text-[9px]"><div className="rounded-xl bg-[#f8fafc] p-2"><small className="text-[#98a2b3]">Jenis data</small><b className="mt-1 block">{report.targetType||report.obstacle?.type||'Hambatan'}</b></div><div className="rounded-xl bg-[#effaf8] p-2"><small className="text-[#667085]">Status</small><b className="mt-1 block text-[#0c6478]">{status.label}</b></div></div>}<button type="button" onClick={()=>setSelectedHistoryId(open?null:report.id)} className="mt-3 w-full rounded-xl bg-[#f2f4f7] py-2 text-[9px] font-bold text-[#475467]">{open?'Tutup detail':'Lihat detail riwayat'}</button></article>})}</div></div>}
  </SideShell>;
}

function CommunityVerificationPanel({ reportId, session, onClose, onUpdated, onLogin }) {
  const [report, setReport] = useState(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const loadReport = useCallback(async () => {
    try { setReport(await apiRequest(`/reports/${reportId}`)); }
    catch (error) { setMessage(error instanceof Error ? error.message : "Laporan gagal dimuat."); }
  }, [reportId]);

  useEffect(() => {
    const timer = window.setTimeout(loadReport, 0);
    return () => window.clearTimeout(timer);
  }, [loadReport]);

  async function verify(action) {
    if (!session) return onLogin();
    setBusy(true);
    setMessage("");
    try {
      const result = await apiRequest(`/reports/${reportId}/verify`, { method: "POST", body: JSON.stringify({ action }) });
      setMessage(result.consensus.status === "VERIFIED" ? "Laporan mencapai ambang komunitas dan sudah terverifikasi." : `Verifikasi tersimpan. Dibutuhkan ${result.consensus.threshold} verifikasi unik.`);
      await loadReport();
      await onUpdated();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Verifikasi gagal disimpan.");
    } finally { setBusy(false); }
  }

  const voteCount = report?.verifications?.filter((item)=>item.action==='VERIFIED').length || 0;
  return <SideShell title="Verifikasi Komunitas" icon={<ShieldCheck className="size-5"/>} onClose={onClose}>{!report?<div className="mt-6 h-52 animate-pulse rounded-[18px] bg-[#eef2f3]"/>:<div className="mt-5"><Image unoptimized width={320} height={180} src={report.photoUrl} alt="Foto laporan warga" className="h-44 w-full rounded-[16px] object-cover"/><span className="mt-4 inline-block rounded-full bg-[#fff7ed] px-3 py-1.5 text-[9px] font-bold text-[#a34b00]">{report.verificationStatus}</span><h2 className="mt-3 text-[16px] font-extrabold">{report.title}</h2><p className="mt-2 text-[11px] leading-5 text-[#667085]">{report.description}</p><div className="mt-4 rounded-[15px] bg-[#effaf8] p-4"><b className="text-[11px] text-[#0c6478]">{voteCount}/3 verifikasi komunitas</b><p className="mt-1 text-[9px] leading-4 text-[#667085]">Setiap akun hanya memiliki satu suara dan pelapor tidak dapat memverifikasi laporannya sendiri.</p></div>{!session&&<p className="mt-4 rounded-xl bg-[#fff7ed] p-3 text-[10px] font-semibold text-[#9a3412]">Masuk diperlukan untuk verifikasi. Guest tetap dapat melihat laporan.</p>} {message&&<p className="mt-3 rounded-xl bg-[#f8fafc] p-3 text-[10px] font-semibold text-[#475467]">{message}</p>}<div className="mt-4 grid grid-cols-2 gap-2"><button disabled={busy} onClick={()=>verify('VERIFIED')} className="rounded-xl bg-[#0c6478] py-3 text-[10px] font-extrabold text-white disabled:opacity-50">✓ Kondisi benar</button><button disabled={busy} onClick={()=>verify('NEEDS_RECHECK')} className="rounded-xl bg-[#ede9fe] py-3 text-[10px] font-extrabold text-[#6d28d9] disabled:opacity-50">Perlu cek ulang</button></div></div>}</SideShell>;
}

function ProfilePanel({ profile, session, onClose, onLogout, onModerate }) {
  const mode=modes.find(m=>m.id===profile);
  return <SideShell title="Profil Saya" icon={<UserRound className="size-5" />} onClose={onClose}><div className="mt-5 flex items-center rounded-[18px] bg-gradient-to-r from-[#0c7181] to-[#173c61] p-5 text-white"><span className="grid size-16 place-items-center rounded-[16px] bg-white/20 text-2xl">?</span><div className="ml-4"><b className="text-[17px]">{session?.user?.name || "Tamu"}</b><p className="mt-1 text-[11px] text-[#7be3dc]">{session?.user?.role || "Mode tamu"}</p></div></div><div className="mt-5 flex items-center rounded-[16px] border-2 border-[#f0f1f3] p-4"><span className="text-xl">{mode.icon}</span><div className="ml-3"><small className="text-[9px] font-bold text-[#99a1af]">MODE PERJALANAN</small><b className="block text-[13px]">{mode.label}</b></div><span className="ml-auto rounded-full bg-[#effaf8] px-3 py-2 text-[9px] font-bold text-[#0c6478]">Aktif</span></div>{['MODERATOR','ADMIN'].includes(session?.user?.role)&&<button onClick={onModerate} className="mt-5 flex h-14 w-full items-center justify-center gap-2 rounded-[16px] bg-[#0c6478] text-[12px] font-extrabold text-white"><ShieldCheck className="size-4" />Moderasi Laporan</button>}<button onClick={onLogout} className="mt-5 flex h-14 w-full items-center justify-center gap-2 rounded-[16px] border-2 border-[#fecaca] text-[12px] font-bold text-[#ff5a5f] transition hover:bg-[#fff5f5] active:scale-[.98]"><LogOut className="size-4" />{session ? "Keluar dari Akun" : "Masuk ke Akun"}</button></SideShell>;
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

function currentCoordinates() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) return reject(new Error("Browser ini tidak mendukung lokasi perangkat."));
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => resolve([coords.longitude, coords.latitude]),
      () => reject(new Error("Izinkan akses lokasi agar titik awal memakai posisi kamu.")),
      { enableHighAccuracy: true, timeout: 7000, maximumAge: 60_000 },
    );
  });
}

export default function NavigationDashboard({ initialProfile="walking" }) {
  const router=useRouter(); const [profile,setProfile]=useState(initialProfile); const [panel,setPanel]=useState(null); const [selected,setSelected]=useState("A"); const [detail,setDetail]=useState("A"); const [origin,setOrigin]=useState("Lokasi saya"); const [originSelection,setOriginSelection]=useState(null); const [destination,setDestination]=useState(""); const [destinationSelection,setDestinationSelection]=useState(null); const [session,setSession]=useState(null); const [mapReports,setMapReports]=useState([]); const [userReports,setUserReports]=useState([]); const [reportDraft,setReportDraft]=useState(null); const [selectedReportId,setSelectedReportId]=useState(null); const [navigating,setNavigating]=useState(false); const [routeOptions,setRouteOptions]=useState([]); const [routingStatus,setRoutingStatus]=useState("idle"); const [routeError,setRouteError]=useState(""); const [originCoordinates,setOriginCoordinates]=useState(null); const [destinationCoordinates,setDestinationCoordinates]=useState(null); const [resolvedDestination,setResolvedDestination]=useState("Tujuan"); const mode=modes.find(m=>m.id===profile)||modes[4]; const activeRoute=routeOptions.find(r=>r.id===detail)||routeOptions[0];
  function changeMode(id){setProfile(id);localStorage.setItem("akseskota-profile",id);setPanel(null);}

  const searchRoutes = useCallback(async (openPanel = true) => {
    if (openPanel) setPanel("routes");
    setRoutingStatus("loading");
    setRouteError("");
    try {
      if (!destination.trim()) throw new Error("Isi lokasi tujuan terlebih dahulu.");
      const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
      if (!token) throw new Error("Token Mapbox belum diatur.");
      const start = origin.trim().toLowerCase() === "lokasi saya"
        ? await currentCoordinates()
        : originSelection?.name === origin
          ? originSelection.coordinates
          : (await geocodeMapboxPlace(origin, token)).coordinates;
      const destinationResult = destinationSelection?.name === destination
        ? destinationSelection
        : await geocodeMapboxPlace(destination, token, start);
      if (!isInsideBogor(start)) throw new Error("Titik awal berada di luar Kota Bogor. Ketik lokasi awal di Kota Bogor.");
      if (!isInsideBogor(destinationResult.coordinates)) throw new Error("Tujuan berada di luar Kota Bogor.");
      const calculatedRoutes = await requestMapboxWalkingRoutes(start, destinationResult.coordinates, token);
      let evaluatedRoutes = calculatedRoutes;
      try {
        const profileMode = profileModeMap[profile] || "GENERAL";
        const evaluations = await apiRequest("/routes/evaluate", {
          method: "POST",
          body: JSON.stringify({
            mode: profileMode,
            routes: calculatedRoutes.map((route) => ({ id: route.id, distanceMeters: route.distanceMeters, geometry: route.geometry })),
          }),
        });
        evaluatedRoutes = calculatedRoutes.map((route) => {
          const evaluation = evaluations.find((item) => item.id === route.id);
          if (!evaluation) return route;
          return {
            ...route,
            score: evaluation.accessibility,
            shade: evaluation.shade,
            comfort: evaluation.comfort,
            dataCoverage: evaluation.dataCoverage,
            blocked: evaluation.blocked,
            evaluationReasons: evaluation.reasons,
            badge: evaluation.blocked ? "Tidak sesuai profil" : evaluation.labels[0] || (evaluation.dataStatus === "CUKUP" ? route.badge : "Data komunitas belum cukup"),
          };
        });
      } catch {
        evaluatedRoutes = calculatedRoutes.map((route) => ({ ...route, badge: "Data komunitas belum tersedia", dataCoverage: 0 }));
      }
      setOriginCoordinates(start);
      setDestinationCoordinates(destinationResult.coordinates);
      setResolvedDestination(destinationResult.name);
      setRouteOptions(evaluatedRoutes);
      const firstUsable = evaluatedRoutes.find((route) => !route.blocked) || evaluatedRoutes[0];
      setSelected(firstUsable.id);
      setDetail(firstUsable.id);
      setRoutingStatus("ready");
    } catch (error) {
      setRouteOptions([]);
      setRouteError(error instanceof Error ? error.message : "Rute gagal dihitung.");
      setRoutingStatus("error");
    }
  }, [destination, destinationSelection, origin, originSelection, profile]);

  const refreshReports = useCallback(async () => {
    const storedSession = getStoredSession();
    setSession(storedSession);
    try { setMapReports(await apiRequest("/reports/map")); }
    catch { setMapReports([]); }
    if (!storedSession) {
      try {
        const keys = JSON.parse(localStorage.getItem("akseskota-guest-report-keys") || "[]");
        const results = await Promise.allSettled(keys.map((key) => apiRequest(`/reports/guest/${key}`)));
        setUserReports(results.filter((result) => result.status === "fulfilled").map((result) => result.value));
      } catch {
        setUserReports([]);
      }
      return;
    }
    try {
      const contributions = await apiRequest("/users/me/contributions");
      setUserReports(contributions.reports || []);
    } catch {
      setUserReports([]);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(refreshReports, 0);
    return () => window.clearTimeout(timer);
  }, [refreshReports]);

  useEffect(() => {
    const openReport = (event) => {
      if (!event.detail?.id) return;
      setSelectedReportId(event.detail.id);
      setPanel("verify-report");
    };
    window.addEventListener("akseskota:open-report", openReport);
    return () => window.removeEventListener("akseskota:open-report", openReport);
  }, []);

  async function beginNavigation() {
    if (!activeRoute || !originCoordinates || !destinationCoordinates) return;
    setNavigating(true);
    setPanel(null);
    if (!session) return;
    try {
      await apiRequest("/users/me/route-history", {
        method: "POST",
        body: JSON.stringify({
          originLat: originCoordinates[1], originLng: originCoordinates[0],
          destLat: destinationCoordinates[1], destLng: destinationCoordinates[0],
          mode: profileModeMap[profile] || "GENERAL",
          chosenRouteJson: {
            id: activeRoute.id,
            originName: origin,
            destinationName: resolvedDestination,
            distance: activeRoute.distance,
            time: activeRoute.time,
            score: activeRoute.score,
            shade: activeRoute.shade,
            dataCoverage: activeRoute.dataCoverage,
            badge: activeRoute.badge,
            steps: activeRoute.steps || [],
          },
        }),
      });
    } catch {
      // Navigasi tetap berjalan jika penyimpanan riwayat sedang tidak tersedia.
    }
  }

  useEffect(() => {
    let cancelled = false;
    async function locateUser() {
      try {
        const coordinates = await currentCoordinates();
        if (!cancelled) setOriginCoordinates(coordinates);
      } catch {
        // No marker or route is fabricated when location permission is denied.
      }
    }
    locateUser();
    return () => { cancelled = true; };
  }, []);

  return <main className={`relative h-dvh min-h-0 overflow-hidden bg-[#dfe5e8] sm:min-h-[620px] ${profile==='low-vision'?'contrast-[1.08]':''}`}><MapCanvas routes={routeOptions} reports={mapReports} activeRoute={selected||detail} origin={originCoordinates} destination={destinationCoordinates} reportDraft={reportDraft} onMapClick={panel==='report'?setReportDraft:null} highContrast={profile==='low-vision'} />{!['report','profile','verify-report','community-place','assistant','history'].includes(panel)&&<LeftRail onReport={()=>setPanel('report')} onAssistant={()=>setPanel('assistant')} onHistory={()=>setPanel('history')} onProfile={()=>setPanel('profile')} />}<SearchBox origin={origin} destination={destination} setOrigin={(value)=>{setOrigin(value);setOriginSelection(null);}} setDestination={(value)=>{setDestination(value);setDestinationSelection(null);}} originCoordinates={originCoordinates} onSelectOrigin={(place)=>{setOrigin(place.name);setOriginSelection(place);setOriginCoordinates(place.coordinates);}} onSelectDestination={(place)=>{setDestination(place.name);setDestinationSelection(place);setPanel('community-place');}} onSearch={()=>searchRoutes(true)} mode={mode} onMode={()=>setPanel(panel==='mode'?null:'mode')} loading={routingStatus==='loading'} />{!panel&&!navigating&&<MobileMapActions onSearch={()=>searchRoutes(true)} />}{panel==='mode'&&<ModePanel current={profile} onChange={changeMode} onClose={()=>setPanel(null)} />}{panel==='assistant'&&<AssistantPanel onClose={()=>setPanel(null)} onChoose={(place)=>{const selectedPlace={id:place.externalId,name:place.name,address:place.address,coordinates:place.coordinates};setDestination(place.name);setDestinationSelection(selectedPlace);setDestinationCoordinates(place.coordinates);setPanel('community-place');}}/>}{panel==='history'&&<RouteHistoryPanel session={session} onClose={()=>setPanel(null)} onLogin={()=>router.push('/masuk')}/>} {panel==='community-place'&&destinationSelection&&<CommunityPlacePanel place={destinationSelection} session={session} onRoute={()=>searchRoutes(true)} onClose={()=>setPanel(null)} onLogin={()=>router.push('/masuk')}/>} {panel==='routes'&&<RoutesPanel routes={routeOptions} destination={resolvedDestination} status={routingStatus} error={routeError} selected={selected} setSelected={setSelected} onDetail={id=>{setDetail(id);setSelected(id);setPanel('detail')}} onClose={()=>setPanel(null)} />}{panel==='detail'&&activeRoute&&<DetailPanel route={activeRoute} profile={profile} destination={resolvedDestination} destinationCoordinates={destinationCoordinates} onBack={()=>setPanel('routes')} onReport={()=>setPanel('report')} onNavigate={beginNavigation} />}{panel==='report'&&<ReportPanel reports={userReports} coordinates={reportDraft} setCoordinates={setReportDraft} session={session} onSubmitted={refreshReports} onClose={()=>{setReportDraft(null);setPanel(null)}} />}{panel==='verify-report'&&selectedReportId&&<CommunityVerificationPanel reportId={selectedReportId} session={session} onClose={()=>setPanel(null)} onUpdated={refreshReports} onLogin={()=>router.push('/masuk')} />}{panel==='profile'&&<ProfilePanel profile={profile} session={session} onClose={()=>setPanel(null)} onModerate={()=>router.push('/admin/laporan')} onLogout={()=>{clearSession();router.push('/masuk')}} />}{navigating&&activeRoute&&<SpeechNavigation route={activeRoute} destination={resolvedDestination} onStop={()=>setNavigating(false)}/>}</main>;
}
