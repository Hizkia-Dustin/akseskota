"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { AlertTriangle, ArrowLeft, CheckCircle2, Clock3, RefreshCw, ShieldCheck, XCircle } from "lucide-react";
import { apiRequest, getStoredSession } from "@/lib/api";

const typeLabels = {
  STAIRS: "Tangga menghalangi",
  POTHOLE: "Trotoar/jalan rusak",
  FLOOD: "Genangan air",
  PARKED_VEHICLE: "Jalur tertutup kendaraan",
  CONSTRUCTION: "Pekerjaan konstruksi",
  FALLEN_TREE: "Pohon tumbang",
};

export default function ReportModerationDashboard() {
  const router = useRouter();
  const [session, setSession] = useState(null);
  const [reports, setReports] = useState([]);
  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("");
  const [processing, setProcessing] = useState(null);

  const loadQueue = useCallback(async () => {
    const stored = getStoredSession();
    setSession(stored);
    if (!stored || !["MODERATOR", "ADMIN"].includes(stored.user?.role)) {
      setStatus("forbidden");
      return;
    }
    setStatus("loading");
    try {
      setReports(await apiRequest("/moderator/queue"));
      setStatus("ready");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Antrian gagal dimuat.");
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(loadQueue, 0);
    return () => window.clearTimeout(timer);
  }, [loadQueue]);

  async function moderate(id, action) {
    setProcessing(id);
    setMessage("");
    try {
      await apiRequest(`/moderator/reports/${id}/${action}`, { method: "PATCH", body: JSON.stringify({}) });
      setReports((items) => items.filter((item) => item.id !== id));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Status laporan gagal diubah.");
    } finally {
      setProcessing(null);
    }
  }

  if (status === "forbidden") return <main className="grid min-h-screen place-items-center bg-[#eef3f4] p-6"><div className="max-w-md rounded-[24px] bg-white p-8 text-center shadow-xl"><ShieldCheck className="mx-auto size-10 text-[#0c6478]"/><h1 className="mt-4 text-xl font-extrabold">Akses moderator diperlukan</h1><p className="mt-2 text-sm text-[#667085]">Masuk menggunakan akun moderator atau admin untuk memeriksa laporan warga.</p><button onClick={()=>router.push('/masuk')} className="mt-6 rounded-full bg-[#0c6478] px-6 py-3 text-sm font-bold text-white">Masuk</button></div></main>;

  return <main className="min-h-screen bg-[#eef3f4] px-4 py-6 text-[#101828] sm:px-8 sm:py-8">
    <div className="mx-auto max-w-6xl">
      <header className="flex flex-wrap items-center gap-4 rounded-[24px] bg-gradient-to-r from-[#0c6478] to-[#173c61] p-6 text-white shadow-xl">
        <button onClick={()=>router.push('/navigasi')} aria-label="Kembali ke peta" className="grid size-11 place-items-center rounded-full bg-white/15"><ArrowLeft className="size-5"/></button>
        <div><p className="text-xs font-bold text-[#7be3dc]">AKSESKOTA</p><h1 className="text-2xl font-extrabold">Moderasi Laporan</h1><p className="mt-1 text-xs text-white/70">{session?.user?.name} · {session?.user?.role}</p></div>
        <button onClick={loadQueue} className="ml-auto flex items-center gap-2 rounded-full bg-white px-4 py-2.5 text-xs font-bold text-[#0c6478]"><RefreshCw className="size-4"/>Muat ulang</button>
      </header>

      <section className="mt-6 grid gap-4 sm:grid-cols-3">
        <article className="rounded-[20px] bg-white p-5 shadow-sm"><Clock3 className="size-5 text-[#f59e0b]"/><b className="mt-3 block text-3xl">{reports.length}</b><span className="text-xs text-[#667085]">Menunggu verifikasi</span></article>
        <article className="rounded-[20px] bg-white p-5 shadow-sm"><AlertTriangle className="size-5 text-[#7c3aed]"/><b className="mt-3 block text-3xl">{reports.filter(report=>report.obstacle).length}</b><span className="text-xs text-[#667085]">Laporan hambatan bertitik</span></article>
        <article className="rounded-[20px] bg-white p-5 shadow-sm"><ShieldCheck className="size-5 text-[#0c6478]"/><b className="mt-3 block text-sm">Tidak otomatis aktif</b><span className="mt-2 block text-xs leading-5 text-[#667085]">Hambatan baru memengaruhi rute setelah disetujui.</span></article>
      </section>

      {message && <p role="alert" className="mt-5 rounded-[16px] bg-[#fff1f2] p-4 text-sm font-semibold text-[#b42318]">{message}</p>}
      {status === "loading" && <div className="mt-6 grid gap-4 md:grid-cols-2">{[1,2,3,4].map(item=><div key={item} className="h-56 animate-pulse rounded-[22px] bg-white"/>)}</div>}
      {status === "ready" && reports.length === 0 && <div className="mt-6 rounded-[24px] bg-white p-12 text-center shadow-sm"><CheckCircle2 className="mx-auto size-10 text-[#12a594]"/><h2 className="mt-4 text-lg font-extrabold">Antrian sudah bersih</h2><p className="mt-2 text-sm text-[#667085]">Belum ada laporan baru yang perlu diperiksa.</p></div>}
      {status === "ready" && <div className="mt-6 grid gap-4 md:grid-cols-2">{reports.map(report=><article key={report.id} className="overflow-hidden rounded-[22px] bg-white shadow-sm">
        <Image unoptimized width={720} height={384} src={report.photoUrl} alt="Bukti kondisi yang dilaporkan" className="h-48 w-full bg-[#e5e7eb] object-cover"/>
        <div className="p-5"><div className="flex items-start gap-3"><span className="rounded-full bg-[#fff7ed] px-3 py-1.5 text-[10px] font-extrabold text-[#a34b00]">BELUM DIVERIFIKASI</span><time className="ml-auto text-[10px] text-[#98a2b3]">{new Date(report.createdAt).toLocaleString('id-ID')}</time></div><p className="mt-4 text-[10px] font-bold uppercase tracking-wide text-[#0c6478]">{typeLabels[report.obstacle?.type] || report.targetType}</p><h2 className="mt-1 text-base font-extrabold">{report.title || "Laporan hambatan"}</h2><p className="mt-2 min-h-10 text-xs leading-5 text-[#667085]">{report.description || "Tanpa deskripsi"}</p><p className="mt-3 text-[10px] font-semibold text-[#98a2b3]">Dilaporkan oleh {report.user?.name || "Guest"}</p>
          <div className="mt-5 grid grid-cols-3 gap-2"><button disabled={processing===report.id} onClick={()=>moderate(report.id,'approve')} className="rounded-xl bg-[#0c6478] px-2 py-3 text-[10px] font-extrabold text-white disabled:opacity-50"><CheckCircle2 className="mx-auto mb-1 size-4"/>Setujui</button><button disabled={processing===report.id} onClick={()=>moderate(report.id,'needs-recheck')} className="rounded-xl bg-[#ede9fe] px-2 py-3 text-[10px] font-extrabold text-[#6d28d9] disabled:opacity-50"><RefreshCw className="mx-auto mb-1 size-4"/>Cek ulang</button><button disabled={processing===report.id} onClick={()=>moderate(report.id,'reject')} className="rounded-xl bg-[#fee2e2] px-2 py-3 text-[10px] font-extrabold text-[#b42318] disabled:opacity-50"><XCircle className="mx-auto mb-1 size-4"/>Tolak</button></div>
        </div>
      </article>)}</div>}
    </div>
  </main>;
}
