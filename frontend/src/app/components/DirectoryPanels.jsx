"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BookOpen,
  Check,
  Clock3,
  MapPin,
  Route,
  Search,
  ShieldCheck,
  Star,
  X,
} from "lucide-react";
import { apiRequest } from "../../lib/api";
import MotionSurface from "./react-bits/MotionSurface";

const categories = [
  { id: "all", label: "Semua" },
  { id: "park", label: "Taman" },
  { id: "shopping", label: "Belanja" },
  { id: "transport", label: "Transportasi" },
  { id: "health", label: "Kesehatan" },
];

const categoryKeywords = {
  park: ["taman", "wisata", "museum", "kebun", "rekreasi"],
  shopping: ["mall", "mal", "belanja", "pasar", "shopping"],
  transport: ["stasiun", "terminal", "transport", "halte"],
  health: ["rumah sakit", "rsud", "klinik", "hospital", "kesehatan"],
};

const featureNames = {
  WHEELCHAIR_ENTRANCE: "Pintu aksesibel",
  WHEELCHAIR_SEATING: "Tempat duduk",
  WHEELCHAIR_RESTROOM: "Toilet aksesibel",
  WHEELCHAIR_PARKING: "Parkir aksesibel",
  KURSI_KHUSUS_PENGGUNA_KURSI_RODA: "Kursi roda",
  DUKUNGAN_INSTALASI_BANTU_DENGAR: "Bantuan dengar",
  PENYEWAAN_KURSI_RODA: "Penyewaan kursi roda",
  RAMP: "Ramp",
  LIFT: "Lift",
  ACCESSIBLE_TOILET: "Toilet aksesibel",
  ACCESSIBLE_PARKING: "Parkir aksesibel",
  GUIDING_BLOCK: "Jalur guiding",
  STEP_FREE: "Bebas tangga",
};

const reviewFeatures = [
  ["RAMP", "Ramp"],
  ["LIFT", "Lift"],
  ["ACCESSIBLE_TOILET", "Toilet Aksesibel"],
  ["ACCESSIBLE_PARKING", "Parkir Aksesibel"],
  ["GUIDING_BLOCK", "Jalur Guiding"],
  ["STEP_FREE", "Bebas Tangga"],
];

function matchesCategory(place, activeCategory) {
  if (activeCategory === "all") return true;
  const haystack = `${place.name || ""} ${place.category || ""} ${place.placeType || ""}`.toLowerCase();
  return categoryKeywords[activeCategory].some((keyword) => haystack.includes(keyword));
}

function DirectoryHeader({ onClose }) {
  return (
    <div className="flex items-center border-b border-[#edf0f2] px-4 py-4">
      <span className="grid size-9 place-items-center rounded-[10px] bg-[#e8f5f3] text-[#0c6478]">
        <BookOpen className="size-[18px]" />
      </span>
      <div className="ml-3">
        <span className="block text-[9px] font-extrabold uppercase tracking-[.12em] text-[#7b8491]">
          AksesKota
        </span>
        <b className="text-[15px] text-[#172b34]">Direktori Bogor</b>
      </div>
      <button
        type="button"
        onClick={onClose}
        aria-label="Tutup Direktori Bogor"
        className="ml-auto grid size-9 place-items-center rounded-[9px] bg-[#f3f5f6] text-[#667085] transition hover:bg-[#e9edef]"
      >
        <X className="size-4" />
      </button>
    </div>
  );
}

