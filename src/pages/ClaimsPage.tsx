/**
 * Claims Management Page
 * 
 * Displays two sections for users to manage their claims:
 * 1. My Claims - Claims submitted by the current user for items they want to retrieve
 * 2. Claims on My Items - Claims submitted by others for items the user reported
 * 
 * Shows claim status, item details, and contact information
 * 
 * @page ClaimsPage
 */

"use client";

import { useState, useEffect } from 'react';
import { Layout } from '@/components/layout/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { deleteItem, fetchClaimCaseEvents, fetchClaimCases, fetchClaims, fetchItems, updateClaim, updateItem } from '@/lib/api';
import { ClaimCase, ClaimCaseEvent, ClaimRequest, LostItem } from '@/types';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, CheckCircle2, XCircle, Package, Calendar, User, Mail, Phone, MessageSquare, Check, X, Trash2, Archive } from 'lucide-react';
import { toast } from 'sonner';

/**
 * ClaimsPage Component
 * Renders claims management interface for users
 */
export default function ClaimsPage() {
  const { user } = useAuth();
  const [myClaims, setMyClaims] = useState<ClaimRequest[]>([]);
  const [claimsOnMyItems, setClaimsOnMyItems] = useState<ClaimRequest[]>([]);
  const [myPostedItems, setMyPostedItems] = useState<LostItem[]>([]);
  const [items, setItems] = useState<LostItem[]>([]);
  const [claimEvents, setClaimEvents] = useState<Record<string, ClaimCaseEvent[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [claimsData, itemsData, claimCasesData] = await Promise.all([
        fetchClaims(),
        fetchItems(),
        fetchClaimCases(),
      ]);

      const currentEmail = user?.email?.toLowerCase();
      const isMine = (item: LostItem) => {
        if (item.createdBy && user?.id) return item.createdBy === user.id;
        if (currentEmail && item.contactEmail) {
          return item.contactEmail.toLowerCase() === currentEmail;
        }
        return false;
      };
      
      // Filter claims submitted by current user
      const userSubmittedClaims = claimsData.filter(c => c.claimantEmail === user?.email);
      
      // Filter claims made on items created by current user
      const myItemIds = itemsData
        .filter(isMine)
        .map(item => item.id);
      const claimsOnUserItems = claimsData.filter(c => myItemIds.includes(c.itemId));
      const userPostedItems = itemsData.filter(
        item => isMine(item) && item.status !== 'matched' && item.status !== 'returned' && item.status !== 'archived'
      );
      
      const casesMap: Record<string, ClaimCase> = {};
      claimCasesData.forEach((claimCase) => {
        casesMap[claimCase.claimRequestId] = claimCase;
      });

      const eventsEntries = await Promise.all(
        userSubmittedClaims.map(async (claim) => {
          const claimCase = casesMap[claim.id];
          if (!claimCase) return [claim.id, []] as const;
          try {
            const events = await fetchClaimCaseEvents(claimCase.id);
            return [claim.id, events] as const;
          } catch (error) {
            console.error('Error loading claim events:', error);
            return [claim.id, []] as const;
          }
        })
      );

      const eventsMap: Record<string, ClaimCaseEvent[]> = {};
      eventsEntries.forEach(([claimId, events]) => {
        eventsMap[claimId] = events;
      });

      setMyClaims(userSubmittedClaims);
      setClaimsOnMyItems(claimsOnUserItems);
      setMyPostedItems(userPostedItems);
      setItems(itemsData);
      setClaimEvents(eventsMap);
    } catch (error) {
      console.error('Error loading claims:', error);
    } finally {
      setLoading(false);
    }
  };

  const getOfficeInstruction = (status: ClaimRequest['status']) => {
    switch (status) {
      case 'approved':
        return 'Approved. Wait for pickup scheduling or office follow-up.';
      case 'pickup_scheduled':
        return 'Ready for pickup. Bring your student ID to the main office.';
      case 'needs_info':
        return 'More proof needed. Check office messages and respond.';
      case 'rejected':
        return 'Claim rejected. Contact the main office if you believe this is an error.';
      case 'closed':
        return 'Claim closed. Item returned or case resolved.';
      default:
        return 'Under review. Wait for office instructions.';
    }
  };

  const getItemForClaim = (itemId: string) => {
    return items.find(item => item.id === itemId);
  };

  /**
   * Handle approving a claim
    * Updates claim status to approved and marks item as matched
   */
  const handleApproveClaim = async (claim: ClaimRequest) => {
    try {
      const item = getItemForClaim(claim.itemId);
      if (!item) return;

      // Update claim status to approved
      await updateClaim(claim.id, {
        status: 'approved',
        reviewedAt: new Date().toISOString()
      });

      // Update item status to matched
      await updateItem(item.id, {
        status: 'matched',
        claimedBy: claim.claimantName,
        claimedAt: new Date().toISOString(),
      });

      toast.success('Claim approved successfully');
      
      // Reload data to reflect changes
      await loadData();
    } catch (error) {
      console.error('Error approving claim:', error);
      toast.error('Failed to approve claim');
    }
  };

  /**
   * Handle rejecting a claim
   * Updates claim status to rejected
   */
  const handleRejectClaim = async (claim: ClaimRequest) => {
    try {
      await updateClaim(claim.id, {
        status: 'rejected',
        reviewedAt: new Date().toISOString()
      });

      toast.success('Claim rejected');
      
      // Reload data to reflect changes
      await loadData();
    } catch (error) {
      console.error('Error rejecting claim:', error);
      toast.error('Failed to reject claim');
    }
  };

  /**
   * Handle marking item as found
   * Updates item status to claimed/found
   */
  const handleMarkAsFound = async (item: LostItem) => {
    try {
      await updateItem(item.id, {
        status: 'found'
      });

      toast.success('Item moved to Found items');
      
      // Reload data to reflect changes
      await loadData();
    } catch (error) {
      console.error('Error marking item as found:', error);
      toast.error('Failed to mark item as found');
    }
  };

  /**
   * Handle deleting an item
   * Permanently removes item from database
   */
  const handleDeleteItem = async (item: LostItem) => {
    if (!confirm(`Are you sure you want to delete "${item.title}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await deleteItem(item.id);

      toast.success('Item deleted successfully');
      
      // Reload data to reflect changes
      await loadData();
    } catch (error) {
      console.error('Error deleting item:', error);
      toast.error('Failed to delete item');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'found':
        return <Package className="h-4 w-4" />;
      case 'lost':
        return <Package className="h-4 w-4" />;
      case 'under_review':
        return <Clock className="h-4 w-4" />;
      case 'matched':
        return <CheckCircle2 className="h-4 w-4" />;
      case 'returned':
        return <CheckCircle2 className="h-4 w-4" />;
      case 'archived':
        return <Archive className="h-4 w-4" />;
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'needs_info':
        return <MessageSquare className="h-4 w-4" />;
      case 'approved':
        return <CheckCircle2 className="h-4 w-4" />;
      case 'pickup_scheduled':
        return <Calendar className="h-4 w-4" />;
      case 'closed':
        return <Archive className="h-4 w-4" />;
      case 'rejected':
        return <XCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'found':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border-blue-300 dark:border-blue-700';
      case 'lost':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 border-purple-300 dark:border-purple-700';
      case 'under_review':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300 border-orange-300 dark:border-orange-700';
      case 'matched':
        return 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300 border-cyan-300 dark:border-cyan-700';
      case 'returned':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border-green-300 dark:border-green-700';
      case 'archived':
        return 'bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-600';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 border-yellow-300 dark:border-yellow-700';
      case 'needs_info':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border-blue-300 dark:border-blue-700';
      case 'approved':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border-green-300 dark:border-green-700';
      case 'pickup_scheduled':
        return 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300 border-cyan-300 dark:border-cyan-700';
      case 'closed':
        return 'bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-600';
      case 'rejected':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 border-red-300 dark:border-red-700';
      default:
        return 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300';
    }
  };

  if (!user) {
    return (
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-white via-green-50/30 to-green-100/20 dark:from-slate-900 dark:via-slate-900 dark:to-green-950/30 py-12">
          <div className="container-wide px-4">
            <Card className="p-8 text-center">
              <p className="text-slate-600 dark:text-slate-400">Please sign in to view your claims</p>
            </Card>
          </div>
        </div>
      </Layout>
    );
  }

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-white via-green-50/30 to-green-100/20 dark:from-slate-900 dark:via-slate-900 dark:to-green-950/30 py-12">
          <div className="container-wide px-4">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-1/4"></div>
              <div className="h-32 bg-slate-200 dark:bg-slate-700 rounded"></div>
              <div className="h-32 bg-slate-200 dark:bg-slate-700 rounded"></div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-white via-green-50/30 to-green-100/20 dark:from-slate-900 dark:via-slate-900 dark:to-green-950/30 py-12">
        <div className="container-wide px-4">
          {/* Header */}
          <div className="mb-8 animate-fade-in-up">
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-2">
              My Claims
            </h1>
            <p className="text-slate-600 dark:text-slate-400">
              Track your claim submissions and claims made on your items
            </p>
          </div>

          <div className="space-y-8">
            {/* My Submitted Claims Section */}
            <Card className="overflow-hidden">
            <div className="bg-gradient-to-r from-green-50 to-green-100/50 dark:from-green-950/30 dark:to-green-900/20 border-b-2 border-green-200 dark:border-green-800 p-6">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Package className="h-5 w-5 text-green-600" />
                My Claims
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                Claims you've submitted for found items
              </p>
            </div>
            
            <div className="p-6">
              {myClaims.length === 0 ? (
                <div className="text-center py-8">
                  <Package className="h-16 w-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                    No claims yet
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400 mb-6">
                    You haven't submitted any claim requests. Browse found items to claim yours.
                  </p>
                  <a
                    href="/search"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded transition-smooth btn-press"
                  >
                    Browse Items
                  </a>
                </div>
              ) : (
                <div className="space-y-4">
                  {myClaims.map((claim) => {
                    const item = getItemForClaim(claim.itemId);
                    const events = claimEvents[claim.id] ?? [];
                    const officeMessages = events.filter((event) =>
                      ['message_sent', 'needs_info_requested', 'ready_for_pickup'].includes(event.eventType)
                    );
                    return (
                      <div key={claim.id} className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 card-hover">
                        <div className="flex flex-col md:flex-row gap-4">
                          {item?.imageUrl && (
                            <div className="w-full md:w-24 h-24 flex-shrink-0">
                              <img
                                src={item.imageUrl}
                                alt={item.title}
                                className="w-full h-full object-cover rounded"
                              />
                            </div>
                          )}
                          
                          <div className="flex-1 space-y-3">
                            <div className="flex items-start justify-between gap-4">
                              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                                {item?.title || 'Item Not Found'}
                              </h3>
                              <Badge className={`${getStatusColor(claim.status)} flex items-center gap-1.5 px-3 py-1`}>
                                {getStatusIcon(claim.status)}
                                <span className="capitalize">{claim.status}</span>
                              </Badge>
                            </div>
                            
                            <div className="text-sm text-slate-600 dark:text-slate-400">
                              Submitted {new Date(claim.submittedAt).toLocaleDateString()}
                            </div>
                            
                            <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded border border-slate-200 dark:border-slate-700">
                              <p className="text-xs font-medium text-slate-900 dark:text-white mb-1">Proof of Ownership:</p>
                              <p className="text-sm text-slate-600 dark:text-slate-400">{claim.proofDescription}</p>
                            </div>

                            <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 p-3 rounded">
                              <p className="text-xs font-medium text-blue-900 dark:text-blue-200 mb-1">Office instructions</p>
                              <p className="text-sm text-blue-800 dark:text-blue-300">
                                {getOfficeInstruction(claim.status)}
                              </p>
                            </div>

                            {officeMessages.length > 0 && (
                              <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded border border-slate-200 dark:border-slate-700">
                                <p className="text-xs font-medium text-slate-900 dark:text-white mb-2">Office messages</p>
                                <div className="space-y-2">
                                  {officeMessages.map((event) => (
                                    <div key={event.id} className="text-sm text-slate-600 dark:text-slate-400">
                                      <p className="font-medium text-slate-900 dark:text-white">
                                        {event.eventType.replace(/_/g, ' ')}
                                      </p>
                                      {event.notes && <p>{event.notes}</p>}
                                      <p className="text-xs text-slate-500 dark:text-slate-500">
                                        {new Date(event.createdAt).toLocaleString()}
                                      </p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            
                            {claim.status === 'approved' && (
                              <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 p-3 rounded">
                                <p className="text-sm text-green-800 dark:text-green-300 font-medium">
                                  ✓ Approved! Pick up at Lost & Found Office during office hours (8:00 AM - 3:30 PM). Bring student ID.
                                </p>
                              </div>
                            )}
                            {claim.status === 'rejected' && (
                              <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 p-3 rounded">
                                <p className="text-sm text-red-800 dark:text-red-300 font-medium">
                                  Could not be verified. Contact the Lost & Found Office if this is an error.
                                </p>
                              </div>
                            )}
                            {claim.status === 'pending' && (
                              <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 p-3 rounded">
                                <p className="text-sm text-yellow-800 dark:text-yellow-300 font-medium">
                                  Under review by Student Services staff.
                                </p>
                              </div>
                            )}
                            {claim.status === 'needs_info' && (
                              <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 p-3 rounded">
                                <p className="text-sm text-blue-800 dark:text-blue-300 font-medium">
                                  Staff requested more details. Check your email and update your proof information.
                                </p>
                              </div>
                            )}
                            {claim.status === 'pickup_scheduled' && (
                              <div className="bg-cyan-50 dark:bg-cyan-950/20 border border-cyan-200 dark:border-cyan-800 p-3 rounded">
                                <p className="text-sm text-cyan-800 dark:text-cyan-300 font-medium">
                                  Pickup scheduled. Bring your student ID and arrive during office hours.
                                </p>
                              </div>
                            )}
                            {claim.status === 'closed' && (
                              <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3 rounded">
                                <p className="text-sm text-slate-700 dark:text-slate-300 font-medium">
                                  This claim is closed.
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </Card>

          {/* Claims on My Items Section */}
          <Card className="overflow-hidden">
            <div className="bg-gradient-to-r from-blue-50 to-blue-100/50 dark:from-blue-950/30 dark:to-blue-900/20 border-b-2 border-blue-200 dark:border-blue-800 p-6">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-blue-600" />
                Claims on My Items
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                Claims submitted by others for items you reported
              </p>
            </div>
            
            <div className="p-6">
              {claimsOnMyItems.length === 0 ? (
                <div className="text-center py-8">
                  <MessageSquare className="h-16 w-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                  <p className="text-slate-600 dark:text-slate-400">
                    No one has claimed your reported items yet.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {claimsOnMyItems.map((claim) => {
                    const item = getItemForClaim(claim.itemId);
                    return (
                      <div key={claim.id} className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 card-hover">
                        <div className="space-y-3">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                                {item?.title || 'Item'}
                              </h3>
                              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                                Claimed by {claim.claimantName} • {new Date(claim.submittedAt).toLocaleDateString()}
                              </p>
                            </div>
                            <Badge className={`${getStatusColor(claim.status)} flex items-center gap-1.5 px-3 py-1`}>
                              {getStatusIcon(claim.status)}
                              <span className="capitalize">{claim.status}</span>
                            </Badge>
                          </div>
                          
                          <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded border border-slate-200 dark:border-slate-700">
                            <p className="text-xs font-medium text-slate-900 dark:text-white mb-1">Proof of Ownership:</p>
                            <p className="text-sm text-slate-600 dark:text-slate-400">{claim.proofDescription}</p>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-slate-600 dark:text-slate-400">
                            <div className="flex items-center gap-2">
                              <Mail className="h-4 w-4 text-blue-600" />
                              {claim.claimantEmail}
                            </div>
                            {claim.claimantPhone && (
                              <div className="flex items-center gap-2">
                                <Phone className="h-4 w-4 text-blue-600" />
                                {claim.claimantPhone}
                              </div>
                            )}
                          </div>

                          {/* Approve/Reject buttons for pending claims */}
                          {(claim.status === 'pending' || claim.status === 'needs_info') && (
                            <div className="flex gap-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                              <Button
                                onClick={() => handleApproveClaim(claim)}
                                className="flex-1 bg-[#2d7a4f] hover:bg-[#246a42] text-white"
                                size="sm"
                              >
                                <Check className="h-4 w-4 mr-1" />
                                Approve
                              </Button>
                              <Button
                                onClick={() => handleRejectClaim(claim)}
                                variant="destructive"
                                className="flex-1"
                                size="sm"
                              >
                                <X className="h-4 w-4 mr-1" />
                                Reject
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </Card>
          {/* My Posted Items Section */}
          <Card className="overflow-hidden">
            <div className="bg-gradient-to-r from-purple-50 to-purple-100/50 dark:from-purple-950/30 dark:to-purple-900/20 border-b-2 border-purple-200 dark:border-purple-800 p-6">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Archive className="h-5 w-5 text-purple-600" />
                My Posted Items
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                Items you've reported as lost or found
              </p>
            </div>
            
            <div className="p-6">
              <div className="mb-4 rounded border border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-950/30 p-3">
                <p className="text-sm text-purple-800 dark:text-purple-200">
                  Found items should be turned in to the main office. Lost-item updates will be sent by email.
                </p>
              </div>
              {myPostedItems.length === 0 ? (
                <div className="text-center py-8">
                  <Archive className="h-16 w-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                  <p className="text-slate-600 dark:text-slate-400">
                    You haven't posted any items yet.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {myPostedItems.map((item) => (
                    <div key={item.id} className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 card-hover">
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                              {item.title}
                            </h3>
                            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                              {item.category} • Posted {new Date(item.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <Badge className={`${getStatusColor(item.status)} flex items-center gap-1.5 px-3 py-1`}>
                            {getStatusIcon(item.status)}
                            <span className="capitalize">{item.status}</span>
                          </Badge>
                        </div>
                        
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          {item.description}
                        </p>
                        
                        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                          <Calendar className="h-4 w-4 text-purple-600" />
                          {new Date(item.dateFound).toLocaleDateString()} at {item.location}
                        </div>

                        {/* Action buttons for active items */}
                        {item.status === 'lost' && (
                          <div className="flex gap-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                            <Button
                              onClick={() => handleMarkAsFound(item)}
                              className="flex-1 bg-[#2d7a4f] hover:bg-[#246a42] text-white"
                              size="sm"
                            >
                              <CheckCircle2 className="h-4 w-4 mr-1" />
                              Mark as Found
                            </Button>
                            <Button
                              onClick={() => handleDeleteItem(item)}
                              variant="destructive"
                              className="flex-1"
                              size="sm"
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              Delete
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>          </div>
        </div>
      </div>
    </Layout>
  );
}
