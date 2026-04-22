/**
 * API Module for Lost & Found System
 * 
 * This module provides all database operations for the Lost & Found application.
 * It handles CRUD operations for items and claims using Supabase as the backend.
 * 
 * @module api
 */

import type { ClaimCase, ClaimCaseEvent, ClaimRequest, ItemStatus, LostItem } from '@/types';
import { supabase, isSupabaseReady } from './supabaseClient';

/**
 * Database schema type for lost_items table
 */
type DbLostItem = {
  id: string;
  title: string;
  description: string;
  category: string;
  location: string;
  date_found: string;
  status: string;
  image_url?: string | null;
  contact_email?: string | null;
  contact_phone?: string | null;
  student_id?: string | null;
  student_name?: string | null;
  grade?: string | null;
  preferred_contact_method?: string | null;
  claimed_by?: string | null;
  claimed_at?: string | null;
  admin_notes?: string | null;
  created_at: string;
  updated_at: string;
  created_by?: string | null;
};

/**
 * Database schema type for claim_requests table
 */
type DbClaim = {
  id: string;
  item_id: string;
  claimant_name: string;
  claimant_email: string;
  claimant_phone?: string | null;
  claimant_student_id?: string | null;
  proof_description: string;
  preferred_contact_method?: string | null;
  status: string;
  submitted_at: string;
  reviewed_at?: string | null;
  reviewed_by?: string | null;
  internal_notes?: string | null;
};

/**
 * Database schema type for claim_cases table
 */
type DbClaimCase = {
  id: string;
  claim_request_id: string;
  state: string;
  priority: string;
  assigned_to?: string | null;
  sla_due_at?: string | null;
  closed_at?: string | null;
  created_at: string;
  updated_at: string;
};

/**
 * Database schema type for claim_case_events table
 */
type DbClaimCaseEvent = {
  id: string;
  claim_case_id: string;
  event_type: string;
  from_state?: string | null;
  to_state?: string | null;
  actor_user_id?: string | null;
  notes?: string | null;
  metadata?: Record<string, unknown> | null;
  created_at: string;
};

/**
 * Maps a database lost item record to the application's LostItem type
 * Converts snake_case fields to camelCase and handles nullable fields
 * 
 * @param row - Database record from lost_items table
 * @returns Mapped LostItem object
 */
const mapDbItem = (row: DbLostItem): LostItem => ({
  id: row.id,
  title: row.title,
  description: row.description,
  category: row.category as LostItem['category'],
  location: row.location,
  dateFound: row.date_found,
  status: row.status as ItemStatus,
  imageUrl: row.image_url ?? undefined,
  contactEmail: row.contact_email ?? undefined,
  contactPhone: row.contact_phone ?? undefined,
  studentId: row.student_id ?? undefined,
  studentName: row.student_name ?? undefined,
  grade: row.grade ?? undefined,
  preferredContactMethod: row.preferred_contact_method as LostItem['preferredContactMethod'] | undefined,
  claimedBy: row.claimed_by ?? undefined,
  claimedAt: row.claimed_at ?? undefined,
  adminNotes: row.admin_notes ?? undefined,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  createdBy: row.created_by ?? undefined,
});

/**
 * Maps a database claim record to the application's ClaimRequest type
 * Converts snake_case fields to camelCase and handles nullable fields
 * 
 * @param row - Database record from claim_requests table
 * @returns Mapped ClaimRequest object
 */
const mapDbClaim = (row: DbClaim): ClaimRequest => ({
  id: row.id,
  itemId: row.item_id,
  claimantName: row.claimant_name,
  claimantEmail: row.claimant_email,
  claimantPhone: row.claimant_phone ?? undefined,
  claimantStudentId: row.claimant_student_id ?? undefined,
  proofDescription: row.proof_description,
  preferredContactMethod: row.preferred_contact_method as ClaimRequest['preferredContactMethod'] | undefined,
  status: row.status as ClaimRequest['status'],
  submittedAt: row.submitted_at,
  reviewedAt: row.reviewed_at ?? undefined,
  reviewedBy: row.reviewed_by ?? undefined,
  internalNotes: row.internal_notes ?? undefined,
});

