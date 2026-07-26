"use client";

import Image from "next/image";
import { useState } from "react";
import {
  ArrowLeft,
  Check,
  Clock3,
  ExternalLink,
  ImagePlus,
  MapPin,
  MessageCircle,
  Route,
  Star,
} from "lucide-react";
import { apiRequest } from "../../lib/api";
import MotionSurface from "./react-bits/MotionSurface";

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

function todayNames() {
  const index = new Date().getDay();
  return {
    id: ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"][index],
    en: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][index],
  };
}

function OpeningHours({ openingHours }) {
  if (!openingHours || typeof openingHours !== "object") {
    return <p className="rounded-xl bg-[#f8fafc] p-3 text-[8px] text-[#667085]">Jam buka belum tersedia.</p>;
  }
  const today = todayNames().id;
  return (
    <div className="space-y-1">
      {Object.entries(openingHours).slice(0, 7).map(([day, hours]) => (
        <div key={day} className={`flex justify-between gap-3 rounded-md px-2 py-1 text-[8px] ${day === today ? "bg-[#effaf8] font-extrabold text-[#0c796d]" : "text-[#667085]"}`}>
          <span>{day.slice(0, 3)}</span>
          <span className="text-right">{Array.isArray(hours) ? hours.join(", ") : String(hours)}</span>
        </div>
      ))}
    </div>
  );
}

function PopularTimes({ popularTimes }) {
  if (!popularTimes || typeof popularTimes !== "object") {
    return <p className="rounded-xl bg-[#f8fafc] p-3 text-[8px] text-[#667085]">Data waktu ramai belum tersedia.</p>;
  }
  const dayData = popularTimes[todayNames().en] || Object.values(popularTimes)[0];
  if (!dayData || typeof dayData !== "object") return null;
  const hours = [8, 10, 12, 14, 16, 18, 20];
  return (
    <div>
      <div className="flex h-[74px] items-end justify-between gap-1 rounded-[12px] bg-[#f7fbfa] px-3 pb-2 pt-3">
        {hours.map((hour) => {
          const value = Number(dayData[hour] ?? dayData[String(hour)] ?? 0);
          return (
            <span key={hour} className="flex h-full flex-1 flex-col items-center justify-end gap-1">
              <span className="w-full max-w-3 rounded-t bg-[#35cbb0]" style={{ height: `${Math.max(5, value)}%` }} title={`${hour}.00 · ${value}% ramai`} />
              <small className="text-[6px] text-[#98a2b3]">{hour}</small>
            </span>
          );
        })}
      </div>
      <p className="mt-1 text-[6px] text-[#98a2b3]">Popularitas per jam dari sumber tempat</p>
    </div>
  );
}

function MiniLocationMap({ detail }) {
  const mapsUrl = detail.mapsUrl || `https://www.google.com/maps/search/?api=1&query=${detail.latitude},${detail.longitude}`;
  return (
    <div>
      <div className="relative h-[126px] overflow-hidden rounded-[14px] border border-[#d5ebe7] bg-[#e6f7f3]">
        <div className="absolute inset-0 opacity-70 [background-image:linear-gradient(#acdcd3_1px,transparent_1px),linear-gradient(90deg,#acdcd3_1px,transparent_1px)] [background-size:48px_38px]" />
        <div className="absolute left-[18%] top-0 h-full w-4 rotate-[18deg] bg-white/80" />
        <div className="absolute inset-x-0 top-[56%] h-4 -rotate-[5deg] bg-white/80" />
        <span className="absolute left-1/2 top-1/2 grid size-8 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-4 border-white bg-[#12a594] text-white shadow"><MapPin className="size-4" /></span>
        <a href={mapsUrl} target="_blank" rel="noreferrer" className="absolute bottom-3 right-3 rounded-full bg-[#12a594] px-3 py-1.5 text-[7px] font-extrabold text-white shadow">Buka di Maps <ExternalLink className="ml-1 inline size-2.5" /></a>
      </div>
      <p className="mt-2 text-[7px] leading-4 text-[#98a2b3]">{detail.address}</p>
    </div>
  );
}

function RatingInput({ value, onChange, label }) {
  return (
    <fieldset>
      <legend className="text-[8px] font-extrabold uppercase tracking-[.08em] text-[#667085]">{label}</legend>
      <div className="mt-2 flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button key={star} type="button" onClick={() => onChange(star)} aria-label={`${star} bintang`} className="p-0.5">
            <Star className={`size-5 ${star <= value ? "fill-[#f6b91f] text-[#f6b91f]" : "text-[#d7dde2]"}`} />
          </button>
        ))}
      </div>
    </fieldset>
  );
}

