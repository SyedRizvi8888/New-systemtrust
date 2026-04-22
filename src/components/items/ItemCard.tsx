"use client";

import { cn } from '@/lib/utils';
import { LostItem } from '@/types';
import { categoryIcons, statusColors } from '@/lib/mockData';
import { MapPin, Calendar, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface ItemCardProps {
  item: LostItem;
  className?: string;
}

export function ItemCard({ item, className }: ItemCardProps) {
  const formattedDate = new Date(item.dateFound).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <Link
      href={`/item/${item.id}`}
      className={cn(
        'group relative flex flex-col overflow-hidden rounded-lg bg-card border-2 border-border',
        'card-hover',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-0',
        'hover:border-green-400 dark:hover:border-green-500',
        className
      )}
    >
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        {item.imageUrl ? (
          <img
            src={item.imageUrl}
            alt={item.title}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-4xl">
            {categoryIcons[item.category]}
          </div>
        )}
        
        {/* Status Badge */}
        <div className="absolute top-3 right-3">
          <span className={cn('status-badge capitalize', statusColors[item.status])}>
            {item.status}
          </span>
        </div>
        
        {/* Category Badge */}
        <div className="absolute top-3 left-3">
          <span className="status-badge bg-card/90 backdrop-blur-sm text-foreground">
            {categoryIcons[item.category]} {item.category}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-4">
        <h3 className="text-lg font-semibold text-foreground line-clamp-1 mb-2 group-hover:text-green-600 dark:group-hover:text-green-400 transition-smooth">
          {item.title}
        </h3>
        
        <p className="text-sm text-muted-foreground line-clamp-2 mb-4 flex-1">
          {item.description}
        </p>

        {/* Metadata */}
        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5" />
            {item.location}
          </span>
          <span className="flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5" />
            {formattedDate}
          </span>
        </div>

        {/* View Details Indicator */}
        <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
          <span className="text-sm font-medium text-foreground">View Details</span>
          <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-accent group-hover:translate-x-1 transition-all duration-fast" />
        </div>
      </div>
    </Link>
  );
}
