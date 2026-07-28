import { useState } from "react";
import { AdminStore, type ActivityLog } from "@/lib/admin-store";
import { Shield, Clock, Terminal } from "lucide-react";

export function ActivityLogsView() {
  const [logs] = useState<ActivityLog[]>(AdminStore.logs);

  return (
    <div className="space-y-6 fade-up">
      <div>
        <h1 className="font-serif text-3xl md:text-4xl tracking-tight">System Activity Audit Trail</h1>
        <p className="text-xs text-muted-foreground mt-1">
          Immutable log of administrative logins, product edits, status changes, and settings updates.
        </p>
      </div>

      <div className="bg-card border border-border rounded-xl shadow-xs overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-muted/50 border-b border-border uppercase text-[10px] text-muted-foreground tracking-wider">
            <tr>
              <th className="p-4">Timestamp</th>
              <th className="p-4">User</th>
              <th className="p-4">Role</th>
              <th className="p-4">Action</th>
              <th className="p-4">Details</th>
              <th className="p-4">IP Address</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border font-mono text-[11px]">
            {logs.map((l) => (
              <tr key={l.id} className="hover:bg-muted/30">
                <td className="p-4 text-muted-foreground">{l.timestamp}</td>
                <td className="p-4 font-sans font-semibold text-xs">{l.userName}</td>
                <td className="p-4">
                  <span className="bg-[#D8E7D2] text-black px-2 py-0.5 rounded text-[9px] font-sans font-semibold">
                    {l.userRole}
                  </span>
                </td>
                <td className="p-4 font-bold text-foreground">{l.action}</td>
                <td className="p-4 font-sans text-xs text-foreground/80">{l.details}</td>
                <td className="p-4 text-muted-foreground">{l.ipAddress}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
