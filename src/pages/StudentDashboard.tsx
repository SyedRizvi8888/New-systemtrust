"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LostItem, ClaimRequest } from '@/types';
import {
  Plus,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  ArrowRight,
  Eye,
  TrendingUp,
  FileText,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { fetchItems, fetchClaims } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { categoryLabels, statusColors } from '@/lib/mockData';

export default function StudentDashboard() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [items, setItems] = useState<LostItem[]>([]);
  const [claims, setClaims] = useState<ClaimRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/student-login');
      return;
    }

    const loadData = async () => {
      try {
        const [itemsData, claimsData] = await Promise.all([
          fetchItems(),
          fetchClaims(),
        ]);
        setItems(itemsData);
        setClaims(claimsData);
      } catch (err) {
        console.error('Failed to load dashboard', err);
      } finally {
        setIsLoading(false);
      }
    };

    void loadData();
  }, [loading, user, router]);

  // Filter to student's own posts and claims
  const myPosts = items.filter(
    (item) => item.createdBy === user?.id || item.contactEmail === user?.email
  );

  const myClaimsData = claims.filter(
    (claim) => claim.claimantEmail === user?.email
  );

  const pendingClaims = myClaimsData.filter((c) => c.status === 'pending');
  const approvedClaims = myClaimsData.filter((c) => c.status === 'approved' || c.status === 'pickup_scheduled');
  const activePosts = myPosts.filter((p) => p.status === 'found' || p.status === 'lost');

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-amber-600" />;
      case 'pickup_scheduled':
        return <Clock className="h-4 w-4 text-blue-600" />;
      case 'approved':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'rejected':
        return <AlertCircle className="h-4 w-4 text-destructive" />;
      default:
        return null;
    }
  };

  if (loading || isLoading) {
    return (
      <Layout>
        <section className="py-12">
          <div className="container-wide">
            <div className="h-8 w-64 bg-muted rounded animate-pulse mb-6" />
            <div className="grid md:grid-cols-3 gap-4 mb-6">
              {Array.from({ length: 3 }).map((_, idx) => (
                <div key={idx} className="h-24 bg-muted rounded-xl animate-pulse" />
              ))}
            </div>
            <div className="grid md:grid-cols-4 gap-4 mb-6">
              {Array.from({ length: 4 }).map((_, idx) => (
                <div key={idx} className="h-24 bg-muted rounded-xl animate-pulse" />
              ))}
            </div>
          </div>
        </section>
      </Layout>
    );
  }

  return (
    <Layout>
      <section className="bg-gradient-to-br from-green-50 to-slate-50 dark:from-green-950/20 dark:to-slate-900/20 py-8">
        <div className="container-wide">
          {/* Welcome Header */}
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground mb-2">
              Welcome back, {user?.user_metadata?.full_name?.split(' ')[0] || 'Student'}!
            </h1>
            <p className="text-muted-foreground">
              Track your lost items, manage claims, and stay updated on your reports.
            </p>
          </div>

          {/* Quick Action Cards */}
          <div className="grid md:grid-cols-3 gap-4 mb-8">
            <Link href="/report">
              <Button
                size="lg"
                className="w-full h-24 flex items-center justify-center gap-3 bg-green-600 hover:bg-green-700 text-white shadow-md hover:shadow-lg transition-all"
              >
                <Plus className="h-5 w-5" />
                <span>Report Item</span>
              </Button>
            </Link>

            <Link href="/search">
              <Button
                size="lg"
                variant="outline"
                className="w-full h-24 flex items-center justify-center gap-3 border-2 text-foreground hover:bg-accent transition-all"
              >
                <Search className="h-5 w-5" />
                <span>Browse Items</span>
              </Button>
            </Link>

            <Link href="/archive">
              <Button
                size="lg"
                variant="outline"
                className="w-full h-24 flex items-center justify-center gap-3 text-foreground border-2 hover:bg-accent transition-all"
              >
                <FileText className="h-5 w-5" />
                <span>Archive</span>
              </Button>
            </Link>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Card className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400 mb-1">
                {activePosts.length}
              </div>
              <div className="text-xs text-muted-foreground">Active Reports</div>
            </Card>
            <Card className="p-4 text-center">
              <div className="text-2xl font-bold text-amber-600 dark:text-amber-400 mb-1">
                {pendingClaims.length}
              </div>
              <div className="text-xs text-muted-foreground">Pending Claims</div>
            </Card>
            <Card className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-1">
                {approvedClaims.length}
              </div>
              <div className="text-xs text-muted-foreground">Approved</div>
            </Card>
            <Card className="p-4 text-center">
              <div className="text-2xl font-bold text-slate-600 dark:text-slate-400 mb-1">
                {myPosts.length + myClaimsData.length}
              </div>
              <div className="text-xs text-muted-foreground">Total Activity</div>
            </Card>
          </div>

          {/* Main Content Grid */}
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Left: My Posts */}
            <div className="lg:col-span-2 space-y-6">
              {/* Active Posts */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-foreground">Your Active Reports</h2>
                  <Link href="/claims?tab=posts">
                    <Button variant="ghost" size="sm" className="text-green-600 hover:text-green-700">
                      View All <ArrowRight className="h-3 w-3 ml-1" />
                    </Button>
                  </Link>
                </div>

                {activePosts.length > 0 ? (
                  <div className="space-y-3">
                    {activePosts.slice(0, 3).map((item) => (
                      <Link key={item.id} href={`/item/${item.id}`}>
                        <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-green-600">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h3 className="font-semibold text-foreground">{item.title}</h3>
                              <p className="text-sm text-muted-foreground capitalize">
                                {item.status} • {categoryLabels[item.category]}
                              </p>
                            </div>
                            <Badge
                              className={cn(
                                'capitalize',
                                item.status === 'found'
                                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100'
                                  : 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100'
                              )}
                            >
                              {item.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            📍 {item.location}
                          </p>
                        </Card>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <Card className="p-8 text-center bg-secondary/50">
                    <Eye className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-50" />
                    <p className="text-muted-foreground mb-4">No active reports yet</p>
                    <Link href="/report">
                      <Button size="sm" className="bg-green-600 hover:bg-green-700">
                        Report an Item
                      </Button>
                    </Link>
                  </Card>
                )}
              </div>

              {/* My Claims */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-foreground">Your Claims</h2>
                  <Link href="/claims?tab=claims">
                    <Button variant="ghost" size="sm" className="text-green-600 hover:text-green-700">
                      View All <ArrowRight className="h-3 w-3 ml-1" />
                    </Button>
                  </Link>
                </div>

                {myClaimsData.length > 0 ? (
                  <div className="space-y-3">
                    {myClaimsData.slice(0, 3).map((claim) => {
                      const claimItem = items.find((i) => i.id === claim.itemId);
                      return (
                        <Link key={claim.id} href={`/item/${claim.itemId}`}>
                          <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-purple-600">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <h3 className="font-semibold text-foreground">
                                  {claimItem?.title || 'Unknown Item'}
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                  Claimed {new Date(claim.submittedAt).toLocaleDateString()}
                                </p>
                              </div>
                              <Badge
                                className={cn(
                                  'capitalize flex items-center gap-1',
                                  claim.status === 'pending'
                                    ? 'bg-amber-100 text-amber-800'
                                    : claim.status === 'approved'
                                      ? 'bg-green-100 text-green-800'
                                      : 'bg-red-100 text-red-800'
                                )}
                              >
                                {getStatusIcon(claim.status)}
                                {claim.status}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {claim.status === 'pending' && '⏳ Waiting for office review'}
                              {claim.status === 'needs_info' && '📝 Office requested more information'}
                              {claim.status === 'approved' && '✅ Approved! Check email for pickup details'}
                              {claim.status === 'pickup_scheduled' && '📅 Pickup scheduled. Check your email for time and location'}
                              {claim.status === 'closed' && '📦 Case closed after pickup completion'}
                              {claim.status === 'rejected' && '❌ Claim was not approved'}
                            </p>
                          </Card>
                        </Link>
                      );
                    })}
                  </div>
                ) : (
                  <Card className="p-8 text-center bg-secondary/50">
                    <CheckCircle2 className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-50" />
                    <p className="text-muted-foreground mb-4">No claims yet</p>
                    <Link href="/search">
                      <Button size="sm" className="bg-green-600 hover:bg-green-700">
                        Browse Items
                      </Button>
                    </Link>
                  </Card>
                )}
              </div>
            </div>

            {/* Right: Info Cards */}
            <div className="space-y-4">
              {/* How it works */}
              <Card className="p-5 bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-900/20 dark:to-blue-950/20 border-blue-200 dark:border-blue-800">
                <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-blue-600" />
                  How It Works
                </h3>
                <ol className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex gap-2">
                    <span className="font-bold text-blue-600">1.</span>
                    <span>Report found/lost items</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="font-bold text-blue-600">2.</span>
                    <span>Office reviews reports</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="font-bold text-blue-600">3.</span>
                    <span>Get notified by email</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="font-bold text-blue-600">4.</span>
                    <span>Pick up at main office</span>
                  </li>
                </ol>
              </Card>

              {/* Quick tip */}
              <Card className="p-5 bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-900/20 dark:to-green-950/20 border-green-200 dark:border-green-800">
                <h3 className="font-semibold text-foreground mb-2 text-sm">💡 Pro Tip</h3>
                <p className="text-xs text-muted-foreground">
                  Upload a photo when reporting items. It helps the office identify and match items much faster!
                </p>
              </Card>

              {/* Contact office */}
              <Card className="p-5 border-2 border-dashed">
                <h3 className="font-semibold text-foreground mb-3 text-sm">Need Help?</h3>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p>📍 <strong>Location:</strong> Room B114</p>
                  <p>🕐 <strong>Hours:</strong> 8 AM – 3:30 PM</p>
                  <p>📧 <strong>Email:</strong> studentservices@school.edu</p>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
