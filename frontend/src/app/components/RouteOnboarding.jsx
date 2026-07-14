"use client";

import { useState } from "react";
import WheelchairIcon from "./WheelchairIcon";
import ElderlyIcon from "./ElderlyIcon";
import StrollerIcon from "./StrollerIcon";
import AllUsersIcon from "./AllUsersIcon";

const profiles = [
  { id: "wheelchair", label: "Kursi Roda", help: "Utamakan ramp dan jalur rata", icon: WheelchairIcon, tone: "text-[#0c6478]" },
  { id: "elderly", label: "Lansia", help: "Utamakan tempat duduk", icon: ElderlyIcon, tone: "text-[#3b82f6]" },
  { id: "stroller", label: "Stroller", help: "Hindari tangga dan jalur sempit", icon: StrollerIcon, tone: "text-[#f59e0b]" },
  { id: "walking", label: "Pejalan Kaki", help: "Rute nyaman dan teduh", icon: AllUsersIcon, tone: "text-[#ef4444]" },
];

export default function RouteOnboarding({ initialProfile = "wheelchair" }) {
  const [profile, setProfile] = useState(initialProfile);
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function swapLocations() {
    setOrigin(destination);
    setDestination(origin);
    setSubmitted(false);
  }

  function handleSubmit(event) {
    event.preventDefault();
    setSubmitted(true);
  }

  const selectedProfile = profiles.find((item) => item.id === profile);

  return (
    <div className="rounded-[28px] border border-white bg-white/90 p-5 shadow-[0_24px_70px_rgba(12,100,120,.14)] backdrop-blur md:p-8">
      <div className="flex items-center justify-between border-b border-[#edf2f3] pb-5">
        <div>
          <p className="text-[11px] font-extrabold tracking-[.12em] text-[#0c6478] uppercase">Rencanakan rute</p>
          <h2 className="mt-1 text-[22px] font-extrabold tracking-[-.03em]">Mulai dari kebutuhanmu</h2>
        </div>
        <span className="rounded-full bg-[#f0fdfa] px-3 py-1.5 text-[10px] font-bold text-[#0c6478]">1 dari 1</span>
      </div>

      <form onSubmit={handleSubmit} className="mt-6">
        <fieldset>
          <legend className="text-[13px] font-extrabold">Pilih profil mobilitas</legend>
          <p className="mt-1 text-[11px] text-[#8993a3]">Pilihan ini menentukan hambatan yang harus dihindari.</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {profiles.map((item) => {
              const Icon = item.icon;
              const active = profile === item.id;
              return (
                <button
                  type="button"
                  key={item.id}
                  aria-pressed={active}
                  onClick={() => { setProfile(item.id); setSubmitted(false); }}
                  className={`flex min-h-[92px] items-center rounded-2xl border-2 p-3.5 text-left transition ${active ? "border-[#46dfb1] bg-[#f0fdfa] shadow-[0_5px_18px_rgba(70,223,177,.12)]" : "border-[#edf1f3] bg-white hover:border-[#bdeee0]"}`}
                >
                  <span className={`grid size-12 shrink-0 place-items-center rounded-xl bg-white p-1.5 shadow-sm ${item.tone}`}>
                    <Icon />
                  </span>
                  <span className="ml-3 min-w-0">
                    <strong className="block text-[12px] font-extrabold">{item.label}</strong>
                    <span className="mt-1 block text-[9px] leading-4 text-[#8993a3]">{item.help}</span>
                  </span>
                  <span aria-hidden="true" className={`ml-auto grid size-5 shrink-0 place-items-center rounded-full border text-[10px] ${active ? "border-[#0c6478] bg-[#0c6478] text-white" : "border-[#dce3e7] text-transparent"}`}>✓</span>
                </button>
              );
            })}
          </div>
        </fieldset>

        <fieldset className="mt-7">
          <legend className="text-[13px] font-extrabold">Mau pergi ke mana?</legend>
          <div className="relative mt-4 space-y-3">
            <label className="block rounded-2xl border border-[#e3eaed] bg-[#f8fafb] px-4 py-3 focus-within:border-[#46dfb1] focus-within:ring-4 focus-within:ring-[#cbfbf1]/60">
              <span className="block text-[9px] font-bold tracking-[.08em] text-[#8993a3] uppercase">Lokasi awal</span>
              <span className="mt-1 flex items-center gap-2">
                <span aria-hidden="true" className="size-2.5 rounded-full border-[3px] border-[#0c6478]" />
                <input value={origin} onChange={(event) => { setOrigin(event.target.value); setSubmitted(false); }} required placeholder="Contoh: Simpang Lima" className="min-w-0 flex-1 bg-transparent text-[12px] font-semibold outline-none placeholder:font-normal placeholder:text-[#b0b7c2]" />
              </span>
            </label>

            <button type="button" onClick={swapLocations} aria-label="Tukar lokasi awal dan tujuan" className="absolute right-5 top-[54px] z-10 grid size-8 place-items-center rounded-full border border-[#dfe8ea] bg-white text-[14px] font-bold text-[#0c6478] shadow-sm">⇅</button>

            <label className="block rounded-2xl border border-[#e3eaed] bg-[#f8fafb] px-4 py-3 focus-within:border-[#46dfb1] focus-within:ring-4 focus-within:ring-[#cbfbf1]/60">
              <span className="block text-[9px] font-bold tracking-[.08em] text-[#8993a3] uppercase">Tujuan</span>
              <span className="mt-1 flex items-center gap-2">
                <span aria-hidden="true" className="grid size-3 place-items-center text-[#ef4444]">●</span>
                <input value={destination} onChange={(event) => { setDestination(event.target.value); setSubmitted(false); }} required placeholder="Contoh: Balai Kota" className="min-w-0 flex-1 bg-transparent text-[12px] font-semibold outline-none placeholder:font-normal placeholder:text-[#b0b7c2]" />
              </span>
            </label>
          </div>
        </fieldset>

        <button type="submit" className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-[#0c6478] px-6 py-4 text-[13px] font-extrabold text-white shadow-[0_10px_22px_rgba(12,100,120,.24)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#0c6478]">
          Cari Rute Aksesibel <span aria-hidden="true">→</span>
        </button>
      </form>

      {submitted && (
        <div role="status" className="mt-5 rounded-2xl border border-[#bdeee0] bg-[#f0fdfa] p-4">
          <div className="flex gap-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-[#46dfb1] text-sm text-[#064e45]">✓</span>
            <div>
              <strong className="block text-[12px]">Preferensi perjalanan tersimpan</strong>
              <p className="mt-1 text-[10px] leading-4 text-[#5f6c7b]">
                Profil {selectedProfile?.label} untuk perjalanan dari <b>{origin}</b> ke <b>{destination}</b>. Integrasikan API peta untuk menampilkan rekomendasi rute aktual.
              </p>
            </div>
          </div>
        </div>
      )}

      <p className="mt-5 text-center text-[9px] leading-4 text-[#9aa3af]">AksesKota tidak membagikan profil mobilitasmu tanpa izin.</p>
    </div>
  );
}
