"use client";

import { useState, useMemo, useEffect } from 'react';
import { Layout } from '@/components/layout/Layout';
import { ItemGrid } from '@/components/items/ItemGrid';
import { ItemGridSkeleton } from '@/components/items/ItemCardSkeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { categoryLabels, categoryIcons } from '@/lib/mockData';
import { LostItem, ItemCategory, ItemStatus, FilterState } from '@/types';
import { Search, Filter, X, SlidersHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { fetchItems } from '@/lib/api';
import { toast } from 'sonner';

const categories: (ItemCategory | 'all')[] = ['all', 'electronics', 'clothing', 'accessories', 'books', 'sports', 'keys', 'wallet', 'jewelry', 'bag', 'other'];
const statuses: (ItemStatus | 'all')[] = ['all', 'found', 'lost'];
const dateRanges = [
  { value: 'all', label: 'All Time' },
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'This Week' },
  { value: 'month', label: 'This Month' },
] as const;

export default function SearchPage() {
  const [items, setItems] = useState<LostItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    category: 'all',
    status: 'all',
    search: '',
    dateRange: 'all',
  });

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        setIsLoading(true);
        const data = await fetchItems();
        if (isMounted) setItems(data);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error(err);
        toast.error('Failed to load items');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    load();
    return () => {
      isMounted = false;
    };
  }, []);

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      // Keep active browse list focused on available items
      if (item.status === 'matched' || item.status === 'returned' || item.status === 'archived') {
        return false;
      }
      // Category filter
      if (filters.category !== 'all' && item.category !== filters.category) {
        return false;
      }
      // Status filter
      if (filters.status !== 'all' && item.status !== filters.status) {
        return false;
      }
      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesSearch = 
          item.title.toLowerCase().includes(searchLower) ||
          item.description.toLowerCase().includes(searchLower) ||
          item.location.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }
      // Date range filter
      if (filters.dateRange !== 'all') {
        const itemDate = new Date(item.dateFound);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (filters.dateRange === 'today') {
          const itemDay = new Date(item.dateFound);
          itemDay.setHours(0, 0, 0, 0);
          if (itemDay.getTime() !== today.getTime()) return false;
        } else if (filters.dateRange === 'week') {
          const weekAgo = new Date(today);
          weekAgo.setDate(weekAgo.getDate() - 7);
          if (itemDate < weekAgo) return false;
        } else if (filters.dateRange === 'month') {
          const monthAgo = new Date(today);
          monthAgo.setMonth(monthAgo.getMonth() - 1);
          if (itemDate < monthAgo) return false;
        }
      }
      return true;
    });
  }, [items, filters]);

  const activeFilterCount = [
    filters.category !== 'all',
    filters.status !== 'all',
    filters.dateRange !== 'all',
  ].filter(Boolean).length;

  const clearFilters = () => {
    setFilters({
      category: 'all',
      status: 'all',
      search: '',
      dateRange: 'all',
    });
  };

  return (
    <Layout>
      <section className="py-12 md:py-20">
        <div className="container-wide">
          {/* Page Header */}
          <div className="mb-10">
            <h1 className="text-4xl font-bold text-foreground mb-4">
              Browse Items
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl">
              Search through all reported items, including newly missing belongings and recent finds. Use filters to narrow down your search.
            </p>
          </div>

          {/* Search and Filter Bar */}
          <div className="flex flex-col md:flex-row gap-4 mb-8">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search by title, description, or location..."
                value={filters.search}
                onChange={(e) => setFilters(f => ({ ...f, search: e.target.value }))}
                className="pl-12 h-12 text-base"
              />
              {filters.search && (
                <button
                  onClick={() => setFilters(f => ({ ...f, search: '' }))}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Clear search"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Filter Toggle */}
            <Button
              variant={showFilters ? 'default' : 'outline'}
              size="lg"
              onClick={() => setShowFilters(!showFilters)}
              className="gap-2"
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filters
              {activeFilterCount > 0 && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent text-accent-foreground text-xs font-medium">
                  {activeFilterCount}
                </span>
              )}
            </Button>
          </div>

          {/* Filter Panel */}
          <div className={cn(
            'overflow-hidden transition-all duration-normal',
            showFilters ? 'max-h-96 mb-8' : 'max-h-0'
          )}>
            <div className="p-6 rounded-2xl bg-card border border-border space-y-6">
              {/* Category Filter */}
              <div>
                <h3 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  Category
                </h3>
                <div className="flex flex-wrap gap-2">
                  {categories.map(cat => (
                    <button
                      key={cat}
                      onClick={() => setFilters(f => ({ ...f, category: cat }))}
                      className={cn(
                        'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                        filters.category === cat
                          ? 'bg-accent text-accent-foreground'
                          : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                      )}
                    >
                      {cat === 'all' ? 'All' : `${categoryIcons[cat]} ${categoryLabels[cat]}`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Status Filter */}
              <div>
                <h3 className="text-sm font-medium text-foreground mb-3">Status</h3>
                <div className="flex flex-wrap gap-2">
                  {statuses.map(status => (
                    <button
                      key={status}
                      onClick={() => setFilters(f => ({ ...f, status: status }))}
                      className={cn(
                        'px-3 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors',
                        filters.status === status
                          ? 'bg-accent text-accent-foreground'
                          : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                      )}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>

              {/* Date Range Filter */}
              <div>
                <h3 className="text-sm font-medium text-foreground mb-3">Date Found</h3>
                <div className="flex flex-wrap gap-2">
                  {dateRanges.map(range => (
                    <button
                      key={range.value}
                      onClick={() => setFilters(f => ({ ...f, dateRange: range.value }))}
                      className={cn(
                        'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                        filters.dateRange === range.value
                          ? 'bg-accent text-accent-foreground'
                          : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                      )}
                    >
                      {range.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Clear Filters */}
              {activeFilterCount > 0 && (
                <div className="pt-2 border-t border-border">
                  <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-2">
                    <X className="h-4 w-4" />
                    Clear all filters
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Results Count */}
          <div className="flex items-center justify-between mb-6">
            <p className="text-sm text-muted-foreground">
              {isLoading ? 'Loading...' : `${filteredItems.length} listing${filteredItems.length !== 1 ? 's' : ''} available`}
            </p>
          </div>

          {/* Items Grid */}
          {isLoading ? (
            <ItemGridSkeleton count={6} />
          ) : (
            <ItemGrid items={filteredItems} emptyMessage="No items match your search" />
          )}
        </div>
      </section>
    </Layout>
  );
}