/**
 * Maps a database claim case record to the application's ClaimCase type
 */
const mapDbClaimCase = (row: DbClaimCase): ClaimCase => ({
  id: row.id,
  claimRequestId: row.claim_request_id,
  state: row.state as ClaimCase['state'],
  priority: row.priority as ClaimCase['priority'],
  assignedTo: row.assigned_to ?? undefined,
  slaDueAt: row.sla_due_at ?? undefined,
  closedAt: row.closed_at ?? undefined,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

/**
 * Maps a database claim case event record to the application's ClaimCaseEvent type
 */
const mapDbClaimCaseEvent = (row: DbClaimCaseEvent): ClaimCaseEvent => ({
  id: row.id,
  claimCaseId: row.claim_case_id,
  eventType: row.event_type,
  fromState: row.from_state ?? undefined,
  toState: row.to_state ?? undefined,
  actorUserId: row.actor_user_id ?? undefined,
  notes: row.notes ?? undefined,
  metadata: row.metadata ?? undefined,
  createdAt: row.created_at,
});

/**
 * Converts application LostItem type to database schema format
 * Transforms camelCase fields to snake_case for database insertion
 * 
 * @param item - Partial LostItem object from the application
 * @returns Database-compatible object for lost_items table
 */
const toDbItemPayload = (item: Partial<LostItem>): Partial<DbLostItem> => ({
  title: item.title,
  description: item.description,
  category: item.category,
  location: item.location,
  date_found: item.dateFound,
  status: item.status,
  image_url: item.imageUrl,
  contact_email: item.contactEmail,
  contact_phone: item.contactPhone,
  student_id: item.studentId,
  student_name: item.studentName,
  grade: item.grade,
  preferred_contact_method: item.preferredContactMethod,
  claimed_by: item.claimedBy,
  claimed_at: item.claimedAt,
  admin_notes: item.adminNotes,
  created_at: item.createdAt,
  updated_at: item.updatedAt,
  created_by: item.createdBy,
});

/**
 * Converts application ClaimRequest type to database schema format
 * Transforms camelCase fields to snake_case for database insertion
 * 
 * @param claim - Partial ClaimRequest object from the application
 * @returns Database-compatible object for claim_requests table
 */
const toDbClaimPayload = (claim: Partial<ClaimRequest>): Partial<DbClaim> => ({
  item_id: claim.itemId,
  claimant_name: claim.claimantName,
  claimant_email: claim.claimantEmail,
  claimant_phone: claim.claimantPhone,
  claimant_student_id: claim.claimantStudentId,
  proof_description: claim.proofDescription,
  preferred_contact_method: claim.preferredContactMethod,
  status: claim.status,
  submitted_at: claim.submittedAt,
  reviewed_at: claim.reviewedAt,
  reviewed_by: claim.reviewedBy,
  internal_notes: claim.internalNotes,
});

/**
 * Ensures Supabase client is properly configured before database operations
 * Throws an error if environment variables are missing
 * 
 * @throws {Error} When Supabase is not configured with required environment variables
 */
const ensureSupabase = () => {
  if (!isSupabaseReady) {
    throw new Error('Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local');
  }
};

/**
 * Fetches all lost items from the database
 * Returns items sorted by creation date (newest first)
 * 
 * @returns Promise resolving to array of LostItem objects
 * @throws {Error} When Supabase is not configured or database query fails
 */
export async function fetchItems(): Promise<LostItem[]> {
  ensureSupabase();
  const { data, error } = await supabase
    .from('lost_items')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Failed to fetch items:', error);
    throw error;
  }

  return (data ?? []).map(mapDbItem);
}

/**
 * Fetches a single lost item by its ID
 * 
 * @param id - Unique identifier of the item to fetch
 * @returns Promise resolving to LostItem object or null if not found
 * @throws {Error} When Supabase is not configured or database query fails
 */
export async function fetchItemById(id: string): Promise<LostItem | null> {
  ensureSupabase();
  const { data, error } = await supabase
    .from('lost_items')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    console.error('Failed to fetch item:', error);
    throw error;
  }

  return data ? mapDbItem(data as DbLostItem) : null;
}

