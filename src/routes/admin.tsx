import { createFileRoute } from "@tanstack/react-router";
import { AdminAuthProvider, useAdminAuth } from "@/lib/admin-auth-context";
import { AdminLogin } from "@/components/admin/AdminLogin";
import { AdminLayout } from "@/components/admin/AdminLayout";

export const Route = createFileRoute("/admin")({
  component: AdminRouteWrapper,
  head: () => ({
    meta: [
      { title: "PEHER — Executive Admin Portal" },
      { name: "description", content: "PEHER Atelier Administration & Management Suite" },
    ],
  }),
});

function AdminRouteWrapper() {
  return (
    <AdminAuthProvider>
      <AdminContentSwitcher />
    </AdminAuthProvider>
  );
}

function AdminContentSwitcher() {
  const { adminUser, loading } = useAdminAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0d0d0d] text-white flex items-center justify-center font-serif text-xl tracking-[0.2em]">
        PEHER ATELIER...
      </div>
    );
  }

  if (!adminUser) {
    return <AdminLogin />;
  }

  return <AdminLayout />;
}