function ReviewForm({ detail, onBack, onPublished, session, onLogin }) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [rating, setRating] = useState(5);
  const [accessibilityRating, setAccessibilityRating] = useState(5);
  const [features, setFeatures] = useState([]);
  const [photo, setPhoto] = useState(null);
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");

  function toggleFeature(feature) {
    setFeatures((current) => current.includes(feature) ? current.filter((item) => item !== feature) : [...current, feature]);
  }

  async function submit(event) {
    event.preventDefault();
    if (!session) return onLogin();
    setStatus("loading");
    setMessage("");
    try {
      const form = new FormData();
      form.append("externalId", detail.externalId);
      form.append("name", detail.name);
      form.append("address", detail.address || "");
      form.append("latitude", String(detail.latitude));
      form.append("longitude", String(detail.longitude));
      form.append("title", title);
      form.append("content", content);
      form.append("rating", String(rating));
      form.append("accessibilityRating", String(accessibilityRating));
      form.append("features", JSON.stringify(features));
      if (photo) form.append("photo", photo);
      await apiRequest("/community-places/posts", { method: "POST", body: form });
      await onPublished();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Ulasan gagal diterbitkan.");
      setStatus("error");
    }
  }

  return (
    <form onSubmit={submit} className="min-h-full bg-white">
      <div className="sticky top-0 z-10 flex items-center border-b border-[#edf0f2] bg-white px-4 py-3">
        <button type="button" onClick={onBack} aria-label="Kembali ke detail tempat" className="grid size-8 place-items-center rounded-full bg-[#f3f5f6]"><ArrowLeft className="size-4" /></button>
        <div className="ml-3"><span className="block text-[8px] font-bold text-[#98a2b3]">Direktori Bogor</span><b className="text-[13px]">Tulis Ulasan</b></div>
      </div>
      <div className="space-y-5 p-4">
        <div className="rounded-[14px] bg-[#effaf8] p-3"><b className="block truncate text-[10px] text-[#0c6478]">{detail.name}</b><p className="mt-1 truncate text-[8px] text-[#667085]">{detail.address}</p></div>
        {!session && <button type="button" onClick={onLogin} className="w-full rounded-xl bg-[#fff7ed] p-3 text-left text-[8px] font-bold text-[#9a3412]">Masuk terlebih dahulu untuk menulis ulasan.</button>}
        <label className="block"><span className="text-[8px] font-extrabold uppercase tracking-[.08em] text-[#667085]">Judul</span><input required minLength={4} maxLength={100} value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Contoh: Ramah pengguna kursi roda" className="mt-2 h-11 w-full rounded-[11px] border border-[#dce3e7] px-3 text-[9px] outline-none focus:border-[#35cbb0]" /></label>
        <div className="grid grid-cols-2 gap-4"><RatingInput label="Rating tempat" value={rating} onChange={setRating} /><RatingInput label="Aksesibilitas" value={accessibilityRating} onChange={setAccessibilityRating} /></div>
        <label className="block"><span className="text-[8px] font-extrabold uppercase tracking-[.08em] text-[#667085]">Ulasan</span><textarea required minLength={10} maxLength={3000} value={content} onChange={(event) => setContent(event.target.value)} placeholder="Ceritakan pengalaman aksesibilitasmu..." className="mt-2 h-28 w-full resize-none rounded-[11px] border border-[#dce3e7] p-3 text-[9px] leading-4 outline-none focus:border-[#35cbb0]" /></label>
        <fieldset><legend className="text-[8px] font-extrabold uppercase tracking-[.08em] text-[#667085]">Fasilitas yang ada</legend><div className="mt-2 grid grid-cols-2 gap-2">{reviewFeatures.map(([value, label]) => <label key={value} className={`flex cursor-pointer items-center gap-2 rounded-[10px] border p-2.5 text-[8px] font-bold ${features.includes(value) ? "border-[#35cbb0] bg-[#effaf8] text-[#0c6478]" : "border-[#e4e7ec] text-[#667085]"}`}><input type="checkbox" checked={features.includes(value)} onChange={() => toggleFeature(value)} className="accent-[#0c6478]" />{label}</label>)}</div></fieldset>
        <label className="flex cursor-pointer items-center justify-center gap-2 rounded-[11px] border border-dashed border-[#cbd5dc] p-3 text-[8px] font-bold text-[#667085]"><input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => setPhoto(event.target.files?.[0] || null)} className="sr-only" /><ImagePlus className="size-4" />{photo ? photo.name : "Tambah foto (opsional)"}</label>
        {message && <p role="alert" className="rounded-xl bg-[#fff1f2] p-3 text-[8px] font-bold text-[#b42318]">{message}</p>}
        <button disabled={status === "loading" || !session} className="h-11 w-full rounded-[11px] bg-[#12a594] text-[9px] font-extrabold text-white disabled:opacity-50">{status === "loading" ? "Menerbitkan..." : "Publikasikan Ulasan"}</button>
      </div>
    </form>
  );
}

