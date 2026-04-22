import { LostItem } from '@/types';
import { ItemCard } from './ItemCard';
import { cn } from '@/lib/utils';
import { Package } from 'lucide-react';

interface ItemGridProps {
  items: LostItem[];
  className?: string;
  emptyMessage?: string;
}

export function ItemGrid({ items, className, emptyMessage = 'No items found' }: ItemGridProps) {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted mb-4">
          <Package className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-medium text-foreground mb-2">
          {emptyMessage}
        </h3>
        <p className="text-sm text-muted-foreground max-w-md">
          Try adjusting your search or filters to find what you're looking for.
        </p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6',
        className
      )}
    >
      {items.map((item, index) => (
        <div
          key={item.id}
          className="animate-fade-up opacity-0"
          style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'forwards' }}
        >
          <ItemCard item={item} />
        </div>
      ))}
    </div>
  );
}
