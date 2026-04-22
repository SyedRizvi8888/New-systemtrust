"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ItemGrid } from '@/components/items/ItemGrid';
import { LostItem } from '@/types';
import { fetchItems } from '@/lib/api';
import { toast } from 'sonner';

export function RecentItems() {
  const [items, setItems] = useState<LostItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        setIsLoading(true);
        const data = await fetchItems();
        if (!isMounted) return;
        const recent = data
          .filter(item => item.status === 'found' || item.status === 'lost')
          .slice(0, 6);
        setItems(recent);
      } catch (err) {
        console.error(err);
        toast.error('Failed to load items');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    void load();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <section className="py-12 md:py-16 bg-white dark:bg-slate-900 border-y border-slate-200 dark:border-slate-800">
      <div className="container-wide">
        <div className="mb-8">
          <p className="text-xs uppercase tracking-wide font-semibold text-green-700 dark:text-green-300 mb-2">Active Listings</p>
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mb-3">
            Recent found items on campus
          </h2>
          <p className="text-sm md:text-base text-slate-600 dark:text-slate-400 max-w-3xl">
            Live item activity from Student Services. Browse recently submitted listings and claim what belongs to you.{' '}
            <Link href="/search" className="underline hover:text-slate-900 dark:hover:text-white">View all listings</Link>
          </p>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-slate-300 border-r-transparent" />
          </div>
        ) : items.length > 0 ? (
          <ItemGrid items={items} />
        ) : (
          <div className="text-center py-12 text-sm text-slate-600 dark:text-slate-400">
            No recent notices at this time.
          </div>
        )}
      </div>
    </section>
  );
}
