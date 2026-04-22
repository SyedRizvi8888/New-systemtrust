"use client";

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Layout } from '@/components/layout/Layout';
import { fetchItems } from '@/lib/api';
import { LostItem } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Archive, Calendar, MapPin, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

export default function ArchivePage() {
  const [items, setItems] = useState<LostItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      try {
        setLoading(true);
        const data = await fetchItems();
        if (isMounted) setItems(data);
      } catch (error) {
        console.error('Failed to load archived items:', error);
        toast.error('Failed to load archive');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    void load();

    return () => {
      isMounted = false;
    };
  }, []);

  const archivedItems = useMemo(
    () => items.filter(item => item.status === 'matched' || item.status === 'returned' || item.status === 'archived'),
    [items]
  );

  return (
    <Layout>
      <section className="py-12 md:py-20 min-h-screen bg-gradient-to-br from-white via-green-50/30 to-green-100/20 dark:from-slate-900 dark:via-slate-900 dark:to-green-950/30">
        <div className="container-wide px-4">
          <div className="mb-10">
            <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-3">
              <Archive className="h-8 w-8 text-green-600" />
              Archive
            </h1>
            <p className="text-slate-600 dark:text-slate-400 text-lg">
              Matched, returned, and archived cases are stored here.
            </p>
          </div>

          {loading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="h-48 rounded-xl bg-slate-200 dark:bg-slate-700 animate-pulse" />
              ))}
            </div>
          ) : archivedItems.length === 0 ? (
            <div className="text-center py-16 bg-card border border-border rounded-2xl">
              <Archive className="h-16 w-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-2">No archived items yet</h2>
              <p className="text-slate-600 dark:text-slate-400 mb-6">
                Closed and archived items will appear here automatically.
              </p>
              <Link href="/search">
                <Button className="bg-green-600 hover:bg-green-700 text-white">
                  Browse active items
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {archivedItems.map(item => (
                <div
                  key={item.id}
                  className="bg-card border border-border rounded-xl p-4 space-y-3 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white line-clamp-2">{item.title}</h3>
                    <Badge className={item.status === 'returned' ? 'bg-green-100 text-green-800 border-green-200' : 'bg-blue-100 text-blue-800 border-blue-200'}>
                      {item.status}
                    </Badge>
                  </div>

                  <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">{item.description}</p>

                  <div className="space-y-1 text-sm text-slate-600 dark:text-slate-400">
                    <p className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-green-600" />
                      {item.location}
                    </p>
                    <p className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-green-600" />
                      {new Date(item.dateFound).toLocaleDateString()}
                    </p>
                  </div>

                  <Link href={`/item/${item.id}`} className="inline-flex items-center gap-2 text-sm font-medium text-green-700 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300">
                    View details <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
}
