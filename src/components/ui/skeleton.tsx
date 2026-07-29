import { cn } from "@/lib/utils";

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "skeleton-shimmer relative overflow-hidden rounded-md bg-black/[0.065] dark:bg-white/[0.08]",
        className,
      )}
      {...props}
    />
  );
}

export { Skeleton };
