"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { gsap } from "gsap";
import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
} from "firebase/auth";
import { auth, isFirebaseConfigured } from "@/lib/firebase";

const profiles = [
  { id: "wheelchair", icon: "♿", label: "Kursi Roda", detail: "Bebas tangga, ramp tersedia" },
  { id: "elderly", icon: "🧓", label: "Lansia", detail: "Bangku & pencahayaan optimal" },
  { id: "stroller", icon: "👶", label: "Stroller", detail: "Trotoar lebar & ramp" },
  { id: "low-vision", icon: "👁️", label: "Low Vision", detail: "Guiding block & lampu jalan" },
  { id: "walking", icon: "🚶", label: "Pejalan Kaki", detail: "Preferensi kenyamanan umum" },
];

const authMessages = {
  "auth/popup-closed-by-user": "Login Google dibatalkan.",
  "auth/weak-password": "Password perlu minimal 6 karakter.",
  "auth/invalid-email": "Format email belum benar.",
  "auth/email-already-in-use": "Email ini sudah memiliki akun. Silakan masuk.",
  "auth/network-request-failed": "Koneksi bermasalah. Coba lagi setelah jaringan stabil.",
};

function GoogleMark() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5">
      <path fill="#4285F4" d="M21.6 12.23c0-.71-.06-1.4-.18-2.07H12v3.92h5.38a4.6 4.6 0 0 1-2 3.02v2.54h3.24c1.9-1.75 2.98-4.33 2.98-7.41Z" />
      <path fill="#34A853" d="M12 22c2.7 0 4.98-.9 6.64-2.42l-3.24-2.54c-.9.6-2.05.96-3.4.96-2.61 0-4.82-1.76-5.61-4.13H3.04v2.62A10 10 0 0 0 12 22Z" />
      <path fill="#FBBC05" d="M6.39 13.87A6.02 6.02 0 0 1 6.08 12c0-.65.11-1.28.31-1.87V7.51H3.04A10 10 0 0 0 2 12c0 1.61.38 3.14 1.04 4.49l3.35-2.62Z" />
      <path fill="#EA4335" d="M12 6c1.47 0 2.79.5 3.83 1.5l2.88-2.88A9.64 9.64 0 0 0 12 2a10 10 0 0 0-8.96 5.51l3.35 2.62C7.18 7.76 9.39 6 12 6Z" />
    </svg>
  );
}

const landscapeTrees = [
  { x: 95, base: 965, height: 150, radius: 42 },
  { x: 220, base: 960, height: 205, radius: 54 },
  { x: 350, base: 965, height: 165, radius: 43 },
  { x: 515, base: 963, height: 235, radius: 60 },
  { x: 735, base: 966, height: 178, radius: 46 },
  { x: 915, base: 962, height: 210, radius: 55 },
  { x: 1120, base: 965, height: 245, radius: 62 },
  { x: 1320, base: 965, height: 170, radius: 45 },
];

