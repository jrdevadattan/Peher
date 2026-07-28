import { useState } from "react";
import { Database, Download, ShieldCheck, RefreshCw } from "lucide-react";

export function BackupView() {
  const [backups, setBackups] = useState([
    { id: "b-1", filename: "peher_db_backup_2026-07-28.json", size: "4.8 MB", date: "2026-07-28 00:00:00" },
    { id: "b-2", filename: "peher_db_backup_2026-07-21.json", size: "4.6 MB", date: "2026-07-21 00:00:00" },
  ]);

  const handleGenerateBackup = () => {
    const newB = {
      id: `b-${Date.now()}`,
      filename: `peher_db_backup_${new Date().toISOString().substring(0, 10)}.json`,
      size: "4.9 MB",
      date: new Date().toISOString().replace("T", " ").substring(0, 19),
    };
    setBackups([newB, ...backups]);
  };

  return (
    <div className="space-y-6 fade-up">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="font-serif text-3xl md:text-4xl tracking-tight">Database Backup & Disaster Recovery</h1>
          <p className="text-xs text-muted-foreground mt-1">
            Automated daily database snapshots, one-click manual exports, and point-in-time restoration.
          </p>
        </div>
        <button
          onClick={handleGenerateBackup}
          className="inline-flex items-center gap-2 bg-neutral-900 text-white px-5 py-2.5 rounded-lg text-xs font-semibold uppercase tracking-wider hover:bg-[#D8E7D2] hover:text-black transition"
        >
          <Database className="w-4 h-4" /> Create Snapshot Now
        </button>
      </div>

      <div className="bg-card border border-border rounded-xl shadow-xs overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-muted/50 border-b border-border uppercase text-[10px] text-muted-foreground tracking-wider">
            <tr>
              <th className="p-4">Snapshot File</th>
              <th className="p-4">File Size</th>
              <th className="p-4">Timestamp</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border font-mono text-[11px]">
            {backups.map((b) => (
              <tr key={b.id} className="hover:bg-muted/30">
                <td className="p-4 font-bold text-xs text-foreground">{b.filename}</td>
                <td className="p-4 font-semibold">{b.size}</td>
                <td className="p-4 text-muted-foreground">{b.date}</td>
                <td className="p-4 text-right">
                  <button
                    onClick={() => alert(`Downloading snapshot ${b.filename}...`)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-border rounded-lg text-[11px] font-sans font-semibold uppercase tracking-wider hover:bg-neutral-900 hover:text-white transition"
                  >
                    <Download className="w-3.5 h-3.5" /> Download
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
