import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getActivityLogs } from "@/lib/admin-api";
import { Shield, Clock, Terminal } from "lucide-react";
import { AdminTableRowsSkeleton } from "@/components/loading-skeletons";

export function ActivityLogsView() {
  const { data: logs = [], isLoading, error } = useQuery({
    queryKey: ["admin", "activity-logs"],
    queryFn: getActivityLogs,
  });
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("All");
  const roles = Array.from(new Set(logs.map((log) => log.userRole))).sort();
  const filteredLogs = useMemo(() => {
    const query = search.trim().toLowerCase();
    return logs.filter(
      (log) =>
        (role === "All" || log.userRole === role) &&
        (!query ||
          [log.userName, log.action, log.details, log.ipAddress]
            .join(" ")
            .toLowerCase()
            .includes(query)),
    );
  }, [logs, role, search]);

  return (
    <div className="space-y-6 fade-up">
      {error && <p className="text-xs text-red-600">Audit records could not be loaded.</p>}
      <div>
        <h1 className="font-serif text-3xl md:text-4xl tracking-tight">System Activity Audit Trail</h1>
        <p className="text-xs text-muted-foreground mt-1">
          Immutable log of administrative logins, product edits, status changes, and settings updates.
        </p>
      </div>
      <div className="grid gap-3 rounded-xl border border-border bg-card p-4 md:grid-cols-[1fr_220px]">
        <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search user, action, detail, or IP..." className="rounded-lg border border-border bg-transparent p-2.5 text-xs" />
        <select value={role} onChange={(event) => setRole(event.target.value)} className="rounded-lg border border-border bg-transparent p-2.5 text-xs"><option>All</option>{roles.map((value) => <option key={value}>{value}</option>)}</select>
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
            {isLoading ? (
              <AdminTableRowsSkeleton columns={6} rows={7} />
            ) : filteredLogs.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center font-sans text-sm text-muted-foreground">
                  No administrator activity has been recorded.
                </td>
              </tr>
            ) : filteredLogs.map((l) => (
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