function NightLandscape({ scene }) {
  const landscapeRef = useRef(null);

  useLayoutEffect(() => {
    const root = landscapeRef.current;
    if (!root) return undefined;

    const ctx = gsap.context(() => {
      const stars = gsap.utils.toArray(".night-star", root);
      const buildings = gsap.utils.toArray(".night-building", root);
      const trunks = gsap.utils.toArray(".night-tree-trunk", root);
      const crowns = gsap.utils.toArray(".night-tree-crown", root);

      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        gsap.set([...stars, ...buildings, ...trunks, ...crowns], { clearProps: "all" });
        return;
      }

      gsap.set(stars, { autoAlpha: 0, scale: 0.2, transformOrigin: "center center" });
      gsap.set(buildings, { autoAlpha: 0, y: 45 });
      gsap.set(trunks, { autoAlpha: 0.35, scaleY: 0.03, transformOrigin: "center bottom" });
      gsap.set(crowns, { autoAlpha: 0, scale: 0.08, y: 18, transformOrigin: "center bottom" });

      const timeline = gsap.timeline({ defaults: { ease: "power3.out" } });
      timeline
        .to(stars, { autoAlpha: 0.7, scale: 1, duration: 0.5, stagger: 0.12 }, 0.1)
        .to(buildings, { autoAlpha: 1, y: 0, duration: 0.85, stagger: 0.12 }, 0.18)
        .to(trunks, { autoAlpha: 1, scaleY: 1, duration: 0.78, stagger: 0.09 }, 0.35)
        .to(crowns, { autoAlpha: 1, scale: 1, y: 0, duration: 0.62, stagger: 0.09, ease: "back.out(1.8)" }, 0.72);
    }, root);

    return () => ctx.revert();
  }, [scene]);

  return (
    <div ref={landscapeRef} aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden bg-[#224564]">
      <svg viewBox="0 0 1440 1024" preserveAspectRatio="xMidYMid slice" className="size-full" role="presentation">
        <defs>
          <linearGradient id="night-ground" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#04778a" />
            <stop offset=".52" stopColor="#00a0ac" />
            <stop offset="1" stopColor="#04778a" />
          </linearGradient>
          <linearGradient id="tree-leaf" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#4db5a9" />
            <stop offset="1" stopColor="#228f87" />
          </linearGradient>
        </defs>

        <rect width="1440" height="1024" fill="#224564" />
        {[[180,44,6],[350,132,5],[790,72,4],[1060,54,6],[1310,210,5]].map(([cx,cy,radius]) => <circle key={`${cx}-${cy}`} className="night-star" cx={cx} cy={cy} r={radius} fill="#dbe8ec" />)}
        <path d="M0 515C245 510 390 530 565 470C760 403 1010 425 1440 458V1024H0Z" fill="#193554" />
        <path d="M0 724C195 708 330 740 505 695C720 639 840 731 1015 692C1165 659 1280 690 1440 705V1024H0Z" fill="#0d4362" />

        <g className="night-building" opacity=".3" fill="#9ab0bf">
          <rect x="135" y="570" width="118" height="286" rx="18" />
          <rect x="222" y="610" width="93" height="272" rx="18" opacity=".7" />
          {[610,662,714,766].flatMap((y) => [158,204].map((x) => <rect key={`${x}-${y}`} x={x} y={y} width="20" height="24" rx="5" fill="#46b7a8" />))}
        </g>
        <g className="night-building" opacity=".3" fill="#9ab0bf">
          <rect x="1110" y="550" width="112" height="316" rx="18" />
          <rect x="1190" y="594" width="102" height="288" rx="18" opacity=".7" />
          {[592,648,704,760].flatMap((y) => [1132,1175].map((x) => <rect key={`${x}-${y}`} x={x} y={y} width="21" height="25" rx="5" fill="#46b7a8" />))}
        </g>

        {landscapeTrees.map((tree) => {
          const crownY = tree.base - tree.height;
          return (
            <g key={tree.x}>
              <rect className="night-tree-trunk" x={tree.x - 5} y={crownY + tree.radius * 0.42} width="10" height={tree.height - tree.radius * 0.42} rx="5" fill="#07546a" />
              <g className="night-tree-crown">
                <circle cx={tree.x} cy={crownY} r={tree.radius} fill="#07546a" />
                <circle cx={tree.x} cy={crownY} r={tree.radius * 0.73} fill="url(#tree-leaf)" />
                <ellipse cx={tree.x - tree.radius * 0.2} cy={crownY - tree.radius * 0.1} rx={tree.radius * 0.34} ry={tree.radius * 0.55} fill="#8ad0c7" opacity=".35" />
              </g>
            </g>
          );
        })}

        <path d="M0 966C270 974 470 956 690 970C940 986 1190 978 1440 956V1024H0Z" fill="url(#night-ground)" />
      </svg>
    </div>
  );
}

