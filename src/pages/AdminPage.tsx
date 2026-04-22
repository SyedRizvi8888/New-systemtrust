/**
 * Admin Dashboard Page
 * 
 * Provides administrative interface for managing lost items and claim requests.
 * Features include:
 * - Statistics overview
 * - Recent items management
 * - Claim request review and approval
 * - Item status updates
 * 
 * @page AdminPage
 */

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
import { ClaimCase, ClaimCaseEvent, ClaimRequest, LostItem } from '@/types';
import { 
  Package, 
  ClipboardList, 
  CheckCircle2, 
  Search,
  Check,
  X,
  Eye,
  Megaphone,
  MessageSquare,
  ShieldAlert,
  ClipboardCheck,
  CheckCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
  addClaimCaseEvent,
  ensureClaimCaseForClaim,
  fetchClaimCaseEvents,
  fetchClaimCases,
  fetchClaims,
  fetchEvidenceByClaim,
  fetchItems,
  sendAdminMessageToClaimant,
  updateClaim,
  updateClaimCase,
  updateItem,
} from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Props for StatCard component displaying dashboard metrics
 */
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
  const [claims, setClaims] = useState<ClaimRequest[]>([]);
  const [claimCases, setClaimCases] = useState<Record<string, ClaimCase>>({});
  const [caseEvents, setCaseEvents] = useState<Record<string, ClaimCaseEvent[]>>({});
  const [evidence, setEvidence] = useState<Record<string, any[]>>({});
  const [activeTab, setActiveTab] = useState<'review' | 'items'>('review');
  const [isLoading, setIsLoading] = useState(true);
  const [messageDrafts, setMessageDrafts] = useState<Record<string, string>>({});
  const [sendingMessageFor, setSendingMessageFor] = useState<string | null>(null);
  const [notesDrafts, setNotesDrafts] = useState<Record<string, string>>({});
  const [savingNotesFor, setSavingNotesFor] = useState<string | null>(null);
  const [selectedClaimId, setSelectedClaimId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionBusyClaimId, setActionBusyClaimId] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [itemsData, claimsData, casesData] = await Promise.all([
        fetchItems(),
        fetchClaims(),
        fetchClaimCases(),
      ]);
      setItems(itemsData);
      setClaims(claimsData);

      const casesMap: Record<string, ClaimCase> = {};
      casesData.forEach((claimCase) => {
        casesMap[claimCase.claimRequestId] = claimCase;
      });

      const missingCases = claimsData.filter((claim) => !casesMap[claim.id]);
      if (missingCases.length > 0) {
        const createdCases = await Promise.all(
          missingCases.map((claim) => ensureClaimCaseForClaim(claim.id))
        );
        createdCases.forEach((claimCase) => {
          casesMap[claimCase.claimRequestId] = claimCase;
        });
      }

      setClaimCases(casesMap);

      if (!selectedClaimId && claimsData.length > 0) {
        setSelectedClaimId(claimsData[0].id);
      }

      // Load evidence for all claims
      const evidenceMap: Record<string, any[]> = {};
      for (const claim of claimsData) {
        const claimEvidence = await fetchEvidenceByClaim(claim.id);
        if (claimEvidence.length > 0) {
          evidenceMap[claim.id] = claimEvidence;
        }
      }
      setEvidence(evidenceMap);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(err);
      toast.error('Failed to load admin data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  useEffect(() => {
    const run = async () => {
      if (!selectedClaimId) return;
      const claimCase = claimCases[selectedClaimId];
      if (!claimCase) return;
      try {
        const events = await fetchClaimCaseEvents(claimCase.id);
        setCaseEvents((prev) => ({ ...prev, [selectedClaimId]: events }));
      } catch (error) {
        console.error('Failed to load claim case events:', error);
      }
    };

    void run();
  }, [selectedClaimId, claimCases]);

  const stats = {
    total: items.length,
    found: items.filter(i => i.status === 'found').length,
    missing: items.filter(i => i.status === 'lost').length,
    returned: items.filter(i => i.status === 'returned').length,
    pendingClaims: claims.filter(c => c.status === 'pending' || c.status === 'needs_info').length,
  };

  const statusLabel = (status: ClaimRequest['status']) => {
    switch (status) {
      case 'needs_info':
        return 'needs info';
      case 'pickup_scheduled':
        return 'ready for pickup';
      default:
        return status;
    }
  };

  const priorityLabel = (priority?: ClaimCase['priority']) => {
    if (!priority) return 'normal';
    return priority;
  };

  const priorityClass = (priority?: ClaimCase['priority']) => {
    switch (priority) {
      case 'urgent':
        return 'bg-destructive/15 text-destructive';
      case 'high':
        return 'bg-warning/20 text-warning';
      case 'low':
        return 'bg-muted text-muted-foreground';
      default:
        return 'bg-secondary/60 text-foreground';
    }
  };

  const runClaimAction = async (params: {
    claim: ClaimRequest;
    nextStatus: ClaimRequest['status'];
    caseState: ClaimCase['state'];
    casePriority?: ClaimCase['priority'];
    itemStatus?: LostItem['status'];
    eventType: string;
    eventNotes?: string;
  }) => {
    const { claim, nextStatus, caseState, casePriority, itemStatus, eventType, eventNotes } = params;
    const item = items.find(i => i.id === claim.itemId);

    try {
      setActionBusyClaimId(claim.id);
      const claimCase = claimCases[claim.id] ?? await ensureClaimCaseForClaim(claim.id);
      const updatedCase = await updateClaimCase(claimCase.id, {
        state: caseState,
        priority: casePriority ?? claimCase.priority,
        closedAt: caseState === 'closed' ? new Date().toISOString() : claimCase.closedAt,
      });

      await updateClaim(claim.id, {
        status: nextStatus,
        reviewedAt: new Date().toISOString(),
        reviewedBy: user?.id,
      });

      if (item && itemStatus) {
        await updateItem(item.id, {
          status: itemStatus,
          claimedBy: nextStatus === 'closed' ? claim.claimantName : item.claimedBy,
          claimedAt: nextStatus === 'closed' ? new Date().toISOString() : item.claimedAt,
        });
      }

      if (updatedCase) {
        await addClaimCaseEvent({
          claimCaseId: updatedCase.id,
          eventType,
          fromState: claimCase.state,
          toState: updatedCase.state,
          actorUserId: user?.id,
          notes: eventNotes,
        });
      }

      await loadData();
      toast.success('Claim updated');
    } catch (error) {
      console.error('Failed to update claim:', error);
      toast.error('Failed to update claim');
    } finally {
      setActionBusyClaimId(null);
    }
  };

  const handleSendMessage = async (claim: ClaimRequest) => {
    const message = (messageDrafts[claim.id] ?? '').trim();
    if (!message) {
      toast.error('Please enter a message first');
      return;
    }

    try {
      setSendingMessageFor(claim.id);
      await sendAdminMessageToClaimant({
        claimId: claim.id,
        claimantEmail: claim.claimantEmail,
        message,
        itemId: claim.itemId,
        adminUserId: user?.id,
      });

      const claimCase = claimCases[claim.id] ?? await ensureClaimCaseForClaim(claim.id);
      await addClaimCaseEvent({
        claimCaseId: claimCase.id,
        eventType: 'message_sent',
        actorUserId: user?.id,
        notes: message,
      });

      setMessageDrafts(prev => ({ ...prev, [claim.id]: '' }));
      toast.success('Message queued for delivery');
      if (selectedClaimId === claim.id) {
        const events = await fetchClaimCaseEvents(claimCase.id);
        setCaseEvents((prev) => ({ ...prev, [claim.id]: events }));
      }
    } catch (error: any) {
      console.error('Failed to send admin message:', error);
      toast.error('Failed to send message', {
        description: error?.message || 'Please try again.',
      });
    } finally {
      setSendingMessageFor(null);
    }
  };

  const handleSaveNotes = async (claim: ClaimRequest) => {
    const notes = (notesDrafts[claim.id] ?? '').trim();
    try {
      setSavingNotesFor(claim.id);
      await updateClaim(claim.id, { internalNotes: notes });
      const claimCase = claimCases[claim.id] ?? await ensureClaimCaseForClaim(claim.id);
      await addClaimCaseEvent({
        claimCaseId: claimCase.id,
        eventType: 'admin_note',
        actorUserId: user?.id,
        notes,
      });
      toast.success('Notes saved');
      await loadData();
      if (selectedClaimId === claim.id) {
        const events = await fetchClaimCaseEvents(claimCase.id);
        setCaseEvents((prev) => ({ ...prev, [claim.id]: events }));
      }
    } catch (error) {
      console.error('Failed to save notes:', error);
      toast.error('Failed to save notes');
    } finally {
      setSavingNotesFor(null);
    }
  };

  const handleFlagSuspicious = async (claim: ClaimRequest) => {
    try {
      setActionBusyClaimId(claim.id);
      const claimCase = claimCases[claim.id] ?? await ensureClaimCaseForClaim(claim.id);
      const updatedCase = await updateClaimCase(claimCase.id, {
        priority: 'urgent',
        state: claimCase.state,
      });
      if (updatedCase) {
        await addClaimCaseEvent({
          claimCaseId: updatedCase.id,
          eventType: 'flagged_suspicious',
          actorUserId: user?.id,
          notes: 'Flagged as suspicious for review',
        });
      }
      await loadData();
      toast.success('Flagged for review');
    } catch (error) {
      console.error('Failed to flag claim:', error);
      toast.error('Failed to flag claim');
    } finally {
      setActionBusyClaimId(null);
    }
  };

  const pendingClaims = claims.filter(c => c.status === 'pending' || c.status === 'needs_info');

  const filteredClaims = claims.filter((claim) => {
    if (!searchTerm.trim()) return true;
    const item = items.find(i => i.id === claim.itemId);
    const haystack = [
      claim.claimantName,
      claim.claimantEmail,
      claim.claimantPhone,
      claim.claimantStudentId,
      item?.title,
      item?.location,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    return haystack.includes(searchTerm.trim().toLowerCase());
  });

  const selectedClaim = claims.find((claim) => claim.id === selectedClaimId) ?? null;
  const selectedItem = selectedClaim ? items.find(i => i.id === selectedClaim.itemId) ?? null : null;
  const selectedCase = selectedClaim ? claimCases[selectedClaim.id] ?? null : null;
  const selectedEvents = selectedClaim ? caseEvents[selectedClaim.id] ?? [] : [];

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
              Manage found items and review claim requests.
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-10">
            <StatCard
              icon={Package}
              value={stats.total}
              label="Total Items"
              color="text-info"
              bgColor="bg-info/15"
            />
            <StatCard
              icon={Search}
              value={stats.found}
              label="Found Listings"
              color="text-accent"
              bgColor="bg-accent/15"
            />
            <StatCard
              icon={Megaphone}
              value={stats.missing}
              label="Missing Reports"
              color="text-destructive"
              bgColor="bg-destructive/10"
            />
            <StatCard
              icon={ClipboardList}
              value={stats.pendingClaims}
              label="Pending Claims"
              color="text-warning"
              bgColor="bg-warning/15"
            />
            <StatCard
              icon={CheckCircle2}
              value={stats.returned}
              label="Items Returned"
              color="text-success"
              bgColor="bg-success/15"
            />
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setActiveTab('review')}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                activeTab === 'review'
                  ? 'bg-accent text-accent-foreground'
                  : 'bg-card border border-border text-muted-foreground hover:text-foreground'
              )}
            >
              Review Center ({pendingClaims.length})
              {pendingClaims.length > 0 && (
                <span className="ml-2 inline-block h-2 w-2 rounded-full bg-destructive" />
              )}
            </button>
            <button
              onClick={() => setActiveTab('items')}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                activeTab === 'items'
                  ? 'bg-accent text-accent-foreground'
                  : 'bg-card border border-border text-muted-foreground hover:text-foreground'
              )}
            >
              All Items ({items.length})
            </button>
          </div>

          {/* Items Table */}
          {activeTab === 'items' && (
            <div className="bg-card border border-border rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-secondary/50">
                      <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Item
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Category
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Location
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {isLoading ? (
                      Array.from({ length: 5 }).map((_, i) => (
                        <tr key={i}>
                          <td colSpan={6} className="px-6 py-4">
                            <div className="h-6 bg-muted rounded animate-pulse" />
                          </td>
                        </tr>
                      ))
                    ) : items.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                          No items found
                        </td>
                      </tr>
                    ) : (
                      items.map((item) => (
                        <tr key={item.id} className="hover:bg-secondary/30 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary text-lg">
                                {categoryIcons[item.category]}
                              </div>
                              <div>
                                <p className="font-medium text-foreground truncate max-w-[200px]">
                                  {item.title}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-muted-foreground">
                            {categoryLabels[item.category]}
                          </td>
                          <td className="px-6 py-4 text-sm text-muted-foreground truncate max-w-[150px]">
                            {item.location}
                          </td>
                          <td className="px-6 py-4 text-sm text-muted-foreground whitespace-nowrap">
                            {new Date(item.dateFound).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4">
                            <span className={cn('status-badge capitalize', statusColors[item.status])}>
                              {item.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <Link href={`/item/${item.id}`}>
                              <Button variant="ghost" size="sm" className="gap-1">
                                <Eye className="h-4 w-4" />
                                View
                              </Button>
                            </Link>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Review Center */}
          {activeTab === 'review' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="bg-card border border-border rounded-2xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">Review Queue</h3>
                    <p className="text-sm text-muted-foreground">
                      {filteredClaims.length} claims
                    </p>
                  </div>
                </div>
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by claimant, item, or email"
                  className="mb-4"
                />
                <div className="space-y-3 max-h-[640px] overflow-y-auto pr-1">
                  {isLoading && (
                    <div className="space-y-2">
                      {Array.from({ length: 4 }).map((_, idx) => (
                        <div key={idx} className="h-20 bg-muted rounded-xl animate-pulse" />
                      ))}
                    </div>
                  )}
                  {!isLoading && filteredClaims.length === 0 && (
                    <div className="text-sm text-muted-foreground text-center py-6">
                      No claims match your search.
                    </div>
                  )}
                  {!isLoading && filteredClaims.map((claim) => {
                    const item = items.find(i => i.id === claim.itemId);
                    const claimCase = claimCases[claim.id];
                    const isSelected = claim.id === selectedClaimId;
                    return (
                      <button
                        key={claim.id}
                        type="button"
                        onClick={() => setSelectedClaimId(claim.id)}
                        className={cn(
                          'w-full text-left rounded-xl border p-4 transition-colors',
                          isSelected
                            ? 'border-accent bg-accent/10'
                            : 'border-border hover:border-accent/60 hover:bg-secondary/30'
                        )}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-sm font-medium text-foreground truncate">
                            {claim.claimantName}
                          </p>
                          <span className={cn('px-2 py-0.5 rounded-full text-[11px] font-medium capitalize', priorityClass(claimCase?.priority))}>
                            {priorityLabel(claimCase?.priority)}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground truncate mb-2">
                          {item?.title || 'Unknown Item'} • {item?.location || 'Unknown location'}
                        </p>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span className="capitalize">{statusLabel(claim.status)}</span>
                          <span>{new Date(claim.submittedAt).toLocaleDateString()}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-6">
                {!selectedClaim || !selectedCase ? (
                  <div className="text-center text-muted-foreground py-24">
                    <ClipboardList className="h-12 w-12 mx-auto mb-4" />
                    <p>Select a claim to review.</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                      <div>
                        <h3 className="text-2xl font-semibold text-foreground">
                          {selectedItem?.title || 'Unknown Item'}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          Claimant: {selectedClaim.claimantName}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-secondary/60 text-foreground capitalize">
                          {statusLabel(selectedClaim.status)}
                        </span>
                        <span className={cn('px-3 py-1 rounded-full text-xs font-medium capitalize', priorityClass(selectedCase.priority))}>
                          {priorityLabel(selectedCase.priority)} priority
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="rounded-xl border border-border p-4">
                        <p className="text-xs font-semibold text-muted-foreground mb-3">Claimant details</p>
                        <div className="space-y-2 text-sm">
                          <p><span className="text-muted-foreground">Email:</span> {selectedClaim.claimantEmail}</p>
                          {selectedClaim.claimantPhone && (
                            <p><span className="text-muted-foreground">Phone:</span> {selectedClaim.claimantPhone}</p>
                          )}
                          {selectedClaim.claimantStudentId && (
                            <p><span className="text-muted-foreground">Student ID:</span> {selectedClaim.claimantStudentId}</p>
                          )}
                          {selectedClaim.preferredContactMethod && (
                            <p><span className="text-muted-foreground">Preferred contact:</span> {selectedClaim.preferredContactMethod.replace('_', ' ')}</p>
                          )}
                          <p><span className="text-muted-foreground">Submitted:</span> {new Date(selectedClaim.submittedAt).toLocaleString()}</p>
                        </div>
                      </div>

                      <div className="rounded-xl border border-border p-4">
                        <p className="text-xs font-semibold text-muted-foreground mb-3">Item details</p>
                        <div className="space-y-2 text-sm">
                          <p><span className="text-muted-foreground">Location:</span> {selectedItem?.location || 'Unknown'}</p>
                          <p><span className="text-muted-foreground">Date:</span> {selectedItem?.dateFound ? new Date(selectedItem.dateFound).toLocaleDateString() : 'Unknown'}</p>
                          <p><span className="text-muted-foreground">Status:</span> {selectedItem?.status || 'Unknown'}</p>
                          {selectedItem?.studentName && (
                            <p><span className="text-muted-foreground">Reporter:</span> {selectedItem.studentName}</p>
                          )}
                          {selectedItem?.contactEmail && (
                            <p><span className="text-muted-foreground">Reporter email:</span> {selectedItem.contactEmail}</p>
                          )}
                          {selectedItem?.contactPhone && (
                            <p><span className="text-muted-foreground">Reporter phone:</span> {selectedItem.contactPhone}</p>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="rounded-xl border border-border p-4">
                      <p className="text-xs font-semibold text-muted-foreground mb-3">Ownership proof</p>
                      <p className="text-sm text-muted-foreground bg-secondary/40 p-3 rounded-lg">
                        {selectedClaim.proofDescription}
                      </p>
                      {evidence[selectedClaim.id] && evidence[selectedClaim.id].length > 0 && (
                        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {evidence[selectedClaim.id].map((ev: any, idx: number) => (
                            <div key={idx} className="border border-border rounded-xl p-2">
                              {ev.file_url && (
                                <img
                                  src={ev.file_url}
                                  alt={`Evidence for ${selectedItem?.title ?? 'claim'}`}
                                  className="w-full h-48 object-cover rounded-lg"
                                />
                              )}
                              <p className="mt-2 text-xs text-muted-foreground">Evidence {idx + 1}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="rounded-xl border border-border p-4">
                      <p className="text-xs font-semibold text-muted-foreground mb-3">Actions</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-2 text-success hover:text-success"
                          disabled={actionBusyClaimId === selectedClaim.id}
                          onClick={() =>
                            runClaimAction({
                              claim: selectedClaim,
                              nextStatus: 'approved',
                              caseState: 'approved',
                              itemStatus: 'matched',
                              eventType: 'approved',
                            })
                          }
                        >
                          <CheckCircle className="h-4 w-4" />
                          Approve claim
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-2 text-destructive hover:text-destructive"
                          disabled={actionBusyClaimId === selectedClaim.id}
                          onClick={() =>
                            runClaimAction({
                              claim: selectedClaim,
                              nextStatus: 'rejected',
                              caseState: 'rejected',
                              eventType: 'rejected',
                            })
                          }
                        >
                          <X className="h-4 w-4" />
                          Reject claim
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-2"
                          disabled={actionBusyClaimId === selectedClaim.id}
                          onClick={() =>
                            runClaimAction({
                              claim: selectedClaim,
                              nextStatus: 'needs_info',
                              caseState: 'verification',
                              eventType: 'needs_info_requested',
                              eventNotes: 'Requested additional proof from claimant',
                            })
                          }
                        >
                          <MessageSquare className="h-4 w-4" />
                          Request more proof
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-2"
                          disabled={actionBusyClaimId === selectedClaim.id}
                          onClick={() =>
                            runClaimAction({
                              claim: selectedClaim,
                              nextStatus: 'pickup_scheduled',
                              caseState: 'pickup_scheduled',
                              itemStatus: 'matched',
                              eventType: 'ready_for_pickup',
                              eventNotes: 'Marked ready for pickup',
                            })
                          }
                        >
                          <ClipboardCheck className="h-4 w-4" />
                          Mark ready for pickup
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-2"
                          disabled={actionBusyClaimId === selectedClaim.id}
                          onClick={() =>
                            runClaimAction({
                              claim: selectedClaim,
                              nextStatus: 'closed',
                              caseState: 'closed',
                              itemStatus: 'returned',
                              eventType: 'returned',
                              eventNotes: 'Item returned to claimant',
                            })
                          }
                        >
                          <CheckCircle2 className="h-4 w-4" />
                          Mark returned
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-2"
                          disabled={actionBusyClaimId === selectedClaim.id}
                          onClick={() => handleFlagSuspicious(selectedClaim)}
                        >
                          <ShieldAlert className="h-4 w-4" />
                          Flag suspicious
                        </Button>
                      </div>
                    </div>

                    <div className="rounded-xl border border-border p-4">
                      <p className="text-xs font-semibold text-muted-foreground mb-3">Office notes</p>
                      <Textarea
                        value={notesDrafts[selectedClaim.id] ?? selectedClaim.internalNotes ?? ''}
                        onChange={(e) =>
                          setNotesDrafts((prev) => ({
                            ...prev,
                            [selectedClaim.id]: e.target.value,
                          }))
                        }
                        placeholder="Add internal notes for staff..."
                        rows={4}
                        className="mb-3"
                      />
                      <Button
                        size="sm"
                        onClick={() => handleSaveNotes(selectedClaim)}
                        disabled={savingNotesFor === selectedClaim.id}
                      >
                        {savingNotesFor === selectedClaim.id ? 'Saving...' : 'Save notes'}
                      </Button>
                    </div>

                    <div className="rounded-xl border border-border p-4">
                      <p className="text-xs font-semibold text-muted-foreground mb-3">Message claimant</p>
                      <Textarea
                        value={messageDrafts[selectedClaim.id] ?? ''}
                        onChange={(e) =>
                          setMessageDrafts(prev => ({
                            ...prev,
                            [selectedClaim.id]: e.target.value,
                          }))
                        }
                        placeholder="Send guidance or pickup instructions..."
                        rows={3}
                        className="mb-3"
                      />
                      <Button
                        size="sm"
                        onClick={() => handleSendMessage(selectedClaim)}
                        disabled={sendingMessageFor === selectedClaim.id}
                      >
                        {sendingMessageFor === selectedClaim.id ? 'Sending...' : 'Send message'}
                      </Button>
                    </div>

                    <div className="rounded-xl border border-border p-4">
                      <p className="text-xs font-semibold text-muted-foreground mb-3">Case history</p>
                      {selectedEvents.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No events recorded yet.</p>
                      ) : (
                        <div className="space-y-3">
                          {selectedEvents.map((event) => (
                            <div key={event.id} className="flex items-start gap-3 text-sm">
                              <div className="mt-1 h-2 w-2 rounded-full bg-accent" />
                              <div>
                                <p className="font-medium text-foreground capitalize">
                                  {event.eventType.replace(/_/g, ' ')}
                                </p>
                                {event.notes && (
                                  <p className="text-muted-foreground">{event.notes}</p>
                                )}
                                <p className="text-xs text-muted-foreground">
                                  {new Date(event.createdAt).toLocaleString()}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
}