/**
 * Creates a new lost item in the database
 * Automatically sets createdAt and updatedAt timestamps
 * 
 * @param item - Lost item data (without id, createdAt, updatedAt)
 * @returns Promise resolving to created LostItem with generated ID
 * @throws {Error} When Supabase is not configured or database operation fails
 */
export async function createItem(
  item: Omit<LostItem, 'id' | 'createdAt' | 'updatedAt'>
): Promise<LostItem> {
  ensureSupabase();
  const now = new Date().toISOString();
  const payload = toDbItemPayload({ ...item, createdAt: now, updatedAt: now });
  const { data, error } = await supabase
    .from('lost_items')
    .insert(payload)
    .select('*')
    .single();

  if (error) {
    console.error('Failed to create item:', error);
    throw error;
  }

  return mapDbItem(data as DbLostItem);
}

/**
 * Updates an existing lost item in the database
 * Automatically updates the updatedAt timestamp
 * 
 * @param id - Unique identifier of the item to update
 * @param updates - Partial item data to update (cannot change id, createdAt, updatedAt)
 * @returns Promise resolving to updated LostItem or null if not found
 * @throws {Error} When Supabase is not configured or database operation fails
 */
export async function updateItem(
  id: string,
  updates: Partial<Omit<LostItem, 'id' | 'createdAt' | 'updatedAt'>>
): Promise<LostItem | null> {
  ensureSupabase();
  const payload = toDbItemPayload({ ...updates, updatedAt: new Date().toISOString() });
  const { data, error } = await supabase
    .from('lost_items')
    .update(payload)
    .eq('id', id)
    .select('*')
    .maybeSingle();

  if (error) {
    console.error('Failed to update item:', error);
    throw error;
  }

  return data ? mapDbItem(data as DbLostItem) : null;
}

/**
 * Deletes a lost item from the database permanently
 * 
 * @param id - Unique identifier of the item to delete
 * @returns Promise that resolves when deletion is complete
 * @throws {Error} When Supabase is not configured or database operation fails
 */
export async function deleteItem(id: string): Promise<void> {
  ensureSupabase();
  const { error } = await supabase.from('lost_items').delete().eq('id', id);

  if (error) {
    console.error('Failed to delete item:', error);
    throw error;
  }
}

/**
 * Fetches all claim requests from the database
 * Returns claims sorted by submission date (newest first)
 * 
 * @returns Promise resolving to array of ClaimRequest objects
 * @throws {Error} When Supabase is not configured or database query fails
 */
export async function fetchClaims(): Promise<ClaimRequest[]> {
  ensureSupabase();
  const { data, error } = await supabase
    .from('claim_requests')
    .select('*')
    .order('submitted_at', { ascending: false });

  if (error) {
    console.error('Failed to fetch claims:', error);
    throw error;
  }

  return (data ?? []).map(mapDbClaim);
}

/**
 * Creates a new claim request in the database
 * Automatically sets status to 'pending' and submittedAt timestamp if not provided
 * If proofImage is provided, saves it to the claim_evidence table
 * 
 * @param claim - Claim request data (without id, submittedAt, reviewedAt; status optional)
 * @returns Promise resolving to created ClaimRequest with generated ID
 * @throws {Error} When Supabase is not configured or database operation fails
 */
