import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function ProductCardSkeleton() {
  return (
    <div aria-label="Loading product" className="space-y-4">
      <Skeleton className="aspect-[4/5] w-full rounded-md" />
      <div className="space-y-2.5">
        <Skeleton className="h-6 w-4/5" />
        <div className="flex gap-2">
          <Skeleton className="h-4 w-14" />
          <Skeleton className="h-4 w-20" />
        </div>
        <Skeleton className="h-11 w-full rounded-sm" />
      </div>
    </div>
  );
}

export function ProductGridSkeleton({
  count = 8,
  className,
}: {
  count?: number;
  className?: string;
}) {
  return (
    <div
      aria-busy="true"
      aria-label="Loading products from the atelier"
      className={cn("grid grid-cols-2 gap-5 md:gap-8 lg:grid-cols-4", className)}
    >
      {Array.from({ length: count }, (_, index) => (
        <ProductCardSkeleton key={index} />
      ))}
    </div>
  );
}

export function ProductDetailSkeleton() {
  return (
    <main
      aria-busy="true"
      aria-label="Loading product details"
      className="container-luxe grid grid-cols-1 gap-12 pb-24 pt-36 lg:grid-cols-12 lg:gap-16"
    >
      <div className="space-y-4 lg:col-span-7">
        <Skeleton className="aspect-[4/5] w-full rounded-none" />
        <div className="grid grid-cols-3 gap-4">
          {Array.from({ length: 3 }, (_, index) => (
            <Skeleton key={index} className="aspect-square rounded-none" />
          ))}
        </div>
      </div>
      <div className="space-y-7 lg:col-span-5 lg:pt-8">
        <Skeleton className="h-3 w-28" />
        <Skeleton className="h-14 w-4/5" />
        <Skeleton className="h-8 w-32" />
        <div className="space-y-3 pt-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-11/12" />
          <Skeleton className="h-4 w-3/4" />
        </div>
        <Skeleton className="h-3 w-24" />
        <div className="grid grid-cols-5 gap-2">
          {Array.from({ length: 5 }, (_, index) => (
            <Skeleton key={index} className="h-12" />
          ))}
        </div>
        <Skeleton className="h-12 w-full rounded-sm" />
        <Skeleton className="h-12 w-full rounded-sm" />
        <div className="space-y-5 border-t border-black/10 pt-6">
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} className="h-5 w-full" />
          ))}
        </div>
      </div>
    </main>
  );
}

export function OrderHistorySkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading order history" className="mt-6 space-y-4">
      {Array.from({ length: 3 }, (_, index) => (
        <div key={index} className="space-y-4 rounded-md border border-black/10 p-6">
          <div className="flex justify-between">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-6 w-24 rounded-full" />
          </div>
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <div className="flex justify-between border-t border-black/10 pt-4">
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-6 w-24" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function AdminTableRowsSkeleton({
  columns,
  rows = 6,
  imageColumn,
}: {
  columns: number;
  rows?: number;
  imageColumn?: number;
}) {
  return (
    <>
      {Array.from({ length: rows }, (_, row) => (
        <tr key={row} aria-hidden="true">
          {Array.from({ length: columns }, (__, column) => (
            <td key={column} className="p-4">
              {column === imageColumn ? (
                <div className="flex items-center gap-3">
                  <Skeleton className="h-12 w-10 shrink-0" />
                  <div className="w-full space-y-2">
                    <Skeleton className="h-3.5 w-3/4" />
                    <Skeleton className="h-2.5 w-1/2" />
                  </div>
                </div>
              ) : (
                <Skeleton className={cn("h-3.5", column % 3 === 0 ? "w-4/5" : "w-2/3")} />
              )}
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

export function AdminCardListSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div aria-busy="true" className="space-y-4">
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="space-y-4 rounded-xl border border-border bg-card p-6">
          <div className="flex justify-between">
            <div className="space-y-2">
              <Skeleton className="h-3 w-32" />
              <Skeleton className="h-4 w-24" />
            </div>
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
          <Skeleton className="h-7 w-4/5" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-9 w-full" />
        </div>
      ))}
    </div>
  );
}

export function AdminMediaGridSkeleton({ count = 12 }: { count?: number }) {
  return (
    <div
      aria-busy="true"
      className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-6"
    >
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="overflow-hidden rounded-xl border border-border bg-card">
          <Skeleton className="aspect-[4/5] rounded-none" />
          <div className="space-y-2 p-3">
            <Skeleton className="h-3 w-4/5" />
            <Skeleton className="h-2.5 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function AdminOverviewSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading live dashboard" className="space-y-8">
      <Skeleton className="h-48 w-full rounded-xl bg-black/15" />
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="space-y-4 rounded-xl border border-border bg-card p-5">
            <div className="flex justify-between">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-8 w-8" />
            </div>
            <Skeleton className="h-9 w-28" />
            <Skeleton className="h-3 w-36" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="space-y-5 rounded-xl border border-border bg-card p-6 lg:col-span-8">
          <Skeleton className="h-7 w-64" />
          <Skeleton className="h-[300px] w-full" />
        </div>
        <div className="space-y-5 rounded-xl border border-border bg-card p-6 lg:col-span-4">
          <Skeleton className="h-7 w-44" />
          <Skeleton className="h-[300px] w-full" />
        </div>
      </div>
    </div>
  );
}

export function AdminAuthSkeleton() {
  return (
    <div className="min-h-screen bg-[#f4f2ed] p-5 lg:flex" aria-busy="true">
      <aside className="hidden w-64 shrink-0 space-y-5 rounded-2xl bg-[#111] p-5 lg:block">
        <Skeleton className="h-10 w-36 bg-white/15" />
        {Array.from({ length: 9 }, (_, index) => (
          <Skeleton key={index} className="h-9 w-full bg-white/10" />
        ))}
      </aside>
      <main className="flex-1 space-y-7 p-4 md:p-8">
        <div className="flex justify-between">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-28" />
        </div>
        <AdminOverviewSkeleton />
      </main>
    </div>
  );
}
