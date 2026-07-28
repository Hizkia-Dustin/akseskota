"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import MotionSurface from "./react-bits/MotionSurface";
import MapboxMap from "./MapboxMap";
import { DirectoryPanel } from "./DirectoryPanels";
import DirectoryPlaceDetail from "./DirectoryPlaceDetail";
import { usePageTransition } from "./PageTransitionProvider";
import { geocodeMapboxPlace, isInsideBogor, openGoogleStreetView, requestMapboxWalkingRoutes, searchMapboxPlaces } from "../../lib/mapboxRouting";
import { apiRequest, clearSession, getStoredSession } from "../../lib/api";
import {
  AlertTriangle,
  Accessibility,
  Baby,
  Bot,
  Bookmark,
  BookOpen,
  Camera,
  Check,
  CheckCircle2,
  ChevronLeft,
  CircleHelp,
  Clock3,
  Flag,
  Footprints,
  History,
  Eye,
  LogOut,
  MapPin,
  Mic,
  Navigation,
  Play,
  Route,
  Send,
  Share2,
  ShieldCheck,
  SlidersHorizontal,
  Star,
  SunMedium,
  TreePine,
  UserRound,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";

const modes = [
  { id: "wheelchair", icon: Accessibility, label: "Kursi Roda", detail: "Utamakan ramp dan jalur bebas tangga" },
  { id: "elderly", icon: UserRound, label: "Lansia", detail: "Utamakan bangku dan jalur lebih landai" },
  { id: "stroller", icon: Baby, label: "Stroller", detail: "Utamakan trotoar lebar dan ramp" },
  { id: "low-vision", icon: Eye, label: "Low Vision", detail: "Utamakan guiding block dan penerangan" },
  { id: "walking", icon: Footprints, label: "Pejalan Kaki", detail: "Pertimbangkan kenyamanan jalur umum" },
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
  teal: { card: "bg-[#0c6478]", badge: "bg-white/12", ring: "border-white", accent: "text-[#0c6478]" },
  orange: { card: "bg-[#c66a12]", badge: "bg-white/12", ring: "border-white", accent: "text-[#c66a12]" },
  blue: { card: "bg-[#315fc4]", badge: "bg-white/12", ring: "border-white", accent: "text-[#315fc4]" },
};

function MapCanvas({ routes, reports, destinations, shadeSegments, heatEnabled, heatHour, weather, onDestinationSelect, activeRoute = "A", origin, destination, reportDraft, onMapClick, highContrast = false }) {
  return <MapboxMap routes={routes} reports={reports} destinations={destinations} shadeSegments={shadeSegments} heatEnabled={heatEnabled} heatHour={heatHour} weather={weather} onDestinationSelect={onDestinationSelect} activeRoute={activeRoute} origin={origin} destination={destination} reportDraft={reportDraft} onMapClick={onMapClick} highContrast={highContrast} />;
}

function ScoreRing({ score, color = "border-white" }) {
  if (!Number.isFinite(score)) return <span className={`grid size-12 place-items-center rounded-full border-2 px-1 text-center text-[7px] font-extrabold leading-3 ${color}`}>DATA<br/>BELUM<br/>CUKUP</span>;
  return <span className={`grid size-12 place-items-center rounded-full border-[3px] text-[14px] font-extrabold ${color}`}>{score}</span>;
}

function RouteCard({ route, active = false, onDetail, onSelect }) {
  const tone = routeTone[route.tone];
  if (!active) {
    return (
      <button data-route-card type="button" onClick={onSelect} className="flex w-full items-center rounded-[14px] border border-[#e6eaed] bg-white p-4 text-left transition-colors hover:border-[#9abdc4] hover:bg-[#f7fbfb] active:bg-[#eef7f6]">
        <span className="min-w-0 flex-1"><span className="block text-[12px] font-semibold text-[#99a1af]">{route.street}</span><span className={`mt-2 inline-block rounded-full px-2 py-1 text-[9px] font-extrabold ${route.blocked ? "bg-[#fee2e2] text-[#b42318]" : route.tone === "orange" ? "bg-[#fef3c6] text-[#a34b00]" : "bg-[#dbeafe] text-[#155dfc]"}`}>{route.badge}</span><span className="mt-3 flex flex-wrap gap-2 text-[10px] text-[#475467]"><b className="rounded-lg bg-white px-2 py-1.5">◷ {route.time}</b><b className="rounded-lg bg-white px-2 py-1.5">➤ {route.distance}</b>{Number.isFinite(route.shade)&&<b className="rounded-lg bg-white px-2 py-1.5">☂ Teduh {route.shade}</b>}</span></span><ScoreRing score={route.score} color={route.tone === "orange" ? "border-[#f59e0b] text-[#1f2937]" : "border-[#3b82f6] text-[#1f2937]"} />
      </button>
    );
  }
  return (
    <article data-route-card className={`rounded-[14px] p-5 text-white shadow-[0_8px_20px_rgba(20,50,75,.14)] ${tone.card}`}>
      <div className="flex"><div className="flex-1"><p className="text-[12px] text-white/65">{route.street}</p><span className={`mt-2 inline-block rounded-full px-2 py-1 text-[9px] font-extrabold ${tone.badge}`}>{route.badge}</span><div className="mt-3 flex flex-wrap gap-2 text-[10px]"><b className="rounded-lg bg-white/15 px-2 py-1.5"><Clock3 className="mr-1 inline size-3" />{route.time}</b><b className="rounded-lg bg-white/15 px-2 py-1.5"><Navigation className="mr-1 inline size-3" />{route.distance}</b>{Number.isFinite(route.shade)&&<b className="rounded-lg bg-white/15 px-2 py-1.5">☂ Teduh {route.shade}/100</b>}<b className="rounded-lg bg-white/15 px-2 py-1.5">Data {route.dataCoverage ?? 0}%</b>{route.algorithmRank&&<b className="rounded-lg bg-white/15 px-2 py-1.5">Dijkstra #{route.algorithmRank}</b>}</div></div><ScoreRing score={route.score} /></div>
      <div className="mt-4 grid grid-cols-[1fr_auto] gap-2"><button type="button" onClick={onDetail} className="rounded-lg bg-white py-2.5 text-[11px] font-extrabold text-[#0c6478] transition-colors hover:bg-[#f3f8f8]">Lihat detail</button><button type="button" onClick={onSelect} className="rounded-lg border border-white/25 px-4 text-[11px] font-bold transition-colors hover:bg-white/10">Tutup</button></div>
    </article>
  );
}

function PlaceSuggestions({ suggestions, error, label, onChoose }) {
  if (!suggestions.length && !error) return null;
  return <div role="listbox" aria-label={label} className="border-b border-[#edf0f2] bg-white py-1.5">{suggestions.map((place)=><button key={place.id} type="button" role="option" aria-selected="false" onClick={()=>onChoose(place)} className="flex w-full items-start gap-3 px-4 py-2.5 text-left transition hover:bg-[#effaf8]"><MapPin className="mt-0.5 size-4 shrink-0 text-[#0c6478]"/><span className="min-w-0"><b className="block truncate text-[11px] text-[#1f2937]">{place.name}</b><small className="mt-0.5 block truncate text-[9px] text-[#8b96a5]">{place.address}</small></span></button>)}{error&&<p className="px-4 py-3 text-[10px] font-semibold text-[#b42318]">{error}</p>}</div>;
}

function SearchBox({ origin, destination, setOrigin, setDestination, originCoordinates, onSelectOrigin, onSelectDestination, onSearch, mode, onMode, loading, preferShade, onToggleShade, shadeDataAvailable, onShowHeat, onReportShade }) {
  const ModeIcon = mode.icon;
  const [activeField, setActiveField] = useState(null);
  const [showShadeGuide, setShowShadeGuide] = useState(false);
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
    <div className="absolute left-4 right-4 top-[max(16px,env(safe-area-inset-top))] z-20 sm:left-[80px] sm:right-auto sm:top-3 sm:w-[340px] sm:max-w-[calc(100vw-92px)]">
      <div className="overflow-hidden rounded-[16px] border border-white/80 bg-white/95 shadow-[0_10px_28px_rgba(24,46,58,.15)] backdrop-blur-xl">
        <label className="relative z-10 flex h-[46px] items-center gap-3 border-b border-[#edf0f2] bg-white/95 px-4 sm:h-[52px]"><span className="size-2.5 shrink-0 rounded-full bg-[#0c6478]" /><input aria-label="Lokasi awal" autoComplete="off" placeholder="Cari titik awal" value={origin} onFocus={()=>setActiveField("origin")} onChange={(e) => updateOrigin(e.target.value)} onKeyDown={(event)=>{if(event.key==='Enter')onSearch();}} className="min-w-0 flex-1 bg-transparent text-[13px] font-semibold outline-none placeholder:font-normal placeholder:text-[#98a2b3] sm:text-[11px]" /><button type="button" onClick={()=>updateOrigin("")} aria-label="Hapus titik awal" className="grid size-7 shrink-0 place-items-center rounded-full transition hover:bg-[#f2f5f6]"><X className="size-3 text-[#b2bac5]" /></button></label>
        {activeField === "origin" && <PlaceSuggestions suggestions={originSuggestions} error={originSuggestionError} label="Saran titik awal" onChoose={chooseOrigin} />}
        <label className="relative z-10 flex h-[46px] items-center gap-3 border-b border-[#edf0f2] bg-white/95 px-4 sm:h-[52px]"><span className="size-2.5 shrink-0 rounded-full bg-[#f59e0b]" /><input aria-label="Tujuan" autoComplete="off" placeholder="Cari gedung, mal, jalan, atau kota" value={destination} onFocus={()=>setActiveField("destination")} onChange={(e) => updateDestination(e.target.value)} onKeyDown={(event)=>{if(event.key==='Enter')onSearch();}} className="min-w-0 flex-1 bg-transparent text-[13px] font-semibold outline-none placeholder:font-normal placeholder:text-[#98a2b3] sm:text-[11px]" /><button type="button" onClick={()=>updateDestination("")} aria-label="Hapus tujuan" className="grid size-7 shrink-0 place-items-center rounded-full transition hover:bg-[#f2f5f6]"><X className="size-3 text-[#b2bac5]" /></button></label>
        {activeField === "destination" && <PlaceSuggestions suggestions={destinationSuggestions} error={destinationSuggestionError} label="Saran tujuan" onChoose={chooseDestination} />}
        <button type="button" onClick={onSearch} disabled={loading} className="m-3.5 hidden h-[42px] w-[calc(100%-28px)] rounded-[12px] bg-[#0c6478] text-[11px] font-extrabold text-white shadow-[0_5px_14px_rgba(12,100,120,.18)] transition hover:-translate-y-0.5 hover:bg-[#09596a] active:translate-y-0 active:bg-[#084e5d] disabled:cursor-wait disabled:opacity-60 sm:block">{loading ? "Menghitung…" : "Cari rute"}</button>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <button type="button" onClick={onMode} className="flex h-11 min-w-0 items-center gap-2 rounded-[12px] border border-white/80 bg-white/95 px-3 text-[10px] font-bold text-[#0c6478] shadow-[0_7px_18px_rgba(24,46,58,.13)] backdrop-blur transition hover:-translate-y-0.5 hover:bg-[#f5fafa]"><ModeIcon className="size-4 shrink-0" /><span className="truncate">{mode.label}</span><span className="ml-auto text-[#98a2b3]">›</span></button>
        <button
          type="button"
          onClick={() => {
            if (shadeDataAvailable) onToggleShade();
            setShowShadeGuide((value) => !value);
          }}
          aria-expanded={showShadeGuide}
          aria-pressed={shadeDataAvailable ? preferShade : undefined}
          className={`flex h-11 min-w-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-[12px] border px-2.5 text-[10px] font-extrabold shadow-[0_7px_18px_rgba(24,46,58,.13)] backdrop-blur transition hover:-translate-y-0.5 ${preferShade ? "border-[#22a06b] bg-[#e9f8ef] text-[#087443]" : "border-white/80 bg-white/95 text-[#52616b] hover:bg-[#f5fafa]"}`}
        >
          <TreePine className="size-4" />
          Rute teduh
          <CircleHelp className="size-3 text-[#98a2b3]" />
        </button>
      </div>
      {showShadeGuide && (
        <MotionSurface direction="down" distance={10} className="mt-4 overflow-hidden rounded-[18px] border border-white/80 bg-white/95 shadow-[0_12px_30px_rgba(24,46,58,.17)] backdrop-blur-xl">
          <div className="bg-gradient-to-r from-[#e8f7ef] to-[#effaf8] p-3.5">
            <div className="flex items-start gap-2.5">
              <span className="grid size-8 shrink-0 place-items-center rounded-[10px] bg-white text-[#087443] shadow-sm"><TreePine className="size-4" /></span>
              <div>
                <p className="text-[11px] font-extrabold text-[#173c32]">Jalur lebih teduh</p>
                <p className="mt-1 text-[8px] leading-4 text-[#557068]">Membandingkan naungan pohon pada setiap ruas agar perjalanan tidak terlalu terpapar matahari.</p>
              </div>
            </div>
          </div>
          {shadeDataAvailable ? (
            <div className="p-3.5">
              <span className="inline-flex items-center gap-1 rounded-full bg-[#e9f8ef] px-2 py-1 text-[8px] font-extrabold text-[#087443]"><Check className="size-3" />Data tersedia</span>
              <ol className="mt-3 space-y-2 text-[8px] font-semibold leading-4 text-[#52616b]">
                <li><b className="mr-2 text-[#0c6478]">1.</b>Aktifkan Rute teduh.</li>
                <li><b className="mr-2 text-[#0c6478]">2.</b>Isi tujuan lalu tekan Cari rute.</li>
                <li><b className="mr-2 text-[#0c6478]">3.</b>Pilih rute dengan nilai teduh tertinggi.</li>
              </ol>
            </div>
          ) : (
            <div className="p-3.5">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#fff4df] px-2 py-1 text-[8px] font-extrabold text-[#9a5707]"><span className="size-1.5 rounded-full bg-[#f59e0b]" />Sedang mengumpulkan data</span>
              <p className="mt-2 text-[8px] leading-4 text-[#667085]">Belum cukup observasi ruas untuk menentukan rute yang benar-benar teduh. Rute tidak akan diberi nilai teduh palsu.</p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <button type="button" onClick={() => { onShowHeat(); setShowShadeGuide(false); }} className="rounded-[10px] bg-[#fff7e8] px-2 py-2.5 text-[8px] font-extrabold text-[#a34b00]"><SunMedium className="mr-1 inline size-3" />Lihat estimasi panas</button>
                <button type="button" onClick={() => { onReportShade(); setShowShadeGuide(false); }} className="rounded-[10px] bg-[#0c6478] px-2 py-2.5 text-[8px] font-extrabold text-white"><Flag className="mr-1 inline size-3" />Laporkan ruas</button>
              </div>
            </div>
          )}
        </MotionSurface>
      )}
    </div>
  );
}

function MapLayerControls({ destinationCount, onDirectory, heatEnabled, setHeatEnabled, heatHour, setHeatHour, weather, shadeDataAvailable }) {
  const hourLabel = `${String(heatHour).padStart(2, "0")}:00`;
  return (
    <div className="absolute left-4 right-4 top-[188px] z-30 flex max-w-[calc(100vw-32px)] flex-col items-end gap-4 sm:left-auto sm:right-[76px] sm:top-3 sm:max-w-none sm:gap-3">
      <div className="grid w-full grid-cols-2 gap-3 sm:flex sm:w-auto sm:gap-2">
        <button type="button" onClick={onDirectory} className="flex h-11 min-w-0 items-center justify-center gap-2 rounded-[13px] border border-white/80 bg-white/95 px-3 text-[11px] font-extrabold text-[#0c6478] shadow-[0_9px_24px_rgba(23,60,97,.16)] backdrop-blur transition hover:-translate-y-0.5 hover:bg-[#effaf8] sm:px-4"><BookOpen className="size-4 shrink-0" /><span>Direktori</span><span className="rounded-full bg-[#e5f6f2] px-2 py-1 text-[9px]">{destinationCount || 0}</span></button>
        <button type="button" onClick={() => setHeatEnabled((value) => !value)} aria-pressed={heatEnabled} className={`flex h-11 min-w-0 items-center justify-center gap-2 rounded-[13px] border px-3 text-[11px] font-extrabold shadow-[0_9px_24px_rgba(23,60,97,.16)] backdrop-blur transition hover:-translate-y-0.5 sm:px-4 ${heatEnabled ? "border-[#f59e0b] bg-[#fff7e8] text-[#a34b00]" : "border-white/80 bg-white/95 text-[#0c6478]"}`}><SunMedium className="size-4 shrink-0" />Paparan panas</button>
      </div>
      {heatEnabled && (
        <MotionSurface direction="down" distance={12} className="w-full rounded-[16px] border border-white/80 bg-white/95 p-4 shadow-[0_14px_34px_rgba(23,60,97,.18)] backdrop-blur-xl sm:w-[300px]">
          <div className="flex items-center justify-between"><div><p className="text-[11px] font-extrabold text-[#172b3a]">Estimasi paparan panas</p><p className="mt-0.5 text-[9px] text-[#687784]">Bogor · {hourLabel}</p></div>{Number.isFinite(weather?.apparentTemperature) && <span className="rounded-full bg-[#fff1db] px-2.5 py-1 text-[10px] font-extrabold text-[#b45309]">Terasa {Math.round(weather.apparentTemperature)}°C</span>}</div>
          <input aria-label="Waktu estimasi paparan panas" type="range" min="6" max="18" step="1" value={heatHour} onChange={(event) => setHeatHour(Number(event.target.value))} className="mt-3 w-full accent-[#f59e0b]" />
          <div className="mt-1 flex justify-between text-[8px] font-bold text-[#8b96a5]"><span>06.00</span><span>12.00</span><span>18.00</span></div>
          <div className="mt-3 h-2.5 rounded-full bg-gradient-to-r from-[#22c55e] via-[#facc15] to-[#dc2626]" />
          <div className="mt-1 flex justify-between text-[8px] text-[#667085]"><span>Lebih sejuk</span><span>Lebih terpapar</span></div>
          <p className="mt-3 rounded-xl bg-[#f8fafc] p-2.5 text-[8px] leading-4 text-[#667085]">Estimasi berbasis jam, cuaca, kategori ruang hijau, dan observasi ruas. Bukan sensor suhu permukaan realtime.</p>
          {!shadeDataAvailable && <div className="mt-2 flex items-start gap-2 rounded-xl bg-[#fff7e8] p-2.5 text-[#8a4b08]"><TreePine className="mt-0.5 size-3 shrink-0" /><div><p className="text-[8px] font-extrabold">Rute teduh belum aktif di area ini</p><p className="mt-0.5 text-[8px] leading-4">Buka tombol Rute teduh untuk melihat cara kerja dan membantu melengkapi data.</p></div></div>}
        </MotionSurface>
      )}
    </div>
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
    <MotionSurface as="aside" direction="left" distance={30} scale={0.98} className="absolute inset-x-3 bottom-[max(12px,env(safe-area-inset-bottom))] z-40 overflow-hidden rounded-[24px] bg-white shadow-[0_-10px_30px_rgba(30,50,65,.2)] sm:bottom-3 sm:left-auto sm:right-3 sm:top-3 sm:w-[360px] sm:max-w-[calc(100vw-24px)] sm:rounded-[20px] sm:shadow-[0_14px_38px_rgba(30,50,65,.24)]">
      <div className="relative h-32 overflow-hidden bg-gradient-to-br from-[#d7f8f2] via-[#eaf9f6] to-[#dbeafe] sm:h-40">
        <div className="absolute -bottom-10 -left-8 size-40 rounded-full border-[22px] border-white/55" />
        <div className="absolute -right-6 -top-12 size-44 rounded-full border-[26px] border-[#35cbb0]/25" />
        <div className="absolute inset-x-0 bottom-0 flex h-20 items-end justify-center gap-2 opacity-65">
          {[44, 66, 52, 82, 58].map((height, index) => <span key={height + index} className="w-10 rounded-t-lg bg-[#0c6478]/25" style={{ height }} />)}
        </div>
        <span className="absolute left-1/2 top-1/2 grid size-14 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-4 border-white bg-[#f59e0b] text-white shadow-xl"><MapPin className="size-6" /></span>
        <button type="button" onClick={onClose} aria-label="Tutup detail lokasi" className="absolute right-3 top-3 grid size-9 place-items-center rounded-full bg-white/90 text-[#344054] shadow-md backdrop-blur"><X className="size-4" /></button>
        <span className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1.5 text-[9px] font-extrabold text-[#0c6478] shadow-sm">DATA LOKASI</span>
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

function LeftRail({ activePanel, onHome, onReport, onProfile, onAssistant, onHistory, onDestinations, destinationCount = 0 }) {
  const items = [
    { id: "directory", label: "Direktori", mobileLabel: "Direktori", detail: `${destinationCount || 0} tempat Bogor`, icon: BookOpen, action: onDestinations, featured: true },
    { id: "report", label: "Laporan", mobileLabel: "Lapor", detail: "Kondisi jalur", icon: Flag, action: onReport },
    { id: "assistant", label: "Asisten", mobileLabel: "Asisten", detail: "Bantuan perjalanan", icon: Bot, action: onAssistant },
    { id: "history", label: "Riwayat", mobileLabel: "Riwayat", detail: "Perjalanan tersimpan", icon: History, action: onHistory },
    { id: "profile", label: "Profil", mobileLabel: "Profil", detail: "Preferensi akses", icon: UserRound, action: onProfile },
  ];

  return (
    <>
      <MotionSurface
        as="aside"
        aria-label="Navigasi utama peta"
        direction="left"
        distance={18}
        duration={0.5}
        staggerSelector="[data-sidebar-item]"
        stagger={0.045}
        className="group/rail absolute inset-y-3 left-3 z-[60] hidden w-[56px] flex-col overflow-hidden rounded-[20px] border border-white/80 bg-white/95 p-[7px] shadow-[0_12px_34px_rgba(23,60,97,.14)] backdrop-blur-xl transition-[width,box-shadow] duration-300 ease-[cubic-bezier(.22,1,.36,1)] hover:w-[202px] hover:shadow-[0_18px_44px_rgba(23,60,97,.2)] focus-within:w-[202px] sm:flex motion-reduce:transition-none"
      >
        <button
          data-sidebar-item
          type="button"
          onClick={onHome}
          aria-label="Kembali ke peta"
          aria-current={!activePanel ? "page" : undefined}
          className={`group/home relative flex h-[42px] w-full shrink-0 items-center overflow-hidden rounded-[14px] text-left outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[#35cbb0] focus-visible:ring-offset-2 ${
            !activePanel
              ? "bg-gradient-to-br from-[#15a995] to-[#0c7f83] text-white shadow-[0_7px_18px_rgba(12,100,120,.25)]"
              : "bg-[#effaf8] text-[#0c6478] hover:bg-[#def3ef]"
          }`}
        >
          <span className="grid size-[42px] shrink-0 place-items-center">
            <MapPin className="size-[18px] transition-transform duration-300 group-hover/home:-translate-y-0.5 group-hover/home:scale-110 motion-reduce:transform-none" />
          </span>
          <span className="min-w-0 translate-x-2 whitespace-nowrap opacity-0 transition-all duration-300 group-hover/rail:translate-x-0 group-hover/rail:opacity-100 group-focus-within/rail:translate-x-0 group-focus-within/rail:opacity-100 motion-reduce:transition-none">
            <span className="block text-[11px] font-extrabold leading-tight">Peta utama</span>
            <span className={`block text-[8px] font-medium ${!activePanel ? "text-white/75" : "text-[#62818a]"}`}>Navigasi AksesKota</span>
          </span>
          {!activePanel && <span className="absolute right-2.5 size-1.5 rounded-full bg-[#a8ffe9] shadow-[0_0_0_4px_rgba(168,255,233,.16)]" />}
        </button>

        <span className="mx-1 my-2.5 h-px shrink-0 bg-[#e8eef0]" />

        <nav className="flex min-h-0 w-full flex-1 flex-col gap-1.5" aria-label="Fitur AksesKota">
          {items.map(({ id, label, detail, icon: Icon, action, featured }) => {
            const active = activePanel === id;
            return (
              <button
                data-sidebar-item
                key={id}
                type="button"
                onClick={action}
                aria-label={label}
                aria-current={active ? "page" : undefined}
                className={`group/item relative flex h-[43px] w-full shrink-0 items-center overflow-hidden rounded-[13px] text-left outline-none transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-[#35cbb0] ${
                  active
                    ? "bg-[#e5f6f2] text-[#0c6478]"
                    : featured
                      ? "bg-[#f2faf8] text-[#0c6478] hover:bg-[#def3ef]"
                      : "text-[#8996a4] hover:bg-[#f2f7f7] hover:text-[#173c61]"
                }`}
              >
                {active && (
                  <span className="absolute inset-y-2 left-0 w-[3px] rounded-r-full bg-[#15a995] shadow-[2px_0_8px_rgba(21,169,149,.35)]" />
                )}
                <span className="grid size-[42px] shrink-0 place-items-center">
                  <Icon
                    className={`size-[17px] transition-transform duration-300 group-hover/item:-translate-y-0.5 group-hover/item:scale-110 motion-reduce:transform-none ${
                      active ? "stroke-[2.4]" : ""
                    }`}
                  />
                </span>
                <span className="min-w-0 translate-x-2 whitespace-nowrap opacity-0 transition-all duration-300 group-hover/rail:translate-x-0 group-hover/rail:opacity-100 group-focus-within/rail:translate-x-0 group-focus-within/rail:opacity-100 motion-reduce:transition-none">
                  <span className="block text-[10px] font-extrabold leading-tight">{label}</span>
                  <span className="block text-[8px] font-medium text-[#7d8c98]">{detail}</span>
                </span>
                {active && (
                  <span className="absolute right-2.5 grid size-[16px] place-items-center rounded-full bg-white text-[#15a995] shadow-sm opacity-0 transition-opacity duration-300 group-hover/rail:opacity-100 group-focus-within/rail:opacity-100">
                    <span className="size-1.5 rounded-full bg-current" />
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div data-sidebar-item className="mt-2 flex h-[35px] shrink-0 items-center overflow-hidden rounded-[11px] bg-[#f6f9fa]">
          <span className="grid size-[42px] shrink-0 place-items-center">
            <span className="size-2 rounded-full bg-[#35cbb0] shadow-[0_0_0_4px_rgba(53,203,176,.13)]" />
          </span>
          <span className="translate-x-2 whitespace-nowrap text-[8px] font-bold text-[#66818a] opacity-0 transition-all duration-300 group-hover/rail:translate-x-0 group-hover/rail:opacity-100 group-focus-within/rail:translate-x-0 group-focus-within/rail:opacity-100">
            Layanan peta aktif
          </span>
        </div>
      </MotionSurface>

      <MotionSurface
        as="nav"
        aria-label="Navigasi utama peta"
        direction="up"
        distance={14}
        duration={0.45}
        staggerSelector="[data-mobile-nav-item]"
        stagger={0.04}
        className="absolute inset-x-4 bottom-[max(16px,env(safe-area-inset-bottom))] z-40 grid grid-cols-5 rounded-[20px] border border-white/80 bg-white/95 p-2 shadow-[0_12px_30px_rgba(24,46,58,.2)] backdrop-blur-xl sm:hidden"
      >
        {items.map(({ id, label, mobileLabel, icon: Icon, action }) => {
          const active = activePanel === id;
          return (
            <button
              data-mobile-nav-item
              key={id}
              type="button"
              onClick={action}
              aria-label={label}
              aria-current={active ? "page" : undefined}
              className={`group/mobile relative flex min-h-12 flex-col items-center justify-center gap-1 overflow-hidden rounded-[12px] text-[8px] font-bold outline-none transition-all duration-200 focus-visible:ring-2 focus-visible:ring-[#35cbb0] ${
                active ? "bg-[#e5f6f2] text-[#0c6478]" : "text-[#667085] active:scale-95"
              }`}
            >
              {active && <span className="absolute inset-x-3 top-0 h-[2px] rounded-full bg-[#15a995]" />}
              <Icon className={`size-[17px] transition-transform duration-300 ${active ? "-translate-y-0.5 scale-110 stroke-[2.4]" : "group-active/mobile:scale-90"} motion-reduce:transform-none`} />
              <span>{mobileLabel}</span>
            </button>
          );
        })}
      </MotionSurface>
    </>
  );
}

function ModePanel({ current, onChange, onClose }) {
  return (
    <aside className="absolute left-4 right-4 top-[184px] z-40 overflow-hidden rounded-[18px] border border-white/80 bg-white/95 shadow-[0_12px_30px_rgba(24,46,58,.17)] backdrop-blur-xl sm:left-[80px] sm:right-auto sm:top-[250px] sm:w-[340px]">
      <div className="flex items-center justify-between border-b border-[#edf0f2] px-4 py-3"><strong className="text-[12px]">Mode Perjalanan</strong><button onClick={onClose} aria-label="Tutup mode"><X className="size-4 text-[#9aa3af]" /></button></div>
      <div className="py-2">{modes.map((mode) => { const Icon = mode.icon; return <button data-mode-item key={mode.id} type="button" onClick={() => onChange(mode.id)} className={`flex w-full items-center px-4 py-2.5 text-left transition-colors hover:bg-[#f4f8f8] ${current === mode.id ? "bg-[#e8f5f3]" : ""}`}><span className="mr-3 grid size-8 place-items-center rounded-lg bg-white text-[#0c6478]"><Icon className="size-[17px]" /></span><span><b className="block text-[11px]">{mode.label}</b><small className="text-[9px] text-[#7b8491]">{mode.detail}</small></span>{current === mode.id && <CheckCircle2 className="ml-auto size-4 text-[#0c6478]" />}</button>; })}</div>
    </aside>
  );
}

function RoutesPanel({ routes, destination, status, error, selected, setSelected, onDetail, onClose }) {
  return (
    <aside data-lenis-prevent="true" className="app-scroll-region absolute inset-x-3 bottom-[max(12px,env(safe-area-inset-bottom))] z-40 max-h-[72dvh] overflow-y-auto rounded-[24px] border border-[#e7ebed] bg-white p-5 shadow-[0_-8px_26px_rgba(24,46,58,.14)] sm:bottom-3 sm:left-auto sm:right-3 sm:top-3 sm:max-h-none sm:w-[372px] sm:max-w-[calc(100vw-24px)] sm:rounded-[14px] sm:shadow-[0_10px_28px_rgba(24,46,58,.16)]">
      <div className="mx-auto mb-5 h-1 w-12 rounded-full bg-[#dfe3e7] sm:hidden" />
      <div className="flex items-start justify-between"><div><p className="text-[9px] font-extrabold uppercase tracking-[.12em] text-[#0c6478]">Pilihan perjalanan</p><h2 className="mt-1 text-[18px] font-extrabold sm:text-[20px]">{status === "loading" ? "Menghitung rute…" : `${routes.length} rute alternatif`}</h2><p className="mt-1 max-w-[260px] truncate text-[11px] text-[#7b8491]">Menuju <b className="text-[#344054]">{destination}</b></p></div><button onClick={onClose} aria-label="Tutup rute" className="grid size-9 place-items-center rounded-[9px] bg-[#f3f5f6]"><X className="size-4" /></button></div>
      {error && <p role="alert" className="mt-4 flex items-center gap-2 rounded-xl border border-[#fecaca] bg-[#fef2f2] px-3 py-2.5 text-[10px] font-bold text-[#e7000b]"><AlertTriangle className="size-4" />{error}</p>}
      {status === "loading" && <div className="mt-6 space-y-3">{[1,2,3].map((item)=><div key={item} className="h-28 animate-pulse rounded-[18px] bg-[#eef2f3]" />)}</div>}
      {status === "ready" && <div className="mt-4 space-y-2.5 sm:mt-6 sm:space-y-3">{routes.map((route) => <RouteCard key={route.id} route={route} active={selected === route.id} onSelect={() => setSelected(route.id)} onDetail={() => onDetail(route.id)} />)}</div>}
    </aside>
  );
}

function DetailPanel({ route, destination, destinationCoordinates, onBack, onReport, onNavigate }) {
  const steps = route.steps?.length
    ? route.steps
    : [{ instruction: `Tiba di ${destination}`, distance: route.distance }];

  return (
    <aside className="absolute inset-x-3 bottom-[max(12px,env(safe-area-inset-bottom))] top-[max(12px,env(safe-area-inset-top))] z-50 flex flex-col overflow-hidden rounded-[24px] border border-[#e4e8eb] bg-white shadow-[0_-8px_26px_rgba(24,46,58,.16)] sm:bottom-3 sm:left-auto sm:right-3 sm:top-3 sm:w-[440px] sm:max-w-[calc(100vw-72px)] sm:rounded-[14px] sm:shadow-[0_10px_28px_rgba(24,46,58,.17)]">
      <header className="flex shrink-0 items-center border-b border-[#edf0f2] px-4 py-3">
        <button
          type="button"
          onClick={onBack}
          aria-label="Kembali ke pilihan rute"
          className="grid size-10 shrink-0 place-items-center rounded-full bg-[#f5f6f7] text-[#182230] transition hover:bg-[#e9edf0] active:scale-95"
        >
          <ChevronLeft className="size-5" />
        </button>
        <div className="ml-3 min-w-0">
          <h2 className="text-[16px] font-extrabold text-[#182230]">
            Rute {route.id} — Detail
          </h2>
          <p className="truncate text-[11px] font-medium text-[#98a2b3]">
            Menuju {destination}
          </p>
        </div>
      </header>

      <div className="grid shrink-0 grid-cols-2 border-b border-[#edf0f2] text-center">
        <div className="border-r border-[#edf0f2] py-5">
          <b className="block text-[23px] font-extrabold text-[#182230]">
            {route.distance}
          </b>
          <span className="mt-2 block text-[10px] font-semibold text-[#a4adbd]">
            Jarak Mapbox
          </span>
        </div>
        <div className="py-5">
          <b className="block text-[23px] font-extrabold text-[#182230]">
            {route.time}
          </b>
          <span className="mt-2 block text-[10px] font-semibold text-[#a4adbd]">
            Waktu berjalan
          </span>
        </div>
      </div>

      <div data-lenis-prevent="true" className="app-scroll-region min-h-0 flex-1 overflow-y-auto px-3 py-5">
        {steps.map((step, index) => (
          <div
            key={`${step.instruction}-${index}`}
            className="relative flex min-h-[72px] gap-3 pb-4 before:absolute before:bottom-0 before:left-[17px] before:top-8 before:w-px before:bg-[#d8dde3] last:before:hidden"
          >
            <span
              className={`relative z-10 grid size-9 shrink-0 place-items-center rounded-full text-[11px] font-extrabold text-white ${
                index === steps.length - 1 ? "bg-[#f59e0b]" : "bg-[#717b8b]"
              }`}
            >
              {index + 1}
            </span>
            <div className="min-w-0 pt-1">
              <b className="block text-[13px] leading-[18px] text-[#202939]">
                {step.instruction}
              </b>
              <p className="mt-1.5 text-[10px] font-medium text-[#a4adbd]">
                {step.distance} · petunjuk Mapbox
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid shrink-0 grid-cols-[78px_108px_1fr] gap-2 border-t border-[#edf0f2] bg-white p-2.5">
        <button
          type="button"
          onClick={onReport}
          className="flex h-9 items-center justify-center gap-1.5 rounded-full border border-[#d9dfe4] text-[10px] font-extrabold text-[#25313c] transition hover:bg-[#f7f9fa] active:scale-[.97]"
        >
          <Flag className="size-3.5" />
          Lapor
        </button>
        <button
          type="button"
          onClick={() => openGoogleStreetView(destinationCoordinates)}
          className="flex h-9 items-center justify-center gap-1.5 rounded-full border border-[#93c5fd] bg-[#eff6ff] text-[10px] font-extrabold text-[#1677ff] transition hover:bg-[#dbeafe] active:scale-[.97]"
        >
          <Camera className="size-3.5" />
          Street View
        </button>
        <button
          type="button"
          onClick={onNavigate}
          className="h-9 rounded-full bg-[#0c6478] px-3 text-[10px] font-extrabold text-white transition hover:bg-[#095668] active:scale-[.97]"
        >
          Mulai navigasi
        </button>
      </div>
    </aside>
  );
}

function SideShell({ title, icon, onClose, children }) {
  return <aside data-lenis-prevent="true" className="app-scroll-region absolute inset-x-3 bottom-[max(12px,env(safe-area-inset-bottom))] top-[max(12px,env(safe-area-inset-top))] z-50 w-auto overflow-y-auto rounded-[24px] bg-white p-5 shadow-[0_12px_34px_rgba(24,46,58,.2)] sm:bottom-3 sm:left-[80px] sm:right-auto sm:top-3 sm:w-[350px] sm:max-w-[calc(100vw-92px)] sm:rounded-[16px] sm:border sm:border-white/80 sm:shadow-[0_12px_30px_rgba(24,46,58,.17)]"><div className="flex items-center border-b border-[#edf0f2] pb-4"><span className="grid size-9 place-items-center rounded-[10px] bg-[#e8f5f3] text-[#0c6478]">{icon}</span><div className="ml-3"><span className="block text-[9px] font-extrabold uppercase tracking-[.12em] text-[#7b8491]">AksesKota</span><b className="text-[15px] text-[#172b34]">{title}</b></div><button onClick={onClose} aria-label={`Tutup ${title}`} className="ml-auto grid size-9 place-items-center rounded-[9px] bg-[#f3f5f6] transition-colors hover:bg-[#e9edef]"><X className="size-4" /></button></div>{children}</aside>;
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
    <div className="rounded-[14px] bg-[#0c6478] p-4 text-white shadow-[0_8px_20px_rgba(12,100,120,.18)]"><span className="grid size-8 place-items-center rounded-[9px] bg-white/12"><Bot className="size-[18px] text-[#8ef0dc]"/></span><h2 className="mt-3 text-[15px] font-extrabold">Cari tempat sesuai kebutuhanmu</h2><p className="mt-1 text-[10px] leading-5 text-white/70">Asisten hanya menyaring artikel, rating, dan fasilitas yang dilaporkan komunitas AksesKota.</p></div>
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

  async function removeHistory(historyId) {
    try {
      await apiRequest(`/users/me/route-history/${historyId}`, { method: "DELETE" });
      setHistory((current) => current.filter((item) => item.id !== historyId));
      setSelectedId(null);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Riwayat gagal dihapus.");
    }
  }

  return <SideShell title="Riwayat Perjalanan" icon={<History className="size-5"/>} onClose={onClose}><div className="mt-5">
    {!session&&<div className="rounded-[16px] bg-[#fff7ed] p-4"><b className="text-[11px] text-[#9a3412]">Masuk untuk menyimpan perjalanan</b><p className="mt-1 text-[9px] leading-4 text-[#667085]">Riwayat menyimpan rute yang benar-benar kamu mulai.</p><button onClick={onLogin} className="mt-3 rounded-xl bg-[#0c6478] px-4 py-2.5 text-[10px] font-bold text-white">Masuk</button></div>}
    {session&&history.length===0&&<p className="rounded-[15px] bg-[#f8fafc] p-4 text-[10px] text-[#667085]">{message||"Belum ada riwayat. Mulai navigasi sebuah rute agar tersimpan di sini."}</p>}
    <p className="mb-3 rounded-xl bg-[#f8fafc] p-3 text-[9px] leading-4 text-[#667085]">Riwayat menyimpan titik perjalanan dan rute yang kamu mulai. Kamu dapat menghapusnya kapan saja.</p><div className="space-y-3">{history.map(item=>{const route=item.chosenRouteJson||{};const open=selectedId===item.id;return <article key={item.id} className="rounded-[16px] border-2 border-[#edf0f2] p-3"><button onClick={()=>setSelectedId(open?null:item.id)} className="w-full text-left"><div className="flex items-start gap-2"><span className="grid size-9 shrink-0 place-items-center rounded-full bg-[#effaf8] text-[#0c6478]"><Route className="size-4"/></span><div className="min-w-0 flex-1"><b className="block truncate text-[11px]">{route.destinationName||"Tujuan tersimpan"}</b><p className="mt-1 text-[9px] text-[#667085]">Rute {route.id||"—"} · {route.time||"Waktu tidak tersedia"} · {route.distance||"Jarak tidak tersedia"}</p><small className="mt-1 block text-[8px] text-[#98a2b3]">{new Date(item.createdAt).toLocaleString("id-ID")}</small></div><ChevronLeft className={`size-4 text-[#98a2b3] transition ${open?'-rotate-90':'rotate-180'}`}/></div></button>{open&&<div className="mt-3 border-t border-[#edf0f2] pt-3"><div className="grid grid-cols-2 gap-2"><div className="rounded-xl bg-[#effaf8] p-2"><small className="text-[8px] text-[#667085]">Mode</small><b className="block text-[10px]">{modes.find(mode=>profileModeMap[mode.id]===item.mode)?.label||item.mode}</b></div><div className="rounded-xl bg-[#fff7ed] p-2"><small className="text-[8px] text-[#667085]">Skor akses</small><b className="block text-[10px]">{Number.isFinite(route.score)?`${route.score}/100`:'Data belum cukup'}</b></div></div><p className="mt-3 text-[9px] font-bold text-[#475467]">Langkah perjalanan</p><ol className="mt-2 space-y-2">{(route.steps||[]).map((step,index)=><li key={`${step.instruction}-${index}`} className="flex gap-2 text-[9px] leading-4 text-[#667085]"><span className="grid size-5 shrink-0 place-items-center rounded-full bg-[#0c6478] text-[8px] font-bold text-white">{index+1}</span>{step.instruction} ({step.distance})</li>)}</ol><button type="button" onClick={()=>removeHistory(item.id)} className="mt-3 w-full rounded-xl border border-[#fecaca] py-2 text-[9px] font-bold text-[#b42318]">Hapus riwayat ini</button></div>}</article>})}</div>
  </div></SideShell>;
}

function SpeechNavigation({ route, destination, onStop, onReroute }) {
  const steps = useMemo(() => route.steps?.length ? route.steps : [{ instruction: `Tiba di ${destination}`, distance: route.distance }], [destination, route.distance, route.steps]);
  const [stepIndex, setStepIndex] = useState(0);
  const [voiceOn, setVoiceOn] = useState(true);
  const [navigationMessage, setNavigationMessage] = useState("");
  const rerouteTriggeredRef = useRef(false);
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

  useEffect(() => {
    if (!navigator.geolocation) return undefined;
    const watchId = navigator.geolocation.watchPosition(({ coords }) => {
      const current = [coords.longitude, coords.latitude];
      const nextLocation = steps[stepIndex + 1]?.location;
      if (nextLocation && coordinateDistanceMeters(current, nextLocation) <= 25) {
        setStepIndex((value) => Math.min(steps.length - 1, value + 1));
      }
      const nearestRoutePoint = Math.min(...(route.geometry?.coordinates || []).map((point) => coordinateDistanceMeters(current, point)));
      if (Number.isFinite(nearestRoutePoint) && nearestRoutePoint > 60 && !rerouteTriggeredRef.current) {
        rerouteTriggeredRef.current = true;
        setNavigationMessage("Kamu terdeteksi keluar jalur. Menghitung ulang rute dari posisi sekarang.");
        onReroute?.(current);
        window.dispatchEvent(new CustomEvent("akseskota:reroute"));
      } else if (nearestRoutePoint <= 35) {
        rerouteTriggeredRef.current = false;
        setNavigationMessage("");
      }
    }, () => setNavigationMessage("Lokasi real-time tidak tersedia. Gunakan tombol langkah secara manual."), {
      enableHighAccuracy: true,
      maximumAge: 5_000,
      timeout: 10_000,
    });
    return () => navigator.geolocation.clearWatch(watchId);
  }, [onReroute, route.geometry, stepIndex, steps]);

  function stop() { window.speechSynthesis?.cancel(); onStop(); }
  function move(next) { setStepIndex(Math.max(0, Math.min(steps.length-1, next))); }

  return <MotionSurface role="region" aria-label="Navigasi suara" direction="up" distance={20} scale={0.96} className="absolute bottom-4 left-1/2 z-50 w-[min(560px,calc(100%-24px))] -translate-x-1/2 rounded-[20px] bg-[#173c61] p-4 text-white shadow-2xl"><div className="flex items-start gap-3"><span className="grid size-11 shrink-0 place-items-center rounded-full bg-[#35cbb0]"><Volume2 className="size-5"/></span><div className="min-w-0 flex-1"><p className="text-[9px] font-bold tracking-[.12em] text-[#7be3dc]">LANGKAH {stepIndex+1} DARI {steps.length}</p><b aria-live="polite" className="mt-1 block text-[13px] leading-5">{steps[stepIndex].instruction}</b><p className="mt-1 text-[10px] text-white/65">{steps[stepIndex].distance} · menuju {destination}</p></div><button onClick={stop} aria-label="Hentikan navigasi" className="grid size-9 place-items-center rounded-full bg-white/10"><X className="size-4"/></button></div>{navigationMessage&&<p role="status" className="mt-3 rounded-xl bg-[#f59e0b]/20 p-2 text-[9px] font-semibold text-[#fde68a]">{navigationMessage}</p>}{!supported&&<p className="mt-3 rounded-xl bg-white/10 p-2 text-[9px]">Browser ini belum mendukung pembacaan suara, tetapi instruksi teks tetap dapat digunakan.</p>}<div className="mt-3 grid grid-cols-4 gap-2"><button disabled={stepIndex===0} onClick={()=>move(stepIndex-1)} className="rounded-xl bg-white/10 py-2 text-[9px] font-bold disabled:opacity-30">Sebelumnya</button><button onClick={()=>{setVoiceOn(value=>!value);window.speechSynthesis?.cancel();}} className="grid place-items-center rounded-xl bg-white/10 py-2" aria-label={voiceOn?"Matikan suara":"Aktifkan suara"}>{voiceOn?<Volume2 className="size-4"/>:<VolumeX className="size-4"/>}</button><button onClick={()=>speak(stepIndex)} className="grid place-items-center rounded-xl bg-white/10 py-2" aria-label="Ulangi instruksi"><Play className="size-4"/></button><button disabled={stepIndex===steps.length-1} onClick={()=>move(stepIndex+1)} className="rounded-xl bg-[#35cbb0] py-2 text-[9px] font-extrabold text-[#173c61] disabled:opacity-30">Berikutnya</button></div></MotionSurface>;
}

function coordinateDistanceMeters([firstLng, firstLat], [secondLng, secondLat]) {
  const averageLat = ((firstLat + secondLat) / 2) * Math.PI / 180;
  return Math.hypot((firstLng - secondLng) * 111_320 * Math.cos(averageLat), (firstLat - secondLat) * 110_540);
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
  const ModeIcon = mode.icon;
  return <SideShell title="Profil Saya" icon={<UserRound className="size-5" />} onClose={onClose}><div className="mt-5 flex items-center rounded-[14px] border border-[#d9e5e6] bg-[#f4f9f9] p-5 text-[#173c61]"><span className="grid size-14 place-items-center rounded-[12px] bg-[#0c6478] text-white"><UserRound className="size-6" /></span><div className="ml-4"><b className="text-[16px]">{session?.user?.name || "Tamu"}</b><p className="mt-1 text-[10px] text-[#667085]">{session?.user?.role || "Mode tamu"}</p></div></div><div className="mt-5 flex items-center rounded-[14px] border border-[#e5e9eb] p-4"><span className="grid size-9 place-items-center rounded-[9px] bg-[#e8f5f3] text-[#0c6478]"><ModeIcon className="size-[18px]" /></span><div className="ml-3"><small className="text-[9px] font-bold text-[#7b8491]">MODE PERJALANAN</small><b className="block text-[13px]">{mode.label}</b></div><span className="ml-auto rounded-full bg-[#e8f5f3] px-3 py-1.5 text-[9px] font-bold text-[#0c6478]">Aktif</span></div>{['MODERATOR','ADMIN'].includes(session?.user?.role)&&<button onClick={onModerate} className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-[11px] bg-[#0c6478] text-[11px] font-extrabold text-white"><ShieldCheck className="size-4" />Moderasi laporan</button>}<button onClick={onLogout} className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-[11px] border border-[#fecaca] text-[11px] font-bold text-[#c9362b] transition-colors hover:bg-[#fff5f5]"><LogOut className="size-4" />{session ? "Keluar dari akun" : "Masuk ke akun"}</button></SideShell>;
}

function MobileMapActions({ onSearch }) {
  return <>
    <button type="button" onClick={() => window.dispatchEvent(new Event("akseskota:locate"))} aria-label="Pusatkan lokasi saya" className="absolute bottom-[116px] right-4 z-30 grid size-12 place-items-center rounded-[18px] bg-white text-[#1f2937] shadow-[0_5px_18px_rgba(30,50,65,.2)] sm:hidden"><Navigation className="size-5 -rotate-12" /></button>
    <MotionSurface direction="up" distance={20} className="absolute inset-x-0 bottom-[88px] z-30 bg-transparent px-4 sm:hidden">
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

export default function NavigationDashboard({ initialProfile="walking", initialDestination=null }) {
  const navigate=usePageTransition(); const [profile,setProfile]=useState(initialProfile); const [panel,setPanel]=useState(null); const [selected,setSelected]=useState("A"); const [detail,setDetail]=useState("A"); const [directoryDetail,setDirectoryDetail]=useState(null); const [origin,setOrigin]=useState("Lokasi saya"); const [originSelection,setOriginSelection]=useState(null); const [destination,setDestination]=useState(initialDestination?.name||""); const [destinationSelection,setDestinationSelection]=useState(initialDestination); const [session,setSession]=useState(null); const [mapReports,setMapReports]=useState([]); const [userReports,setUserReports]=useState([]); const [reportDraft,setReportDraft]=useState(null); const [selectedReportId,setSelectedReportId]=useState(null); const [navigating,setNavigating]=useState(false); const [routeOptions,setRouteOptions]=useState([]); const [routingStatus,setRoutingStatus]=useState("idle"); const [routeError,setRouteError]=useState(""); const [originCoordinates,setOriginCoordinates]=useState(null); const [destinationCoordinates,setDestinationCoordinates]=useState(initialDestination?.coordinates||null); const [resolvedDestination,setResolvedDestination]=useState(initialDestination?.name||"Tujuan"); const mode=modes.find(m=>m.id===profile)||modes[4]; const activeRoute=routeOptions.find(r=>r.id===detail)||routeOptions[0];
  const [mapDestinations, setMapDestinations] = useState([]);
  const [shadeSegments, setShadeSegments] = useState([]);
  const [preferShade, setPreferShade] = useState(false);
  const [heatEnabled, setHeatEnabled] = useState(false);
  const [heatHour, setHeatHour] = useState(() => Math.max(6, Math.min(18, new Date().getHours())));
  const [weatherForecast, setWeatherForecast] = useState(null);
  const selectedWeather = useMemo(() => {
    const hourly = weatherForecast?.hourly;
    if (!hourly?.time?.length) return weatherForecast?.current ? {
      apparentTemperature: weatherForecast.current.apparent_temperature,
      cloudCover: weatherForecast.current.cloud_cover,
    } : null;
    const suffix = `T${String(heatHour).padStart(2, "0")}:00`;
    const index = hourly.time.findIndex((time) => time.endsWith(suffix));
    return {
      apparentTemperature: hourly.apparent_temperature?.[index],
      cloudCover: hourly.cloud_cover?.[index],
      shortwaveRadiation: hourly.shortwave_radiation?.[index],
    };
  }, [heatHour, weatherForecast]);
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
            algorithmCost: evaluation.algorithmCost,
            algorithmRank: evaluation.algorithmRank,
            criteriaPenalties: evaluation.criteriaPenalties,
            evaluationReasons: evaluation.reasons,
            safety: evaluation.safety,
            routeFacilities: evaluation.routeFacilities,
            matchedSegmentCount: evaluation.matchedSegmentCount,
            badge: evaluation.blocked ? "Tidak sesuai profil" : evaluation.labels[0] || (evaluation.dataStatus === "CUKUP" ? route.badge : "Data komunitas belum cukup"),
          };
        }).sort((first, second) => {
          if (preferShade && Number.isFinite(first.shade) && Number.isFinite(second.shade) && first.shade !== second.shade) return second.shade - first.shade;
          return (first.algorithmRank ?? 999) - (second.algorithmRank ?? 999);
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
  }, [destination, destinationSelection, origin, originSelection, preferShade, profile]);

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

  const refreshReportsAndRoutes = useCallback(async () => {
    await refreshReports();
    if (routeOptions.length > 0 && originCoordinates && destinationCoordinates) {
      await searchRoutes(false);
    }
  }, [destinationCoordinates, originCoordinates, refreshReports, routeOptions.length, searchRoutes]);

  useEffect(() => {
    const controller = new AbortController();
    async function loadMapContext() {
      const [placesResult, segmentsResult, weatherResult] = await Promise.allSettled([
        apiRequest("/destinations?limit=500"),
        apiRequest("/road-segments?lat=-6.5971&lng=106.8060&radiusMeters=10000"),
        fetch("https://api.open-meteo.com/v1/forecast?latitude=-6.5971&longitude=106.8060&current=apparent_temperature,cloud_cover&hourly=apparent_temperature,cloud_cover,shortwave_radiation&timezone=Asia%2FJakarta&forecast_days=1", { signal: controller.signal }).then((response) => {
          if (!response.ok) throw new Error("Cuaca tidak tersedia");
          return response.json();
        }),
      ]);
      if (controller.signal.aborted) return;
      setMapDestinations(placesResult.status === "fulfilled" && Array.isArray(placesResult.value) ? placesResult.value : []);
      setShadeSegments(segmentsResult.status === "fulfilled" && Array.isArray(segmentsResult.value) ? segmentsResult.value : []);
      setWeatherForecast(weatherResult.status === "fulfilled" ? weatherResult.value : null);
    }
    void loadMapContext();
    return () => controller.abort();
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

  useEffect(() => {
    const reroute = () => void searchRoutes(false);
    window.addEventListener("akseskota:reroute", reroute);
    return () => window.removeEventListener("akseskota:reroute", reroute);
  }, [searchRoutes]);

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
            comfort: activeRoute.comfort,
            safety: activeRoute.safety,
            dataCoverage: activeRoute.dataCoverage,
            badge: activeRoute.badge,
            algorithmRank: activeRoute.algorithmRank,
            algorithmCost: activeRoute.algorithmCost,
            criteriaPenalties: activeRoute.criteriaPenalties,
            evaluationReasons: activeRoute.evaluationReasons || [],
            routeFacilities: activeRoute.routeFacilities || [],
            matchedSegmentCount: activeRoute.matchedSegmentCount || 0,
            distanceMeters: activeRoute.distanceMeters,
            durationSeconds: activeRoute.durationSeconds,
            geometry: activeRoute.geometry,
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

  const openMapDestination = useCallback(async (place) => {
    setPanel("directory");
    setDirectoryDetail(null);
    try {
      const detailResult = await apiRequest(`/destinations/${encodeURIComponent(place.externalId)}`);
      setDirectoryDetail(detailResult);
      if (detailResult?.coordinates) setDestinationCoordinates(detailResult.coordinates);
    } catch {
      setDirectoryDetail(place);
      if (place?.coordinates) setDestinationCoordinates(place.coordinates);
    }
  }, []);

  const sidePanelOpen = ['report','profile','verify-report','community-place','assistant','history','directory'].includes(panel);
  const showMapLayerControls = !sidePanelOpen && panel !== 'mode';

  return <main className={`relative h-dvh min-h-0 overflow-hidden bg-[#dfe5e8] sm:min-h-[620px] ${profile==='low-vision'?'contrast-[1.08]':''}`}>
    <MapCanvas routes={routeOptions} reports={mapReports} destinations={mapDestinations} shadeSegments={shadeSegments} heatEnabled={heatEnabled} heatHour={heatHour} weather={selectedWeather} onDestinationSelect={openMapDestination} activeRoute={selected||detail} origin={originCoordinates} destination={destinationCoordinates} reportDraft={reportDraft} onMapClick={panel==='report'?setReportDraft:null} highContrast={profile==='low-vision'} />
    <LeftRail activePanel={panel} destinationCount={mapDestinations.length} onHome={()=>{setDirectoryDetail(null);setPanel(null)}} onReport={()=>setPanel('report')} onAssistant={()=>setPanel('assistant')} onHistory={()=>setPanel('history')} onProfile={()=>setPanel('profile')} onDestinations={()=>{setDirectoryDetail(null);setPanel('directory')}} />
    {!sidePanelOpen&&<SearchBox origin={origin} destination={destination} setOrigin={(value)=>{setOrigin(value);setOriginSelection(null);}} setDestination={(value)=>{setDestination(value);setDestinationSelection(null);}} originCoordinates={originCoordinates} onSelectOrigin={(place)=>{setOrigin(place.name);setOriginSelection(place);setOriginCoordinates(place.coordinates);}} onSelectDestination={(place)=>{setDestination(place.name);setDestinationSelection(place);setPanel('community-place');}} onSearch={()=>searchRoutes(true)} mode={mode} onMode={()=>setPanel(panel==='mode'?null:'mode')} loading={routingStatus==='loading'} preferShade={preferShade} onToggleShade={()=>setPreferShade(value=>!value)} shadeDataAvailable={shadeSegments.length>0} onShowHeat={()=>setHeatEnabled(true)} onReportShade={()=>setPanel('report')} />}
    {showMapLayerControls&&<MapLayerControls destinationCount={mapDestinations.length} onDirectory={()=>{setDirectoryDetail(null);setPanel('directory')}} heatEnabled={heatEnabled} setHeatEnabled={setHeatEnabled} heatHour={heatHour} setHeatHour={setHeatHour} weather={selectedWeather} shadeDataAvailable={shadeSegments.length>0} />}
    {!panel&&!navigating&&<MobileMapActions onSearch={()=>searchRoutes(true)} />}
    {panel==='mode'&&<ModePanel current={profile} onChange={changeMode} onClose={()=>setPanel(null)} />}
    {panel==='directory'&&<DirectoryPanel selectedId={directoryDetail?.externalId} onClose={()=>{setDirectoryDetail(null);setPanel(null)}} onSelect={(place)=>{setDirectoryDetail(place);setDestinationCoordinates(place.coordinates)}} />}
    {panel==='directory'&&directoryDetail&&<DirectoryPlaceDetail key={directoryDetail.externalId} detail={directoryDetail} session={session} onLogin={()=>navigate('/masuk')} onClose={()=>setDirectoryDetail(null)} onUseAsDestination={(place)=>{const selectedPlace={id:place.externalId,name:place.name,address:place.address,coordinates:place.coordinates};setDestination(place.name);setDestinationSelection(selectedPlace);setDestinationCoordinates(place.coordinates);setResolvedDestination(place.name);setDirectoryDetail(null);setPanel(null)}} />}
    {panel==='assistant'&&<AssistantPanel onClose={()=>setPanel(null)} onChoose={(place)=>{const selectedPlace={id:place.externalId,name:place.name,address:place.address,coordinates:place.coordinates};setDestination(place.name);setDestinationSelection(selectedPlace);setDestinationCoordinates(place.coordinates);setPanel('community-place');}}/>}
    {panel==='history'&&<RouteHistoryPanel session={session} onClose={()=>setPanel(null)} onLogin={()=>navigate('/masuk')}/>}
    {panel==='community-place'&&destinationSelection&&<CommunityPlacePanel place={destinationSelection} session={session} onRoute={()=>searchRoutes(true)} onClose={()=>setPanel(null)} onLogin={()=>navigate('/masuk')}/>}
    {panel==='routes'&&<RoutesPanel routes={routeOptions} destination={resolvedDestination} status={routingStatus} error={routeError} selected={selected} setSelected={setSelected} onDetail={id=>{setDetail(id);setSelected(id);setPanel('detail')}} onClose={()=>setPanel(null)} />}
    {panel==='detail'&&activeRoute&&<DetailPanel route={activeRoute} profile={profile} destination={resolvedDestination} destinationCoordinates={destinationCoordinates} onBack={()=>setPanel('routes')} onReport={()=>setPanel('report')} onNavigate={beginNavigation} />}
    {panel==='report'&&<ReportPanel reports={userReports} coordinates={reportDraft} setCoordinates={setReportDraft} session={session} onSubmitted={refreshReportsAndRoutes} onClose={()=>{setReportDraft(null);setPanel(null)}} />}
    {panel==='verify-report'&&selectedReportId&&<CommunityVerificationPanel reportId={selectedReportId} session={session} onClose={()=>setPanel(null)} onUpdated={refreshReportsAndRoutes} onLogin={()=>navigate('/masuk')} />}
    {panel==='profile'&&<ProfilePanel profile={profile} session={session} onClose={()=>setPanel(null)} onModerate={()=>navigate('/admin/laporan')} onLogout={()=>{clearSession();navigate('/masuk')}} />}
    {navigating&&activeRoute&&<SpeechNavigation route={activeRoute} destination={resolvedDestination} onStop={()=>setNavigating(false)}/>}
  </main>;
}