export default function DirectoryPlaceDetail({ detail, onClose, onUseAsDestination, session, onLogin }) {
  const [place, setPlace] = useState(detail);
  const [view, setView] = useState("detail");

  function switchView(nextView) {
    setView(nextView);
    window.requestAnimationFrame(() => {
      document.querySelector("[data-directory-place-detail]")?.scrollTo({ top: 0, behavior: "auto" });
    });
  }

  async function refreshAfterReview() {
    const refreshed = await apiRequest(`/destinations/${encodeURIComponent(place.externalId)}`);
    setPlace(refreshed);
    switchView("detail");
  }

  const imageUrl = place.images?.[0]?.imageUrl || place.primaryImageUrl;
  const availableEvidence = (place.accessibilityEvidence || []).filter((item) => item.available === true).slice(0, 8);
  const reviews = place.posts || [];
  const overview = reviews[0]?.content || place.description;
  const todayHours = place.openingHours?.[todayNames().id];

  return (
    <MotionSurface data-directory-place-detail as="aside" direction="left" distance={26} className="absolute inset-0 z-[55] overflow-y-auto bg-white sm:bottom-3 sm:left-auto sm:right-3 sm:top-3 sm:w-[360px] sm:rounded-[16px] sm:border sm:border-[#e7ebed] sm:shadow-[0_14px_36px_rgba(24,46,58,.22)]">
      {view === "review" ? (
        <ReviewForm detail={place} onBack={() => switchView("detail")} onPublished={refreshAfterReview} session={session} onLogin={onLogin} />
      ) : (
        <>
          <div className="relative h-[154px] overflow-hidden bg-[#dff4f0]">
            {imageUrl ? <Image unoptimized fill sizes="360px" src={imageUrl} alt={`Foto ${place.name}`} className="object-cover" /> : <div className="absolute inset-0 grid place-items-center text-[#0c6478]"><MapPin className="size-8" /></div>}
            <div className="absolute inset-0 bg-gradient-to-t from-[#102f3b]/80 via-transparent to-black/10" />
            <button type="button" onClick={onClose} aria-label="Tutup detail direktori" className="absolute left-3 top-3 grid size-8 place-items-center rounded-full bg-white/90 text-[#344054] shadow"><ArrowLeft className="size-4" /></button>
            <span className="absolute right-3 top-3 rounded-full bg-[#12a594] px-2.5 py-1 text-[7px] font-extrabold text-white">{place.category || "Tempat"}</span>
            <div className="absolute inset-x-4 bottom-3 text-white"><h2 className="text-[15px] font-extrabold leading-5">{place.name}</h2><p className="mt-1 flex items-center gap-1 text-[7px]"><MapPin className="size-3" />Bogor, Jawa Barat</p></div>
            <span className="absolute bottom-3 right-3 flex items-center gap-1 rounded-full bg-[#172b34]/85 px-2 py-1 text-[8px] font-extrabold text-white"><Star className="size-3 fill-[#f6b91f] text-[#f6b91f]" />{place.googleRating ?? "—"}</span>
          </div>

          <div className="space-y-5 p-4">
            <div className="flex flex-wrap gap-1.5 text-[7px] font-bold">
              <span className="rounded-full bg-[#f3f5f6] px-2.5 py-1.5 text-[#667085]">{place.category || "Tempat di Bogor"}</span>
              {todayHours && <span className="rounded-full bg-[#f3f5f6] px-2.5 py-1.5 text-[#667085]"><Clock3 className="mr-1 inline size-3" />{Array.isArray(todayHours) ? todayHours.join(", ") : String(todayHours)}</span>}
              {place.businessStatus && <span className="rounded-full bg-[#effaf8] px-2.5 py-1.5 text-[#0c796d]"><Check className="mr-1 inline size-3" />{place.businessStatus === "OPERATIONAL" ? "Beroperasi" : place.businessStatus}</span>}
            </div>

            <div className="flex flex-wrap gap-1.5">{availableEvidence.slice(0, 4).map((item) => <span key={item.featureCode} className="rounded-full bg-[#eaf8f3] px-2.5 py-1.5 text-[7px] font-extrabold text-[#0c796d]"><Check className="mr-1 inline size-3" />{featureNames[item.featureCode] || item.featureName}</span>)}</div>

            {overview ? <blockquote className="rounded-[12px] border-l-[3px] border-[#35cbb0] bg-[#f8fafc] p-3 text-[8px] leading-4 text-[#667085]">“{overview}”</blockquote> : <p className="rounded-[12px] bg-[#f8fafc] p-3 text-[8px] leading-4 text-[#667085]">Deskripsi komunitas belum tersedia.</p>}

            <button type="button" onClick={() => onUseAsDestination(place)} className="flex h-10 w-full items-center justify-center gap-2 rounded-[11px] bg-[#0c6478] text-[9px] font-extrabold text-white"><Route className="size-4" />Gunakan sebagai tujuan</button>

            <section>
              <h3 className="text-[8px] font-extrabold uppercase tracking-[.1em] text-[#667085]">Fasilitas aksesibel</h3>
              {availableEvidence.length ? <div className="mt-2 grid grid-cols-2 gap-2">{availableEvidence.map((item) => <div key={item.featureCode} className="flex items-center gap-2 rounded-[10px] bg-[#effaf8] p-2.5 text-[#0c796d]"><span className="grid size-5 shrink-0 place-items-center rounded-full bg-white"><Check className="size-3" /></span><b className="text-[7px]">{featureNames[item.featureCode] || item.featureName}</b></div>)}</div> : <p className="mt-2 rounded-xl bg-[#fff7ed] p-3 text-[8px] leading-4 text-[#9a3412]">Belum ada bukti fasilitas aksesibel.</p>}
            </section>

            <section className="grid grid-cols-2 gap-3">
              <div><h3 className="mb-2 text-[8px] font-extrabold uppercase tracking-[.1em] text-[#667085]">Jam buka</h3><OpeningHours openingHours={place.openingHours} /></div>
              <div><h3 className="mb-2 text-[8px] font-extrabold uppercase tracking-[.1em] text-[#667085]">Waktu ramai</h3><PopularTimes popularTimes={place.popularTimes} /></div>
            </section>

            <section>
              <div className="flex items-center justify-between"><h3 className="text-[8px] font-extrabold uppercase tracking-[.1em] text-[#667085]">Lokasi</h3>{place.mapsUrl && <a href={place.mapsUrl} target="_blank" rel="noreferrer" className="text-[7px] font-bold text-[#0c796d]">Lihat sumber</a>}</div>
              <div className="mt-2"><MiniLocationMap detail={place} /></div>
            </section>

            <section className="border-t border-[#edf0f2] pt-4">
              <div className="flex items-center justify-between"><div><h3 className="text-[9px] font-extrabold text-[#172b34]">Ulasan ({reviews.length})</h3><p className="mt-0.5 text-[7px] text-[#98a2b3]">Pengalaman komunitas AksesKota</p></div><button type="button" onClick={() => switchView("review")} className="rounded-full bg-[#12a594] px-3 py-1.5 text-[7px] font-extrabold text-white"><MessageCircle className="mr-1 inline size-3" />Tulis</button></div>
              {reviews.length ? <div className="mt-3 space-y-2.5">{reviews.slice(0, 6).map((post) => <article key={post.id} className="rounded-[13px] border border-[#edf0f2] p-3"><div className="flex items-center gap-2"><span className="grid size-7 place-items-center rounded-full bg-[#12a594] text-[9px] font-extrabold text-white">{post.author?.name?.[0]?.toUpperCase() || "A"}</span><div className="min-w-0 flex-1"><b className="block truncate text-[8px]">{post.author?.name || "Komunitas"}</b><span className="flex gap-0.5">{[1,2,3,4,5].map((star) => <Star key={star} className={`size-2.5 ${star <= post.accessibilityRating ? "fill-[#f6b91f] text-[#f6b91f]" : "text-[#d7dde2]"}`} />)}</span></div></div><b className="mt-2 block text-[8px] text-[#344054]">{post.title}</b><p className="mt-1 text-[8px] leading-4 text-[#667085]">{post.content}</p>{Array.isArray(post.features) && <div className="mt-2 flex flex-wrap gap-1">{post.features.map((feature) => <span key={feature} className="rounded-full bg-[#effaf8] px-2 py-1 text-[6px] font-bold text-[#0c796d]">{featureNames[feature] || feature}</span>)}</div>}</article>)}</div> : <p className="mt-3 rounded-xl bg-[#f8fafc] p-3 text-[8px] leading-4 text-[#667085]">Belum ada ulasan komunitas. Jadilah orang pertama yang membagikan pengalaman aksesibilitas.</p>}
            </section>
          </div>
        </>
      )}
    </MotionSurface>
  );
}