export default function AuthFlow() {
  const router = useRouter();
  const [stage, setStage] = useState("auth");
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [profile, setProfile] = useState("walking");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!auth) return undefined;
    return onAuthStateChanged(auth, (user) => {
      if (user) setStage("profile");
    });
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [stage]);

  function reportAuthError(error) {
    setMessage(authMessages[error?.code] || "Email atau password tidak dapat diproses. Periksa kembali datamu.");
  }

  async function handleEmail(event) {
    event.preventDefault();
    setMessage("");
    if (!isFirebaseConfigured || !auth) {
      setMessage("Firebase belum dikonfigurasi. Isi NEXT_PUBLIC_FIREBASE_* di file .env.local.");
      return;
    }
    setBusy(true);
    try {
      if (mode === "register") await createUserWithEmailAndPassword(auth, email, password);
      else await signInWithEmailAndPassword(auth, email, password);
      setStage("profile");
    } catch (error) {
      reportAuthError(error);
    } finally {
      setBusy(false);
    }
  }

  async function handleGoogle() {
    setMessage("");
    if (!isFirebaseConfigured || !auth) {
      setMessage("Firebase belum dikonfigurasi. Isi NEXT_PUBLIC_FIREBASE_* di file .env.local.");
      return;
    }
    setBusy(true);
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });
      await signInWithPopup(auth, provider);
      setStage("profile");
    } catch (error) {
      reportAuthError(error);
    } finally {
      setBusy(false);
    }
  }

  function continueAsGuest() {
    sessionStorage.setItem("akseskota-auth-mode", "guest");
    setStage("profile");
  }

  function finishProfile() {
    localStorage.setItem("akseskota-profile", profile);
    router.push(`/navigasi?profile=${profile}`);
  }

  if (stage === "profile") {
    return (
      <section className="relative grid min-h-screen place-items-center overflow-hidden px-5 py-20">
        <NightLandscape scene="profile" />
        <div className="relative z-10 w-full max-w-[385px] rounded-[24px] bg-white p-7 shadow-[0_25px_70px_rgba(3,18,37,.3)] sm:p-8">
          <h1 className="text-[25px] leading-tight font-extrabold tracking-[-.035em]">Siapa kamu hari ini?</h1>
          <p className="mt-1 text-[12px] text-[#99a1af]">Pilih profil untuk rute yang paling sesuai.</p>
          <div className="mt-6 space-y-2.5">
            {profiles.map((item) => {
              const selected = profile === item.id;
              return (
                <button type="button" key={item.id} aria-pressed={selected} onClick={() => setProfile(item.id)} className={`flex min-h-[76px] w-full items-center rounded-[16px] border-2 px-4 text-left ${selected ? "border-[#0c6478] bg-[#f0fdfa]" : "border-[#f0f1f3] bg-[#f9fafb]"}`}>
                  <span className={`grid size-11 place-items-center rounded-xl text-[22px] ${selected ? "bg-[#cbfbf1]" : "bg-white"}`}>{item.icon}</span>
                  <span className="ml-4">
                    <strong className="block text-[13px] font-extrabold text-[#344054]">{item.label}</strong>
                    <span className="mt-0.5 block text-[11px] text-[#99a1af]">{item.detail}</span>
                  </span>
                  {selected && <span className="ml-auto grid size-5 place-items-center rounded-full border-2 border-[#0c6478] text-[11px] font-extrabold text-[#0c6478]">✓</span>}
                </button>
              );
            })}
          </div>
          <button type="button" onClick={finishProfile} className="mt-7 w-full rounded-[15px] bg-[#0c6478] py-4 text-[14px] font-extrabold text-white shadow-[0_7px_14px_rgba(12,100,120,.25)]">Lanjut →</button>
          <p className="mt-4 text-center text-[10px] text-[#a8b0be]">Kamu bisa mengubah ini kapan saja</p>
        </div>
      </section>
    );
  }

  return (
    <section className="relative grid min-h-screen place-items-center overflow-hidden px-5 py-24">
      <NightLandscape scene="auth" />
      <div className="absolute inset-0 bg-[#101828]/45 backdrop-blur-[2px]" />
      <div className="relative z-10 w-full max-w-[480px] rounded-[30px] bg-white px-6 py-8 shadow-[0_24px_70px_rgba(0,0,0,.28)] sm:px-8">
        <div className="text-center">
          <h1 className="text-[22px] leading-8 font-extrabold tracking-[-.035em]">{mode === "register" ? "Buat akun AksesKota ✨" : "Selamat datang kembali 👋"}</h1>
          <p className="mt-1 text-[12px] text-[#99a1af]">{mode === "register" ? "Daftar untuk menyimpan rute dan laporan kamu" : "Masuk untuk menyimpan rute dan laporan kamu"}</p>
        </div>

        <form onSubmit={handleEmail} className="mt-6 space-y-4">
          <label className="block">
            <span className="mb-1.5 block text-[10px] font-bold tracking-[.04em] text-[#4a5565] uppercase">Email</span>
            <input type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="kamu@email.com" className="h-[50px] w-full rounded-[15px] border-2 border-[#f0f2f4] bg-[#f9fafb] px-4 text-[13px] font-semibold outline-none focus:border-[#46dfb1] focus:ring-4 focus:ring-[#cbfbf1]/70" />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[10px] font-bold tracking-[.04em] text-[#4a5565] uppercase">Password</span>
            <input type="password" autoComplete={mode === "register" ? "new-password" : "current-password"} required minLength={6} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Minimal 6 karakter" className="h-[50px] w-full rounded-[15px] border-2 border-[#f0f2f4] bg-[#f9fafb] px-4 text-[13px] font-semibold outline-none focus:border-[#46dfb1] focus:ring-4 focus:ring-[#cbfbf1]/70" />
          </label>
          {message && <p role="alert" className="rounded-xl bg-[#fff1f2] px-3 py-2.5 text-[10px] leading-4 font-semibold text-[#b42318]">{message}</p>}
          <button type="submit" disabled={busy} className="h-[52px] w-full rounded-[15px] bg-[#0c6478] text-[14px] font-extrabold text-white shadow-[0_5px_12px_rgba(12,100,120,.25)] disabled:cursor-wait disabled:opacity-60">{busy ? "Memproses..." : mode === "register" ? "Daftar dengan Email" : "Masuk"}</button>
        </form>

        <div className="my-5 flex items-center gap-3 text-[10px] font-semibold text-[#99a1af]"><span className="h-px flex-1 bg-[#e7eaee]" />atau<span className="h-px flex-1 bg-[#e7eaee]" /></div>
        <button type="button" disabled={busy} onClick={handleGoogle} className="flex h-[49px] w-full items-center justify-center gap-3 rounded-[15px] border-2 border-[#e5e7eb] bg-white text-[12px] font-bold text-[#4a5565] disabled:opacity-60"><GoogleMark /> Lanjutkan dengan Google</button>
        <button type="button" onClick={continueAsGuest} className="mt-3 h-[49px] w-full rounded-[15px] border-2 border-[#e5e7eb] text-[12px] font-bold text-[#4a5565]">Lanjut sebagai Tamu</button>

        <p className="mt-6 text-center text-[12px] text-[#99a1af]">
          {mode === "register" ? "Sudah punya akun? " : "Belum punya akun? "}
          <button type="button" onClick={() => { setMode(mode === "register" ? "login" : "register"); setMessage(""); }} className="font-extrabold text-[#0c6478]">{mode === "register" ? "Masuk" : "Daftar sekarang"}</button>
        </p>
      </div>
    </section>
  );
}
