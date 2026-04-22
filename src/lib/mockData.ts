// ═══════════════════════════════════════════════════════════════════════════
// FBLA LOST & FOUND — Mock Data for Frontend Demo
// ═══════════════════════════════════════════════════════════════════════════

import { LostItem, ClaimRequest, DashboardStats, ItemCategory } from '@/types';

export const categoryLabels: Record<ItemCategory, string> = {
  electronics: 'Electronics',
  clothing: 'Clothing',
  accessories: 'Accessories',
  books: 'Books & Notes',
  sports: 'Sports Equipment',
  keys: 'Keys',
  wallet: 'Wallet / ID',
  jewelry: 'Jewelry',
  bag: 'Bags & Backpacks',
  other: 'Other',
};

export const categoryIcons: Record<ItemCategory, string> = {
  electronics: '📱',
  clothing: '👕',
  accessories: '🕶️',
  books: '📚',
  sports: '⚽',
  keys: '🔑',
  wallet: '👛',
  jewelry: '💍',
  bag: '🎒',
  other: '📦',
};

export const statusColors: Record<string, string> = {
  found: 'status-badge-info',
  lost: 'status-badge-accent',
  under_review: 'status-badge-warning',
  matched: 'status-badge-info',
  returned: 'status-badge-success',
  archived: 'status-badge-muted',
  pending: 'status-badge-warning',
  needs_info: 'status-badge-info',
  approved: 'status-badge-success',
  rejected: 'status-badge-error',
  pickup_scheduled: 'status-badge-info',
  closed: 'status-badge-muted',
};

export const mockItems: LostItem[] = [
  {
    id: '1',
    title: 'MacBook Pro Charger',
    description: 'White 96W USB-C power adapter with braided cable. Found near the library study rooms.',
    category: 'electronics',
    location: 'Library - 2nd Floor',
    dateFound: '2024-01-20',
    status: 'found',
    imageUrl: 'https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=400&h=300&fit=crop',
    createdAt: '2024-01-20T10:30:00Z',
    updatedAt: '2024-01-20T10:30:00Z',
  },
  {
    id: '2',
    title: 'Blue North Face Jacket',
    description: 'Medium-sized blue puffer jacket with hood. Has initials "JM" written inside collar.',
    category: 'clothing',
    location: 'Gymnasium',
    dateFound: '2024-01-19',
    status: 'matched',
    imageUrl: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400&h=300&fit=crop',
    claimedBy: 'John M.',
    claimedAt: '2024-01-21T14:00:00Z',
    createdAt: '2024-01-19T08:15:00Z',
    updatedAt: '2024-01-21T14:00:00Z',
  },
  {
    id: '3',
    title: 'AirPods Pro Case',
    description: 'White AirPods Pro charging case. No AirPods inside. Has a small scratch on the lid.',
    category: 'electronics',
    location: 'Cafeteria',
    dateFound: '2024-01-18',
    status: 'found',
    imageUrl: 'https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=400&h=300&fit=crop',
    createdAt: '2024-01-18T12:45:00Z',
    updatedAt: '2024-01-18T12:45:00Z',
  },
  {
    id: '4',
    title: 'Student ID Card - Sarah Chen',
    description: 'Student ID card for Sarah Chen, Grade 11. Found near the main entrance.',
    category: 'wallet',
    location: 'Main Entrance',
    dateFound: '2024-01-17',
    status: 'returned',
    createdAt: '2024-01-17T09:00:00Z',
    updatedAt: '2024-01-18T11:30:00Z',
  },
  {
    id: '5',
    title: 'Scientific Calculator TI-84',
    description: 'Texas Instruments TI-84 Plus graphing calculator. Has stickers on the back.',
    category: 'electronics',
    location: 'Math Building - Room 201',
    dateFound: '2024-01-16',
    status: 'found',
    imageUrl: 'https://images.unsplash.com/photo-1564466809058-bf4114d55352?w=400&h=300&fit=crop',
    createdAt: '2024-01-16T15:20:00Z',
    updatedAt: '2024-01-16T15:20:00Z',
  },
  {
    id: '6',
    title: 'Black Hydroflask Water Bottle',
    description: '32oz black Hydroflask with dents on the bottom. Has a mountain sticker.',
    category: 'accessories',
    location: 'Science Lab',
    dateFound: '2024-01-15',
    status: 'found',
    imageUrl: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=400&h=300&fit=crop',
    createdAt: '2024-01-15T11:10:00Z',
    updatedAt: '2024-01-15T11:10:00Z',
  },
  {
    id: '7',
    title: 'Car Keys with Honda Fob',
    description: 'Honda key fob with house key attached. Keychain has a small teddy bear.',
    category: 'keys',
    location: 'Parking Lot B',
    dateFound: '2024-01-14',
    status: 'under_review',
    createdAt: '2024-01-14T16:00:00Z',
    updatedAt: '2024-01-15T09:30:00Z',
  },
  {
    id: '8',
    title: 'Silver Hoop Earring',
    description: 'Single medium-sized silver hoop earring. Found near the theater.',
    category: 'jewelry',
    location: 'Auditorium',
    dateFound: '2024-01-13',
    status: 'archived',
    createdAt: '2024-01-13T19:45:00Z',
    updatedAt: '2024-01-20T00:00:00Z',
  },
];

export const mockClaimRequests: ClaimRequest[] = [
  {
    id: 'c1',
    itemId: '1',
    claimantName: 'Alex Thompson',
    claimantEmail: 'alex.t@school.edu',
    proofDescription: 'I was studying in the library on January 20th and left my charger at table 4. The cable has a small tear near the USB-C end.',
    status: 'pending',
    submittedAt: '2024-01-21T10:00:00Z',
  },
  {
    id: 'c2',
    itemId: '3',
    claimantName: 'Maria Garcia',
    claimantEmail: 'maria.g@school.edu',
    claimantPhone: '555-0123',
    proofDescription: 'My AirPods case has my initials "MG" engraved on the inside of the lid. I can show the matching AirPods.',
    status: 'pending',
    submittedAt: '2024-01-20T15:30:00Z',
  },
  {
    id: 'c3',
    itemId: '5',
    claimantName: 'David Lee',
    claimantEmail: 'david.l@school.edu',
    proofDescription: 'The calculator has a Pokemon sticker on the back and my name written in permanent marker inside the battery cover.',
    status: 'pending',
    submittedAt: '2024-01-19T11:00:00Z',
  },
];

export const mockDashboardStats: DashboardStats = {
  totalItems: 156,
  pendingClaims: 12,
  returnedItems: 89,
  activeItems: 43,
};

// Helper function to generate unique IDs
export const generateId = (): string => {
  return Math.random().toString(36).substring(2, 9);
};

// Local storage helpers removed – Supabase is the source of truth now.
export const STORAGE_KEYS = {
  ITEMS: 'fbla_lf_items',
  CLAIMS: 'fbla_lf_claims',
} as const;

export const initializeStorage = (): void => undefined;
export const getStoredItems = (): LostItem[] => mockItems;
export const getStoredClaims = (): ClaimRequest[] => mockClaimRequests;
export const saveItem = (_item: LostItem): void => undefined;
export const saveClaim = (_claim: ClaimRequest): void => undefined;
