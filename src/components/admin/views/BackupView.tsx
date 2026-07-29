import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Database, Download, RotateCcw, ShieldCheck } from "lucide-react";
import {
  createApplicationBackup,
  exportApplicationBackup,
  getApplicationBackups,
  restoreApplicationBackup,
} from "@/lib/admin-api";
import { AdminTableRowsSkeleton } from "@/components/loading-skeletons";

export function BackupView() {
  const queryClient = useQueryClient();
  const { data: backups = [], isLoading, error } = useQuery({
    queryKey: ["admin", "backups"],
    queryFn: getApplicationBackups,
  });
  const [busy, setBusy] = useState("");
  const [message, setMessage] = useState("");

  const create = async () => {
    setBusy("create");
    setMessage("");
    try {
      await createApplicationBackup(`Manual snapshot ${new Date().toLocaleString("en-IN")}`, "Created from the Peher admin console");
      await queryClient.invalidateQueries({ queryKey: ["admin", "backups"] });
      setMessage("Application snapshot created.");
    } finally {
      setBusy("");
    }
  };

  const download = async (id: string, name: string) => {
    setBusy(id);
    try {
      const payload = await exportApplicationBackup(id);
      const url = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" }));
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `${name.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.json`;
      anchor.click();
      URL.revokeObjectURL(url);
    } finally {
      setBusy("");
    }
  };

  const restore = async (id: string, name: string) => {
    const confirmation = prompt(`Type the snapshot name exactly to restore it:\n${name}`);
    if (confirmation === null) return;
    setBusy(id);
    setMessage("");
    try {
      await restoreApplicationBackup(id, confirmation);
      await queryClient.invalidateQueries();
      setMessage("Snapshot restored. A pre-restore safety snapshot was created automatically.");
    } finally {
      setBusy("");
    }
  };

  return (
    <div className="space-y-6 fade-up">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl md:text-4xl">Backup & Restore</h1>
          <p className="mt-1 text-xs text-muted-foreground">Versioned application snapshots stored securely in Supabase.</p>
        </div>
        <button onClick={() => void create()} disabled={Boolean(busy)} className="inline-flex items-center gap-2 rounded-lg bg-neutral-900 px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-white disabled:opacity-40"><Database className="h-4 w-4" /> {busy === "create" ? "Creating..." : "Create snapshot"}</button>
      </div>
      <section className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-5">
        <div className="flex gap-3"><ShieldCheck className="h-5 w-5 text-emerald-700" /><div><p className="text-sm font-semibold">Safe, non-destructive recovery</p><p className="mt-1 text-xs text-muted-foreground">Restore is Owner-only, requires exact-name confirmation, creates a safety snapshot first, and merges records without deleting newer data. Supabase infrastructure backups remain the disaster-recovery layer.</p></div></div>
      </section>
      {message && <p className="rounded-lg bg-emerald-100 p-3 text-xs font-semibold text-emerald-800">{message}</p>}
      {error && <p className="rounded-lg bg-red-50 p-3 text-xs text-red-700">Snapshots could not be loaded.</p>}
      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        <table className="w-full min-w-[760px] text-left text-xs">
          <thead className="border-b border-border bg-muted/50 text-[10px] uppercase tracking-wider"><tr><th className="p-4">Snapshot</th><th>Created</th><th>Status</th><th className="pr-4 text-right">Actions</th></tr></thead>
          <tbody className="divide-y divide-border">
            {isLoading ? <AdminTableRowsSkeleton columns={4} rows={5} /> : backups.map((backup) => (
              <tr key={backup.id}><td className="p-4"><p className="font-semibold">{backup.name}</p><p className="mt-1 text-[10px] text-muted-foreground">{backup.description}</p></td><td>{new Date(backup.createdAt).toLocaleString("en-IN")}</td><td><span className="rounded-full bg-[#D8E7D2] px-2.5 py-1 text-[9px] font-semibold uppercase">{backup.status}</span></td><td className="pr-4"><div className="flex justify-end gap-2"><button disabled={busy === backup.id} onClick={() => void download(backup.id, backup.name)} className="rounded-lg border border-border p-2" title="Export JSON"><Download className="h-4 w-4" /></button><button disabled={busy === backup.id} onClick={() => void restore(backup.id, backup.name)} className="inline-flex items-center gap-2 rounded-lg border border-amber-200 px-3 py-2 font-semibold text-amber-800"><RotateCcw className="h-4 w-4" /> Restore</button></div></td></tr>
            ))}
          </tbody>
        </table>
        {!isLoading && !backups.length && <p className="p-10 text-center text-sm text-muted-foreground">No application snapshots yet.</p>}
      </div>
    </div>
  );
}
