// ═══════════════════════════════════════════════════════════════════════════
// FBLA LOST & FOUND — Type Definitions
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Possible statuses for lost/found items throughout their lifecycle
 * - found: Initial report of found item
 * - lost: Initial report of lost item
 * - under_review: Office reviewing possible matches
 * - matched: Office found a match, waiting for pickup/claim
 * - returned: Item successfully returned to owner
 * - archived: Item expired or archived after extended period
 */
export type ItemStatus = 'found' | 'lost' | 'under_review' | 'matched' | 'returned' | 'archived';

/**
 * Categories for classifying lost and found items
 * Used for filtering and organization
 */
export type ItemCategory = 
  | 'electronics'
  | 'clothing'
  | 'accessories'
  | 'books'
  | 'sports'
  | 'keys'
  | 'wallet'
  | 'jewelry'
  | 'bag'
  | 'other';

/**
 * Contact preference for notification delivery
 */
export type ContactMethod = 'email' | 'phone' | 'email_preferred' | 'phone_preferred';

/**
 * Core data structure representing a lost or found item
 * Used throughout the application for item management
 */
export interface LostItem {
  id: string;
  title: string;
  description: string;
  category: ItemCategory;
  location: string;
  dateFound: string;
  status: ItemStatus;
  imageUrl?: string;
  contactEmail?: string;
  contactPhone?: string;
  studentId?: string; // School student ID of reporter
  studentName?: string; // Full name of reporter
  grade?: string; // Grade level (9, 10, 11, 12, etc.)
  preferredContactMethod?: ContactMethod;
  claimedBy?: string;
  claimedAt?: string;
  createdBy?: string; // User ID of who created/reported this item
  tenantId?: string; // Storage namespace identifier for local isolation
  adminNotes?: string; // Internal notes for office staff
  createdAt: string;
  updatedAt: string;
}

/**
 * Claim request submitted by users attempting to retrieve lost items
 * Tracks the claim lifecycle from submission through pickup/closure
 */
export interface ClaimRequest {
  id: string;
  itemId: string;
  claimantName: string;
  claimantEmail: string;
  claimantPhone?: string;
  claimantStudentId?: string; // School student ID of claimant
  proofDescription: string;
  proofImage?: string;
  preferredContactMethod?: ContactMethod;
  status: 'pending' | 'needs_info' | 'approved' | 'rejected' | 'pickup_scheduled' | 'closed';
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string; // Admin user ID who reviewed
  internalNotes?: string; // Admin notes (not visible to student)
}

/**
 * Case record for claim review workflow
 */
export interface ClaimCase {
  id: string;
  claimRequestId: string;
  state: 'new' | 'triage' | 'verification' | 'approved' | 'rejected' | 'pickup_scheduled' | 'closed';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  assignedTo?: string;
  slaDueAt?: string;
  closedAt?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Event history for claim case actions and notes
 */
export interface ClaimCaseEvent {
  id: string;
  claimCaseId: string;
  eventType: string;
  fromState?: string;
  toState?: string;
  actorUserId?: string;
  notes?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

/**
 * Dashboard statistics aggregated from items and claims
 * Used to display summary metrics on the admin dashboard
 */
export interface DashboardStats {
  totalItems: number;
  pendingClaims: number;
  returnedItems: number;
  activeItems: number;
}

/**
 * Filter state for item search and filtering functionality
 * Maintains user's current filter selections across the application
 */
export interface FilterState {
  category: ItemCategory | 'all';
  status: ItemStatus | 'all';
  search: string;
  dateRange: 'all' | 'today' | 'week' | 'month';
}