export async function createClaim(
  claim: Omit<ClaimRequest, 'id' | 'submittedAt' | 'reviewedAt' | 'status'> & {
    status?: ClaimRequest['status'];
  }
): Promise<ClaimRequest> {
  ensureSupabase();
  const { proofImage, ...claimDataWithoutImage } = claim;
  
  const payload = toDbClaimPayload({
    ...claimDataWithoutImage,
    status: claim.status ?? 'pending',
    submittedAt: new Date().toISOString(),
  });

  const { data, error } = await supabase
    .from('claim_requests')
    .insert(payload)
    .select('*')
    .single();

  if (error) {
    console.error('Failed to create claim:', error);
    throw error;
  }

  const claimResult = mapDbClaim(data as DbClaim);

  // Save evidence image if provided
  if (proofImage) {
    try {
      const { error: evidenceError } = await supabase
        .from('claim_evidence')
        .insert({
          claim_request_id: claimResult.id,
          file_url: proofImage,
          mime_type: 'image/jpeg', // Default to jpeg, could be inferred from base64 prefix
          created_at: new Date().toISOString(),
        });

      if (evidenceError) {
        console.error('Failed to save evidence image:', evidenceError);
        // Continue without throwing - claim was created successfully
      }
    } catch (err) {
      console.error('Error saving evidence:', err);
      // Continue without throwing
    }
  }

  return claimResult;
}

/**
 * Updates an existing claim request in the database
 * Cannot modify id, itemId, or submittedAt fields
 * 
 * @param id - Unique identifier of the claim to update
 * @param updates - Partial claim data to update
 * @returns Promise resolving to updated ClaimRequest or null if not found
 * @throws {Error} When Supabase is not configured or database operation fails
 */
export async function updateClaim(
  id: string,
  updates: Partial<Omit<ClaimRequest, 'id' | 'itemId' | 'submittedAt'>>
): Promise<ClaimRequest | null> {
  ensureSupabase();
  const payload = toDbClaimPayload(updates);
  const { data, error } = await supabase
    .from('claim_requests')
    .update(payload)
    .eq('id', id)
    .select('*')
    .maybeSingle();

  if (error) {
    console.error('Failed to update claim:', error);
    throw error;
  }

  return data ? mapDbClaim(data as DbClaim) : null;
}

/**
 * Fetches all claim cases for review workflow
 */
export async function fetchClaimCases(): Promise<ClaimCase[]> {
  ensureSupabase();
  const { data, error } = await supabase
    .from('claim_cases')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Failed to fetch claim cases:', error);
    throw error;
  }

  return (data ?? []).map(row => mapDbClaimCase(row as DbClaimCase));
}

/**
 * Fetches a claim case by its claim request ID
 */
export async function fetchClaimCaseByClaimId(claimRequestId: string): Promise<ClaimCase | null> {
  ensureSupabase();
  const { data, error } = await supabase
    .from('claim_cases')
    .select('*')
    .eq('claim_request_id', claimRequestId)
    .maybeSingle();

  if (error) {
    console.error('Failed to fetch claim case:', error);
    throw error;
  }

  return data ? mapDbClaimCase(data as DbClaimCase) : null;
}

/**
 * Ensures a claim case exists for a claim request
 */
export async function ensureClaimCaseForClaim(claimRequestId: string): Promise<ClaimCase> {
  const existing = await fetchClaimCaseByClaimId(claimRequestId);
  if (existing) return existing;

  const { data, error } = await supabase
    .from('claim_cases')
    .insert({ claim_request_id: claimRequestId })
    .select('*')
    .single();

  if (error) {
    console.error('Failed to create claim case:', error);
    throw error;
  }

  return mapDbClaimCase(data as DbClaimCase);
}

/**
 * Updates an existing claim case
 */
export async function updateClaimCase(
  id: string,
  updates: Partial<Omit<ClaimCase, 'id' | 'claimRequestId' | 'createdAt' | 'updatedAt'>>
): Promise<ClaimCase | null> {
  ensureSupabase();
  const { data, error } = await supabase
    .from('claim_cases')
    .update({
      state: updates.state,
      priority: updates.priority,
      assigned_to: updates.assignedTo,
      sla_due_at: updates.slaDueAt,
      closed_at: updates.closedAt,
    })
    .eq('id', id)
    .select('*')
    .maybeSingle();

  if (error) {
    console.error('Failed to update claim case:', error);
    throw error;
  }

  return data ? mapDbClaimCase(data as DbClaimCase) : null;
}

