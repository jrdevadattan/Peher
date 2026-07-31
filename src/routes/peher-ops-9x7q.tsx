import { createFileRoute } from "@tanstack/react-router";
import { AdminAuthProvider, useAdminAuth } from "@/lib/admin-auth-context";
import { AdminLogin } from "@/components/admin/AdminLogin";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminAuthSkeleton } from "@/components/loading-skeletons";

export const Route = createFileRoute("/peher-ops-9x7q")({
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
    return <AdminAuthSkeleton />;
  }

  if (!adminUser) {
    return <AdminLogin />;
  }

  return <AdminLayout />;
}