export function DirectoryPanel({ selectedId, onClose, onSelect }) {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [places, setPlaces] = useState([]);
  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("");

  const loadPlaces = useCallback(async () => {
    setStatus("loading");
    setMessage("");
    try {
      const params = new URLSearchParams({ query: query.trim(), limit: "200" });
      const rows = await apiRequest(`/destinations?${params}`);
      setPlaces(rows);
      setStatus("ready");
    } catch (error) {
      setPlaces([]);
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Direktori gagal dimuat.");
    }
  }, [query]);

  useEffect(() => {
    const timer = window.setTimeout(loadPlaces, 250);
    return () => window.clearTimeout(timer);
  }, [loadPlaces]);

  const visiblePlaces = useMemo(
    () => places.filter((place) => matchesCategory(place, activeCategory)),
    [activeCategory, places],
  );

  async function selectPlace(place) {
    setMessage("");
    try {
      onSelect(await apiRequest(`/destinations/${encodeURIComponent(place.externalId)}`));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Detail tempat gagal dimuat.");
    }
  }

  return (
    <MotionSurface
      as="aside"
      direction="right"
      distance={24}
      className="absolute inset-x-3 bottom-3 z-50 flex h-[58dvh] min-h-0 flex-col overflow-hidden rounded-[20px] border border-[#e7ebed] bg-white shadow-[0_-10px_34px_rgba(24,46,58,.2)] sm:left-[72px] sm:right-3 lg:bottom-3 lg:left-[60px] lg:right-auto lg:top-3 lg:h-auto lg:w-[330px] lg:rounded-[16px] lg:shadow-[0_12px_32px_rgba(24,46,58,.18)]"
    >
      <span className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-[#d0d5dd] lg:hidden" />
      <DirectoryHeader onClose={onClose} />
      <div className="border-b border-[#edf0f2] px-4 py-3">
        <label className="flex h-10 items-center gap-2 rounded-[11px] bg-[#f3f6f7] px-3">
          <Search className="size-4 text-[#0c6478]" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Cari tempat..."
            className="min-w-0 flex-1 bg-transparent text-[10px] font-semibold outline-none placeholder:font-normal placeholder:text-[#98a2b3]"
          />
          {query && (
            <button type="button" onClick={() => setQuery("")} aria-label="Hapus pencarian">
              <X className="size-3.5 text-[#98a2b3]" />
            </button>
          )}
        </label>
        <div className="directory-chip-scroll mt-3 flex gap-1.5 overflow-x-auto pb-1">
          {categories.map((category) => (
            <button
              key={category.id}
              type="button"
              onClick={() => setActiveCategory(category.id)}
              className={`shrink-0 rounded-full px-3 py-1.5 text-[8px] font-extrabold transition ${
                activeCategory === category.id
                  ? "bg-[#0c6478] text-white"
                  : "border border-[#e4e7ec] bg-white text-[#667085] hover:border-[#9abdc4]"
              }`}
            >
              {category.label}
            </button>
          ))}
        </div>
        <p className="mt-2 text-[8px] font-semibold text-[#98a2b3]">
          {status === "loading" ? "Memuat tempat..." : `${visiblePlaces.length} tempat dari database`}
        </p>
      </div>

      <div className="min-h-0 flex-1 space-y-2.5 overflow-y-auto p-3">
        {status === "loading" &&
          [1, 2, 3, 4].map((item) => (
            <div key={item} className="h-[112px] animate-pulse rounded-[14px] bg-[#eef2f3]" />
          ))}
        {status === "error" && (
          <p className="rounded-xl bg-[#fff1f2] p-4 text-[9px] font-semibold leading-4 text-[#b42318]">
            {message}
          </p>
        )}
        {status === "ready" && visiblePlaces.length === 0 && (
          <div className="rounded-[15px] bg-[#f8fafc] p-5 text-center">
            <BookOpen className="mx-auto size-6 text-[#98a2b3]" />
            <p className="mt-2 text-[10px] font-bold text-[#475467]">Tempat belum ditemukan</p>
            <p className="mt-1 text-[8px] leading-4 text-[#98a2b3]">Coba kategori lain atau ubah kata pencarian.</p>
          </div>
        )}
        {visiblePlaces.map((place) => {
          const active = selectedId === place.externalId;
          return (
            <button
              key={place.externalId}
              type="button"
              onClick={() => selectPlace(place)}
              className={`w-full overflow-hidden rounded-[14px] border text-left transition ${
                active
                  ? "border-[#35cbb0] bg-[#effaf8] shadow-[0_5px_16px_rgba(12,100,120,.12)]"
                  : "border-[#edf0f2] bg-white hover:border-[#b9dcd7] hover:shadow-sm"
              }`}
            >
              <span className="relative block h-[72px] overflow-hidden bg-[#dff4f0]">
                {place.primaryImageUrl ? (
                  <Image
                    unoptimized
                    fill
                    sizes="304px"
                    src={place.primaryImageUrl}
                    alt={`Foto ${place.name}`}
                    className="object-cover"
                  />
                ) : (
                  <span className="absolute inset-0 grid place-items-center text-[#0c6478]">
                    <MapPin className="size-5" />
                  </span>
                )}
                <span className="absolute bottom-2 right-2 rounded-full bg-[#173c61]/90 px-2 py-1 text-[8px] font-extrabold text-white">
                  <Star className="mr-1 inline size-2.5 fill-[#f9c846] text-[#f9c846]" />
                  {place.googleRating ?? "—"}
                </span>
              </span>
              <span className="block p-3">
                <span className="flex items-start gap-2">
                  <span className="min-w-0 flex-1">
                    <b className="block truncate text-[10px] text-[#172b34]">{place.name}</b>
                    <small className="mt-0.5 block truncate text-[8px] text-[#98a2b3]">
                      {place.category || "Tempat di Bogor"}
                    </small>
                  </span>
                  <span className="rounded-full bg-[#e8f5f3] px-2 py-1 text-[7px] font-extrabold text-[#0c6478]">
                    Data {place.dataCoverage ?? 0}%
                  </span>
                </span>
                <span className="mt-2 flex flex-wrap gap-1">
                  {(place.availableFeatures || []).slice(0, 2).map((feature) => (
                    <span key={feature} className="rounded-full bg-[#f3f6f7] px-2 py-1 text-[7px] font-bold text-[#667085]">
                      <Check className="mr-0.5 inline size-2.5 text-[#12a594]" />
                      {featureNames[feature] || feature}
                    </span>
                  ))}
                </span>
              </span>
            </button>
          );
        })}
      </div>
      {message && status !== "error" && (
        <p className="mx-3 mb-3 rounded-xl bg-[#fff7ed] p-3 text-[8px] font-semibold text-[#9a3412]">{message}</p>
      )}
    </MotionSurface>
  );
}

function OpeningHours({ openingHours }) {
  if (!openingHours || typeof openingHours !== "object") return null;
  return (
    <div className="mt-4 rounded-[14px] bg-[#f8fafc] p-3">
      <b className="text-[9px] text-[#344054]">Jam buka</b>
      <div className="mt-2 space-y-1">
        {Object.entries(openingHours).slice(0, 7).map(([day, hours]) => (
          <div key={day} className="flex justify-between gap-3 text-[8px] text-[#667085]">
            <span>{day}</span>
            <span className="text-right font-semibold">{Array.isArray(hours) ? hours.join(", ") : String(hours)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function DirectoryDetailPanel({ detail, onClose, onUseAsDestination }) {
  const imageUrl = detail.images?.[0]?.imageUrl || detail.primaryImageUrl;
  const accessibilityItems = (detail.accessibilityEvidence || []).slice(0, 6);

  return (
    <MotionSurface
      as="aside"
      direction="left"
      distance={26}
      className="absolute inset-x-3 bottom-3 z-[55] h-[72dvh] overflow-y-auto rounded-[20px] border border-[#e7ebed] bg-white shadow-[0_-10px_34px_rgba(24,46,58,.22)] sm:left-[72px] sm:right-3 lg:bottom-3 lg:left-auto lg:right-3 lg:top-3 lg:h-auto lg:w-[360px] lg:rounded-[16px] lg:shadow-[0_14px_36px_rgba(24,46,58,.22)]"
    >
      <div className="relative h-44 overflow-hidden bg-[#dff4f0]">
        {imageUrl ? (
          <Image unoptimized fill sizes="360px" src={imageUrl} alt={`Foto ${detail.name}`} className="object-cover" />
        ) : (
          <div className="absolute inset-0 grid place-items-center text-[#0c6478]"><MapPin className="size-8" /></div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#102f3b]/75 via-transparent to-transparent" />
        <button
          type="button"
          onClick={onClose}
          aria-label="Tutup detail direktori"
          className="absolute right-3 top-3 grid size-9 place-items-center rounded-full bg-white/90 text-[#344054] shadow"
        >
          <X className="size-4" />
        </button>
        <div className="absolute inset-x-4 bottom-4 text-white">
          <p className="text-[8px] font-bold uppercase tracking-[.12em]">{detail.category || "Tempat di Bogor"}</p>
          <h2 className="mt-1 text-[18px] font-extrabold leading-6">{detail.name}</h2>
        </div>
      </div>

      <div className="p-4">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 rounded-full bg-[#fff7ed] px-3 py-2 text-[10px] font-extrabold text-[#a34b00]">
            <Star className="size-3 fill-[#f59e0b] text-[#f59e0b]" />
            {detail.googleRating ?? "—"}
          </span>
          <span className="text-[8px] font-semibold text-[#98a2b3]">
            {(detail.googleReviewCount || 0).toLocaleString("id-ID")} ulasan sumber
          </span>
          <span className="ml-auto rounded-full bg-[#effaf8] px-2.5 py-1.5 text-[8px] font-extrabold text-[#0c6478]">
            Akses {detail.accessibilityScore ?? "—"}
          </span>
        </div>

        <p className="mt-4 text-[9px] leading-5 text-[#667085]">{detail.description || detail.address}</p>
        <p className="mt-3 flex gap-2 text-[9px] font-semibold leading-4 text-[#475467]">
          <MapPin className="mt-0.5 size-4 shrink-0 text-[#0c6478]" />
          {detail.address}
        </p>

        <button
          type="button"
          onClick={() => onUseAsDestination(detail)}
          className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-[11px] bg-[#0c6478] text-[10px] font-extrabold text-white transition hover:bg-[#09596a]"
        >
          <Route className="size-4" />
          Pilih sebagai tujuan
        </button>

        <section className="mt-5 border-t border-[#edf0f2] pt-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="size-4 text-[#12a594]" />
            <h3 className="text-[10px] font-extrabold text-[#172b34]">Fasilitas aksesibilitas</h3>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {accessibilityItems.length ? accessibilityItems.map((item) => (
              <div
                key={item.featureCode}
                className={`rounded-[12px] p-3 ${
                  item.available === true
                    ? "bg-[#effaf8] text-[#0c6478]"
                    : item.available === false
                      ? "bg-[#fff1f2] text-[#b42318]"
                      : "bg-[#f3f5f6] text-[#667085]"
                }`}
              >
                <Check className="size-3.5" />
                <b className="mt-1 block text-[8px]">{featureNames[item.featureCode] || item.featureCode}</b>
                <small className="text-[7px]">{item.available === true ? "Tersedia" : item.available === false ? "Tidak tersedia" : "Belum pasti"}</small>
              </div>
            )) : (
              <p className="col-span-2 rounded-xl bg-[#fff7ed] p-3 text-[8px] leading-4 text-[#9a3412]">
                Belum ada bukti fasilitas. Tempat ini tetap perlu survei komunitas.
              </p>
            )}
          </div>
        </section>

        <OpeningHours openingHours={detail.openingHours} />

        <section className="mt-5 border-t border-[#edf0f2] pt-4">
          <div className="flex items-center gap-2">
            <Clock3 className="size-4 text-[#f59e0b]" />
            <h3 className="text-[10px] font-extrabold text-[#172b34]">Ulasan komunitas</h3>
          </div>
          {detail.posts?.length ? (
            <div className="mt-3 space-y-2">
              {detail.posts.slice(0, 3).map((post) => (
                <article key={post.id} className="rounded-[12px] border border-[#edf0f2] p-3">
                  <b className="text-[9px] text-[#344054]">{post.title}</b>
                  <p className="mt-1 line-clamp-3 text-[8px] leading-4 text-[#667085]">{post.content}</p>
                </article>
              ))}
            </div>
          ) : (
            <p className="mt-3 rounded-xl bg-[#f8fafc] p-3 text-[8px] leading-4 text-[#667085]">
              Belum ada ulasan komunitas. Rating sumber tidak dianggap sebagai verifikasi aksesibilitas.
            </p>
          )}
        </section>
      </div>
    </MotionSurface>
  );
}