/**
 * Fetches events for a claim case
 */
export async function fetchClaimCaseEvents(claimCaseId: string): Promise<ClaimCaseEvent[]> {
  ensureSupabase();
  const { data, error } = await supabase
    .from('claim_case_events')
    .select('*')
    .eq('claim_case_id', claimCaseId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Failed to fetch claim case events:', error);
    throw error;
  }

  return (data ?? []).map(row => mapDbClaimCaseEvent(row as DbClaimCaseEvent));
}

/**
 * Adds an event entry to a claim case history
 */
export async function addClaimCaseEvent(params: {
  claimCaseId: string;
  eventType: string;
  fromState?: string;
  toState?: string;
  actorUserId?: string;
  notes?: string;
  metadata?: Record<string, unknown>;
}): Promise<ClaimCaseEvent> {
  ensureSupabase();
  const { data, error } = await supabase
    .from('claim_case_events')
    .insert({
      claim_case_id: params.claimCaseId,
      event_type: params.eventType,
      from_state: params.fromState,
      to_state: params.toState,
      actor_user_id: params.actorUserId,
      notes: params.notes,
      metadata: params.metadata ?? {},
    })
    .select('*')
    .single();

  if (error) {
    console.error('Failed to add claim case event:', error);
    throw error;
  }

  return mapDbClaimCaseEvent(data as DbClaimCaseEvent);
}

/**
 * Searches for lost items by title, description, or location
 * Uses case-insensitive partial matching
 * 
 * @param query - Search term to match against item fields
 * @returns Promise resolving to array of matching LostItem objects (empty if no query)
 * @throws {Error} When Supabase is not configured or database query fails
 */
export async function searchItems(query: string): Promise<LostItem[]> {
  ensureSupabase();
  const trimmed = query.trim();
  if (!trimmed) return [];

  const { data, error } = await supabase
    .from('lost_items')
    .select('*')
    .or(
      `title.ilike.%${trimmed}%,description.ilike.%${trimmed}%,location.ilike.%${trimmed}%`
    )
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Failed to search items:', error);
    throw error;
  }

  return (data ?? []).map(mapDbItem);
}

/**
 * Statistics data structure for dashboard metrics
 */
type StatsResponse = {
  totalItems: number;
  foundItems: number;
  lostItems: number;
  claimedItems: number;
  returnedItems: number;
  pendingClaims: number;
};

/**
 * Fetches aggregated statistics for the Lost & Found system
 * Returns counts of items by status and pending claims
 * 
 * @returns Promise resolving to StatsResponse with dashboard metrics
 * @throws {Error} When Supabase is not configured or database query fails
 */
export async function fetchStats(): Promise<StatsResponse> {
  ensureSupabase();
  const { data, error } = await supabase.from('lost_items').select('id,status');
  const { data: claims, error: claimError } = await supabase
    .from('claim_requests')
    .select('id,status');

  if (error) {
    console.error('Failed to fetch item stats:', error);
    throw error;
  }

  if (claimError) {
    console.error('Failed to fetch claim stats:', claimError);
    throw claimError;
  }

  const items = (data ?? []).map(row => ({ status: (row as any).status as ItemStatus }));
  const claimsList = claims ?? [];

  return {
    totalItems: items.length,
    foundItems: items.filter(i => i.status === 'found').length,
    lostItems: items.filter(i => i.status === 'lost').length,
    claimedItems: items.filter(i => i.status === 'matched').length,
    returnedItems: items.filter(i => i.status === 'returned').length,
    pendingClaims: claimsList.filter(c => (c as any).status === 'pending').length,
  };
}

/**
 * Fetches all claim requests submitted by a specific user
 * Filters claims by claimant email address
 * 
 * @param email - Email address of the claimant
 * @returns Promise resolving to array of ClaimRequest objects for this user
 * @throws {Error} When Supabase is not configured or database query fails
 */
