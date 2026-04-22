"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  statusColors,
  categoryLabels,
  categoryIcons,
} from '@/lib/mockData';
import { LostItem, ClaimRequest } from '@/types';
import {
  Package,
  Check,
  X,
  Eye,
  AlertCircle,
  FileText,
  Mail,
  Phone,
  User,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
  fetchItems,
  updateItem,
  fetchClaims,
  updateClaim,
  fetchItemById,
} from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

interface StatCardProps {
  icon: React.ElementType;
  value: number;
  label: string;
  color: string;
  bgColor: string;
}

function StatCard({ icon: Icon, value, label, color, bgColor }: StatCardProps) {
  return (
    <div className="p-6 rounded-2xl bg-card border border-border">
      <div className="flex items-start justify-between mb-4">
        <div className={cn('flex h-12 w-12 items-center justify-center rounded-xl', bgColor)}>
          <Icon className={cn('h-6 w-6', color)} />
        </div>
        <span className={cn('text-3xl font-bold', color)}>{value}</span>
      </div>
      <p className="text-sm text-muted-foreground font-medium">{label}</p>
    </div>
  );
}

export default function AdminPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<LostItem[]>([]);
  const [claims, setClaims] = useState<(ClaimRequest & { itemTitle?: string })[]>([]);
  const [activeTab, setActiveTab] = useState<'pending-items' | 'pending-claims' | 'all-items'>('pending-items');
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [rejectReason, setRejectReason] = useState<Record<string, string>>({});
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [claimRejectReason, setClaimRejectReason] = useState<Record<string, string>>({});
  const [claimRejectingId, setClaimRejectingId] = useState<string | null>(null);

  const loadItems = async () => {
    try {
      setIsLoading(true);
      const allItems = await fetchItems();
      setItems(allItems);
      
      // Load all claims
      const allClaims = await fetchClaims();
      
      // Enrich claims with item titles
      const enrichedClaims = await Promise.all(
        allClaims.map(async (claim) => {
          try {
            const item = await fetchItemById(claim.itemId);
            return {
              ...claim,
              itemTitle: item?.title || 'Unknown Item',
            };
          } catch {
            return {
              ...claim,
              itemTitle: 'Unknown Item',
            };
          }
        })
      );
      
      setClaims(enrichedClaims);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadItems();
  }, []);

  const pendingItems = items.filter(i => i.approvalStatus === 'pending');
  const approvedItems = items.filter(i => i.approvalStatus === 'approved');
  const rejectedItems = items.filter(i => i.approvalStatus === 'rejected');
  const pendingClaims = claims.filter(c => c.status === 'pending');
  const approvedClaims = claims.filter(c => c.status === 'approved');
  const rejectedClaims = claims.filter(c => c.status === 'rejected');

  const stats = {
    pendingItems: pendingItems.length,
    approvedItems: approvedItems.length,
    rejectedItems: rejectedItems.length,
    totalItems: items.length,
    pendingClaims: pendingClaims.length,
    approvedClaims: approvedClaims.length,
    rejectedClaims: rejectedClaims.length,
    totalClaims: claims.length,
  };

  const handleApproveItem = async (item: LostItem) => {
    try {
      setProcessingId(item.id);
      await updateItem(item.id, {
        approvalStatus: 'approved',
        approvedBy: user?.id,
        approvedAt: new Date().toISOString(),
      });
      toast.success('Item approved and now visible');
      await loadItems();
    } catch (error) {
      console.error('Failed to approve:', error);
      toast.error('Failed to approve item');
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectItem = async (item: LostItem) => {
    const reason = (rejectReason[item.id] || '').trim();
    if (!reason) {
      toast.error('Please provide a rejection reason');
      return;
    }

    try {
      setProcessingId(item.id);
      await updateItem(item.id, {
        approvalStatus: 'rejected',
        approvedBy: user?.id,
        approvedAt: new Date().toISOString(),
        rejectionReason: reason,
      });
      toast.success('Item rejected');
      setRejectReason(prev => {
        const updated = { ...prev };
        delete updated[item.id];
        return updated;
      });
      setRejectingId(null);
      await loadItems();
    } catch (error) {
      console.error('Failed to reject:', error);
      toast.error('Failed to reject item');
    } finally {
      setProcessingId(null);
    }
  };

  const handleApproveClaim = async (claim: ClaimRequest) => {
    try {
      setProcessingId(claim.id);
      await updateClaim(claim.id, {
        status: 'approved',
        reviewedBy: user?.id,
        reviewedAt: new Date().toISOString(),
      });
      toast.success('Claim approved - applicant can now come to office');
      await loadItems();
    } catch (error) {
      console.error('Failed to approve claim:', error);
      toast.error('Failed to approve claim');
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectClaim = async (claim: ClaimRequest) => {
    const reason = (claimRejectReason[claim.id] || '').trim();
    if (!reason) {
      toast.error('Please provide a rejection reason');
      return;
    }

    try {
      setProcessingId(claim.id);
      await updateClaim(claim.id, {
        status: 'rejected',
        reviewedBy: user?.id,
        reviewedAt: new Date().toISOString(),
        internalNotes: reason,
      });
      toast.success('Claim rejected');
      setClaimRejectReason(prev => {
        const updated = { ...prev };
        delete updated[claim.id];
        return updated;
      });
      setClaimRejectingId(null);
      await loadItems();
    } catch (error) {
      console.error('Failed to reject claim:', error);
      toast.error('Failed to reject claim');
    } finally {
      setProcessingId(null);
    }
  };

  const displayItems = activeTab === 'pending-items'
    ? pendingItems
    : activeTab === 'pending-claims'
    ? pendingClaims
    : (searchTerm ? items.filter(i =>
        i.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        i.studentName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        i.studentId?.toLowerCase().includes(searchTerm.toLowerCase())
      ) : items);

  return (
    <Layout>
      <section className="py-12 md:py-20 min-h-screen bg-secondary/30">
        <div className="container-wide">
          {/* Page Header */}
          <div className="mb-10">
            <h1 className="text-4xl font-bold text-foreground mb-4">
              Admin Dashboard
            </h1>
            <p className="text-lg text-muted-foreground">
              Review and approve submitted items and claims.
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
            <StatCard
              icon={AlertCircle}
              value={stats.pendingItems}
              label="Pending Items"
              color="text-warning"
              bgColor="bg-warning/15"
            />
            <StatCard
              icon={FileText}
              value={stats.pendingClaims}
              label="Pending Claims"
              color="text-info"
              bgColor="bg-info/15"
            />
            <StatCard
              icon={Check}
              value={stats.approvedItems + stats.approvedClaims}
              label="Total Approved"
              color="text-success"
              bgColor="bg-success/15"
            />
            <StatCard
              icon={X}
              value={stats.rejectedItems + stats.rejectedClaims}
              label="Total Rejected"
              color="text-destructive"
              bgColor="bg-destructive/15"
            />
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-6 flex-wrap">
            <button
              onClick={() => setActiveTab('pending-items')}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                activeTab === 'pending-items'
                  ? 'bg-warning text-warning-foreground'
                  : 'bg-card border border-border text-muted-foreground hover:text-foreground'
              )}
            >
              Pending Items ({stats.pendingItems})
              {stats.pendingItems > 0 && (
                <span className="ml-2 inline-block h-2 w-2 rounded-full bg-destructive animate-pulse" />
              )}
            </button>
            <button
              onClick={() => setActiveTab('pending-claims')}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                activeTab === 'pending-claims'
                  ? 'bg-info text-info-foreground'
                  : 'bg-card border border-border text-muted-foreground hover:text-foreground'
              )}
            >
              Pending Claims ({stats.pendingClaims})
              {stats.pendingClaims > 0 && (
                <span className="ml-2 inline-block h-2 w-2 rounded-full bg-destructive animate-pulse" />
              )}
            </button>
            <button
              onClick={() => setActiveTab('all-items')}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                activeTab === 'all-items'
                  ? 'bg-warning text-warning-foreground'
                  : 'bg-card border border-border text-muted-foreground hover:text-foreground'
              )}
            >
              All Items ({stats.totalItems})
            </button>
          </div>

          {/* Search Bar for All Items Tab */}
          {activeTab === 'all-items' && (
            <div className="mb-6">
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by title, student name, or ID..."
                className="max-w-md"
              />
            </div>
          )}

          {/* Items/Claims Grid */}
          <div className="grid grid-cols-1 gap-6">
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-48 bg-muted rounded-2xl animate-pulse" />
              ))
            ) : activeTab === 'pending-claims' ? (
              // CLAIMS VIEW
              pendingClaims.length === 0 ? (
                <div className="text-center py-12 bg-card border border-border rounded-2xl">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No pending claims to approve</p>
                </div>
              ) : (
                pendingClaims.map((claim) => (
                  <div
                    key={claim.id}
                    className="bg-card border border-info/50 bg-info/5 rounded-2xl p-6 transition-colors"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                      {/* Claim Info */}
                      <div className="md:col-span-2">
                        <div className="flex gap-4">
                          <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-secondary text-2xl flex-shrink-0">
                            <FileText className="h-8 w-8 text-info" />
                          </div>
                          <div className="min-w-0">
                            <h3 className="font-semibold text-foreground text-lg line-clamp-2">
                              {claim.itemTitle || 'Unknown Item'}
                            </h3>
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                              {claim.proofDescription}
                            </p>
                            <div className="flex gap-2 mt-2 flex-wrap">
                              <span
                                className={cn(
                                  'px-2 py-0.5 rounded text-xs font-medium',
                                  claim.status === 'pending'
                                    ? 'bg-info/20 text-info'
                                    : claim.status === 'approved'
                                    ? 'bg-success/20 text-success'
                                    : claim.status === 'rejected'
                                    ? 'bg-destructive/20 text-destructive'
                                    : 'bg-secondary/20 text-foreground'
                                )}
                              >
                                {claim.status}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Claimant Info */}
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground mb-2">Claimant</p>
                        <div className="space-y-1 text-sm">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <p className="text-foreground font-medium">{claim.claimantName}</p>
                          </div>
                          {claim.claimantStudentId && (
                            <p className="text-muted-foreground">ID: {claim.claimantStudentId}</p>
                          )}
                          <div className="flex items-center gap-2 mt-1">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            <p className="text-muted-foreground text-xs truncate">{claim.claimantEmail}</p>
                          </div>
                          {claim.claimantPhone && (
                            <div className="flex items-center gap-2">
                              <Phone className="h-4 w-4 text-muted-foreground" />
                              <p className="text-muted-foreground text-xs">{claim.claimantPhone}</p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Submission Date */}
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground mb-2">Submitted</p>
                        <div className="space-y-1 text-sm">
                          <p className="text-foreground">
                            {new Date(claim.submittedAt).toLocaleDateString()}
                          </p>
                          <p className="text-muted-foreground">
                            {new Date(claim.submittedAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Actions for Pending Claims */}
                    {claim.status === 'pending' && (
                      <div className="border-t border-border pt-4">
                        {claimRejectingId === claim.id ? (
                          <div className="space-y-3">
                            <Textarea
                              placeholder="Reason for rejection..."
                              value={claimRejectReason[claim.id] || ''}
                              onChange={(e) =>
                                setClaimRejectReason(prev => ({
                                  ...prev,
                                  [claim.id]: e.target.value,
                                }))
                              }
                              rows={3}
                            />
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleRejectClaim(claim)}
                                disabled={processingId === claim.id}
                              >
                                {processingId === claim.id ? 'Rejecting...' : 'Confirm Reject'}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setClaimRejectingId(null)}
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              className="gap-2 bg-success hover:bg-success/90"
                              onClick={() => handleApproveClaim(claim)}
                              disabled={processingId === claim.id}
                            >
                              <Check className="h-4 w-4" />
                              {processingId === claim.id
                                ? 'Approving...'
                                : 'Approve (Office Visit)'}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="gap-2 text-destructive hover:text-destructive"
                              onClick={() => setClaimRejectingId(claim.id)}
                              disabled={processingId === claim.id}
                            >
                              <X className="h-4 w-4" />
                              Reject
                            </Button>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Display Info for Approved/Rejected Claims */}
                    {claim.status !== 'pending' && (
                      <div className="border-t border-border pt-4">
                        <div className="text-sm">
                          <p className="text-muted-foreground">
                            {claim.status === 'approved'
                              ? 'Approved for office visit on '
                              : 'Rejected on '}
                            {claim.reviewedAt ? new Date(claim.reviewedAt).toLocaleDateString() : 'Unknown'}
                          </p>
                          {claim.internalNotes && (
                            <p className="text-destructive mt-1 text-xs">
                              Note: {claim.internalNotes}
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )
            ) : (
              // ITEMS VIEW
              displayItems.length === 0 ? (
                <div className="text-center py-12 bg-card border border-border rounded-2xl">
                  <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    {activeTab === 'pending-items' ? 'No items pending approval' : 'No items found'}
                  </p>
                </div>
              ) : (
                displayItems.map((item) => (
                  <div
                    key={item.id}
                    className={cn(
                      'bg-card border rounded-2xl p-6 transition-colors',
                      item.approvalStatus === 'pending' ? 'border-warning/50 bg-warning/5' : 'border-border'
                    )}
                  >
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                      {/* Item Info */}
                      <div className="md:col-span-2">
                        <div className="flex gap-4">
                          <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-secondary text-2xl flex-shrink-0">
                            {categoryIcons[item.category]}
                          </div>
                          <div className="min-w-0">
                            <h3 className="font-semibold text-foreground text-lg line-clamp-2">
                              {item.title}
                            </h3>
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                              {item.description}
                            </p>
                            <div className="flex gap-2 mt-2 flex-wrap">
                              <span className="px-2 py-0.5 rounded text-xs bg-secondary text-foreground">
                                {categoryLabels[item.category]}
                              </span>
                              <span className={cn('px-2 py-0.5 rounded text-xs', statusColors[item.status])}>
                                {item.status}
                              </span>
                              {item.approvalStatus && (
                                <span
                                  className={cn(
                                    'px-2 py-0.5 rounded text-xs font-medium',
                                    item.approvalStatus === 'pending'
                                      ? 'bg-warning/20 text-warning'
                                      : item.approvalStatus === 'approved'
                                      ? 'bg-success/20 text-success'
                                      : 'bg-destructive/20 text-destructive'
                                  )}
                                >
                                  {item.approvalStatus}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Student Info */}
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground mb-2">Reporter</p>
                        <div className="space-y-1 text-sm">
                          <p className="text-foreground font-medium">{item.studentName || 'N/A'}</p>
                          <p className="text-muted-foreground">{item.studentId || 'N/A'}</p>
                          <p className="text-muted-foreground">{item.grade || 'N/A'}</p>
                          <p className="text-muted-foreground text-xs">{item.contactEmail}</p>
                        </div>
                      </div>

                      {/* Location & Date */}
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground mb-2">Details</p>
                        <div className="space-y-1 text-sm">
                          <p className="text-foreground">
                            <strong>Location:</strong>
                          </p>
                          <p className="text-muted-foreground truncate">{item.location}</p>
                          <p className="text-foreground mt-2">
                            <strong>Date:</strong>
                          </p>
                          <p className="text-muted-foreground">
                            {new Date(item.dateFound).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Actions for Pending Items */}
                    {item.approvalStatus === 'pending' && (
                      <div className="border-t border-border pt-4">
                        {rejectingId === item.id ? (
                          <div className="space-y-3">
                            <Textarea
                              placeholder="Reason for rejection..."
                              value={rejectReason[item.id] || ''}
                              onChange={(e) =>
                                setRejectReason(prev => ({
                                  ...prev,
                                  [item.id]: e.target.value,
                                }))
                              }
                              rows={3}
                            />
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleRejectItem(item)}
                                disabled={processingId === item.id}
                              >
                                {processingId === item.id ? 'Rejecting...' : 'Confirm Reject'}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setRejectingId(null)}
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              className="gap-2 bg-success hover:bg-success/90"
                              onClick={() => handleApproveItem(item)}
                              disabled={processingId === item.id}
                            >
                              <Check className="h-4 w-4" />
                              {processingId === item.id ? 'Approving...' : 'Approve'}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="gap-2 text-destructive hover:text-destructive"
                              onClick={() => setRejectingId(item.id)}
                              disabled={processingId === item.id}
                            >
                              <X className="h-4 w-4" />
                              Reject
                            </Button>
                            <Link href={`/item/${item.id}`} className="ml-auto">
                              <Button size="sm" variant="outline" className="gap-2">
                                <Eye className="h-4 w-4" />
                                View
                              </Button>
                            </Link>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Display Info for Approved/Rejected Items */}
                    {item.approvalStatus !== 'pending' && (
                      <div className="border-t border-border pt-4">
                        <div className="flex items-center justify-between">
                          <div className="text-sm">
                            <p className="text-muted-foreground">
                              {item.approvalStatus === 'approved' ? 'Approved' : 'Rejected'} on{' '}
                              {item.approvedAt
                                ? new Date(item.approvedAt).toLocaleDateString()
                                : 'Unknown'}
                            </p>
                            {item.rejectionReason && (
                              <p className="text-destructive mt-1 text-xs">
                                Reason: {item.rejectionReason}
                              </p>
                            )}
                          </div>
                          <Link href={`/item/${item.id}`}>
                            <Button size="sm" variant="outline" className="gap-2">
                              <Eye className="h-4 w-4" />
                              View
                            </Button>
                          </Link>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )
            )}
          </div>
        </div>
      </section>
    </Layout>
  );
}
