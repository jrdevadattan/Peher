import { useState } from "react";
import { ROLE_PERMISSIONS, type AdminRole } from "@/lib/admin-auth-context";
import { ShieldCheck, UserPlus, KeyRound, Check, X } from "lucide-react";

const adminUsers = [
  { id: "adm-1", name: "Vasudha Tiwari", email: "admin@peher.studio", role: "Owner" as AdminRole, status: "Active" },
  { id: "adm-2", name: "Sidharth Gadhave", email: "sidharth@peher.studio", role: "Admin" as AdminRole, status: "Active" },
  { id: "adm-3", name: "Aarav Sharma", email: "aarav@peher.studio", role: "Inventory Manager" as AdminRole, status: "Active" },
];

const availablePermissions = [
  "products",
  "orders",
  "customers",
  "coupons",
  "inventory",
  "reviews",
  "analytics",
  "marketing",
  "shipping",
  "payments",
  "media",
  "seo",
];

export function UsersRolesView() {
  const [users, setUsers] = useState(adminUsers);
  const roles: AdminRole[] = ["Owner", "Admin", "Manager", "Inventory Manager", "Order Manager", "Customer Support", "Marketing", "Editor"];

  return (
    <div className="space-y-6 fade-up">
      <div>
        <h1 className="font-serif text-3xl md:text-4xl tracking-tight">Users & Role-Based Access Control (RBAC)</h1>
        <p className="text-xs text-muted-foreground mt-1">
          Manage administrative team members, assigned security roles, and granular permission matrices.
        </p>
      </div>

      {/* Users Table */}
      <div className="bg-card border border-border rounded-xl shadow-xs overflow-hidden">
        <div className="p-4 border-b border-border flex justify-between items-center">
          <h3 className="font-serif text-xl font-medium">Administrative Users</h3>
          <button className="inline-flex items-center gap-1.5 bg-neutral-900 text-white px-4 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider">
            <UserPlus className="w-3.5 h-3.5" /> Add Admin User
          </button>
        </div>
        <table className="w-full text-left text-xs">
          <thead className="bg-muted/50 border-b border-border uppercase text-[10px] text-muted-foreground tracking-wider">
            <tr>
              <th className="p-4">Name</th>
              <th className="p-4">Email</th>
              <th className="p-4">Role</th>
              <th className="p-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-muted/30">
                <td className="p-4 font-semibold text-sm">{u.name}</td>
                <td className="p-4 font-mono text-[11px] text-muted-foreground">{u.email}</td>
                <td className="p-4">
                  <span className="bg-[#D8E7D2] text-black px-2.5 py-1 rounded-full text-[9px] font-semibold uppercase">
                    {u.role}
                  </span>
                </td>
                <td className="p-4 font-semibold text-emerald-700">{u.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Permissions Matrix */}
      <div className="bg-card border border-border rounded-xl p-6 shadow-xs space-y-4">
        <h3 className="font-serif text-2xl">Role Permission Matrix</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-border text-[10px] uppercase text-muted-foreground tracking-wider">
                <th className="p-3">Module</th>
                {roles.map((r) => (
                  <th key={r} className="p-3 text-center">{r}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {availablePermissions.map((perm) => (
                <tr key={perm} className="hover:bg-muted/30">
                  <td className="p-3 font-semibold uppercase tracking-wider text-[11px]">{perm}</td>
                  {roles.map((r) => {
                    const granted = ROLE_PERMISSIONS[r]?.includes("*") || ROLE_PERMISSIONS[r]?.includes(perm);
                    return (
                      <td key={r} className="p-3 text-center">
                        {granted ? (
                          <Check className="w-4 h-4 text-emerald-600 mx-auto stroke-[2.5]" />
                        ) : (
                          <X className="w-4 h-4 text-neutral-300 mx-auto" />
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