export async function fetchClaimsByEmail(email: string): Promise<ClaimRequest[]> {
  ensureSupabase();
  const { data, error } = await supabase
    .from('claim_requests')
    .select('*')
    .eq('claimant_email', email)
    .order('submitted_at', { ascending: false });

  if (error) {
    console.error('Failed to fetch user claims:', error);
    throw error;
  }

  return (data ?? []).map(mapDbClaim);
}

/**
 * Fetches all claims made on items created by a specific user
 * First retrieves user's items, then fetches claims for those items
 * 
 * @param userId - Unique identifier of the user who created the items
 * @returns Promise resolving to array of ClaimRequest objects for user's items
 * @throws {Error} When Supabase is not configured or database query fails
 */
export async function fetchClaimsByItemCreator(userId: string): Promise<ClaimRequest[]> {
  ensureSupabase();
  
  console.log('fetchClaimsByItemCreator called with userId:', userId);
  
  // First get items created by this user
  const { data: userItems, error: itemsError } = await supabase
    .from('lost_items')
    .select('id, created_by')
    .eq('created_by', userId);

  console.log('User items query result:', { userItems, error: itemsError });

  if (itemsError) {
    console.error('Failed to fetch user items:', itemsError);
    throw itemsError;
  }

  if (!userItems || userItems.length === 0) {
    console.log('No items found for user:', userId);
    return [];
  }

  const itemIds = userItems.map(item => item.id);
  console.log('Item IDs to fetch claims for:', itemIds);

  // Then get claims for those items
  const { data, error } = await supabase
    .from('claim_requests')
    .select('*')
    .in('item_id', itemIds)
    .order('submitted_at', { ascending: false });

  console.log('Claims query result:', { claims: data, error });

  if (error) {
    console.error('Failed to fetch claims for user items:', error);
    throw error;
  }

  return (data ?? []).map(mapDbClaim);
}

/**
 * Checks whether a user is an admin using database function `is_admin_user`.
 * Returns false if function/table is not available.
 */
export async function isUserAdmin(userId: string): Promise<boolean> {
  ensureSupabase();

  const { data, error } = await supabase.rpc('is_admin_user', {
    target_user_id: userId,
  });

  if (error) {
    console.warn('Admin check failed. Defaulting to non-admin:', error.message);
    return false;
  }

  return Boolean(data);
}

/**
 * Fetches evidence (images/files) for a specific claim request
 * @param claimId - The claim request ID
 * @returns Promise resolving to array of evidence records
 */
export async function fetchEvidenceByClaim(claimId: string): Promise<any[]> {
  ensureSupabase();

  const { data, error } = await supabase
    .from('claim_evidence')
    .select('*')
    .eq('claim_request_id', claimId)
    .order('created_at', { ascending: true });

  if (error) {
    console.warn('Failed to fetch evidence:', error.message);
    return [];
  }

  return data ?? [];
}

/**
 * Queues an admin message to a claimant via notification_deliveries.
 * Requires enterprise notification tables in database schema.
 */
export async function sendAdminMessageToClaimant(params: {
  claimId: string;
  claimantEmail: string;
  message: string;
  itemId?: string;
  adminUserId?: string;
}): Promise<void> {
  ensureSupabase();

  const { claimId, claimantEmail, message, itemId, adminUserId } = params;

  const { error } = await supabase.from('notification_deliveries').insert({
    recipient_user_id: null,
    recipient_email: claimantEmail,
    channel: 'email',
    template_key: 'admin-claim-message',
    status: 'queued',
    metadata: {
      claim_id: claimId,
      item_id: itemId ?? null,
      admin_user_id: adminUserId ?? null,
      custom_message: message,
    },
  });

  if (error) {
    console.error('Failed to queue admin message:', error);
    throw new Error(
      error.message?.includes('notification_deliveries')
        ? 'Messaging is not ready. Run latest supabase-schema.sql first.'
        : error.message || 'Failed to send admin message'
    );
  }
}
