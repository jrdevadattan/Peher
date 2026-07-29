import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, UserPlus, X } from "lucide-react";
import { ROLE_PERMISSIONS, type AdminRole } from "@/lib/admin-auth-context";
import {
  getAdminMemberships,
  inviteAdminMembership,
  updateAdminMembership,
} from "@/lib/admin-api";
import { AdminTableRowsSkeleton } from "@/components/loading-skeletons";

const roles = Object.keys(ROLE_PERMISSIONS) as AdminRole[];
const permissions = [
  "products", "orders", "customers", "coupons", "inventory", "reviews", "analytics",
  "marketing", "shipping", "payments", "taxes", "media", "seo", "settings", "categories",
];

export function UsersRolesView() {
  const queryClient = useQueryClient();
  const { data: users = [], isLoading, error } = useQuery({
    queryKey: ["admin", "memberships"],
    queryFn: getAdminMemberships,
  });
  const [inviteOpen, setInviteOpen] = useState(false);
  const [invite, setInvite] = useState({ name: "", email: "", role: "Editor" as AdminRole });
  const [busy, setBusy] = useState("");
  const refresh = () => queryClient.invalidateQueries({ queryKey: ["admin", "memberships"] });

  return (
    <div className="space-y-6 fade-up">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div><h1 className="font-serif text-3xl md:text-4xl">Users & Roles</h1><p className="mt-1 text-xs text-muted-foreground">Invite administrators and enforce role-based server permissions.</p></div>
        <button onClick={() => setInviteOpen((value) => !value)} className="inline-flex items-center gap-2 rounded-lg bg-neutral-900 px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-white"><UserPlus className="h-4 w-4" /> Invite administrator</button>
      </div>
      {inviteOpen && (
        <form onSubmit={async (event) => { event.preventDefault(); setBusy("invite"); try { await inviteAdminMembership(invite.name, invite.email, invite.role); setInvite({ name: "", email: "", role: "Editor" }); setInviteOpen(false); await refresh(); } finally { setBusy(""); } }} className="grid gap-3 rounded-xl border border-border bg-card p-5 md:grid-cols-[1fr_1fr_220px_auto]">
          <input required value={invite.name} onChange={(e) => setInvite({ ...invite, name: e.target.value })} placeholder="Full name" className="rounded-lg border border-border bg-transparent p-3 text-xs" />
          <input required type="email" value={invite.email} onChange={(e) => setInvite({ ...invite, email: e.target.value })} placeholder="Email address" className="rounded-lg border border-border bg-transparent p-3 text-xs" />
          <select value={invite.role} onChange={(e) => setInvite({ ...invite, role: e.target.value as AdminRole })} className="rounded-lg border border-border bg-transparent p-3 text-xs">{roles.map((role) => <option key={role}>{role}</option>)}</select>
          <button disabled={busy === "invite"} className="rounded-lg bg-neutral-900 px-5 py-3 text-xs font-semibold text-white disabled:opacity-40">Send invite</button>
        </form>
      )}
      {error && <p className="rounded-lg bg-red-50 p-3 text-xs text-red-700">Administrator memberships could not be loaded.</p>}
      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        <table className="w-full min-w-[760px] text-left text-xs">
          <thead className="border-b border-border bg-muted/50 text-[10px] uppercase tracking-wider"><tr><th className="p-4">Administrator</th><th>Role</th><th>Status</th></tr></thead>
          <tbody className="divide-y divide-border">
            {isLoading ? <AdminTableRowsSkeleton columns={3} rows={5} /> : users.map((user) => (
              <tr key={user.id}><td className="p-4"><p className="font-semibold">{user.name}</p><p className="text-[10px] text-muted-foreground">{user.email}</p></td><td><select value={user.role} disabled={busy === user.id} onChange={async (e) => { setBusy(user.id); try { await updateAdminMembership(user.id, e.target.value as AdminRole, user.status === "Active"); await refresh(); } finally { setBusy(""); } }} className="rounded-lg border border-border bg-transparent p-2">{roles.map((role) => <option key={role}>{role}</option>)}</select></td><td><button disabled={busy === user.id} onClick={async () => { setBusy(user.id); try { await updateAdminMembership(user.id, user.role, user.status !== "Active"); await refresh(); } finally { setBusy(""); } }} className={`rounded-full px-3 py-1 text-[10px] font-semibold uppercase ${user.status === "Active" ? "bg-emerald-100 text-emerald-800" : "bg-muted"}`}>{user.status}</button></td></tr>
            ))}
          </tbody>
        </table>
      </div>
      <section className="overflow-x-auto rounded-xl border border-border bg-card p-5">
        <h2 className="mb-4 font-serif text-2xl">Role permission matrix</h2>
        <table className="w-full min-w-[900px] text-center text-[10px]"><thead><tr><th className="p-2 text-left">Role</th>{permissions.map((permission) => <th key={permission} className="p-2 uppercase">{permission}</th>)}</tr></thead><tbody className="divide-y divide-border">{roles.map((role) => <tr key={role}><td className="p-3 text-left text-xs font-semibold">{role}</td>{permissions.map((permission) => { const allowed = ROLE_PERMISSIONS[role].includes("*") || ROLE_PERMISSIONS[role].includes(permission); return <td key={permission} className="p-2">{allowed ? <Check className="mx-auto h-3.5 w-3.5 text-emerald-600" /> : <X className="mx-auto h-3.5 w-3.5 text-neutral-300" />}</td>; })}</tr>)}</tbody></table>
      </section>
    </div>
  );
}
