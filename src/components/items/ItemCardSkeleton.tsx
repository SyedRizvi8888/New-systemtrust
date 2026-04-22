import { cn } from '@/lib/utils';

interface ItemCardSkeletonProps {
  className?: string;
}

export function ItemCardSkeleton({ className }: ItemCardSkeletonProps) {
  return (
    <div
      className={cn(
        'flex flex-col overflow-hidden rounded-2xl bg-card border border-border',
        className
      )}
    >
      {/* Image skeleton */}
      <div className="aspect-[4/3] skeleton" />
      
      {/* Content skeleton */}
      <div className="p-4 space-y-3">
        <div className="h-6 skeleton rounded w-3/4" />
        <div className="space-y-2">
          <div className="h-4 skeleton rounded w-full" />
          <div className="h-4 skeleton rounded w-2/3" />
        </div>
        <div className="flex gap-3 pt-2">
          <div className="h-4 skeleton rounded w-24" />
          <div className="h-4 skeleton rounded w-20" />
        </div>
      </div>
    </div>
  );
}

export function ItemGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <ItemCardSkeleton key={i} />
      ))}
    </div>
  );
}
