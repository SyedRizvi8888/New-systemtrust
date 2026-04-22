// Local Storage Implementation - No backend needed!
import { LostItem, ClaimRequest } from '@/types';

const STORAGE_NAMESPACE = 'lost_found';

const STORAGE_KEYS = {
  USER: `${STORAGE_NAMESPACE}_user`,
  USERS: `${STORAGE_NAMESPACE}_users`,
};

const TENANT_KEYS = {
  ITEMS: 'items',
  CLAIMS: 'claims',
} as const;

const DEFAULT_TENANT = 'public';

const sanitizeKey = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, '-');

const resolveTenantId = (value?: string | null) => {
  if (!value) return DEFAULT_TENANT;
  return value.includes('@') ? sanitizeKey(value) : value;
};

const getUserRecords = (): LocalUser[] => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]') as LocalUser[];
  } catch (error) {
    console.error('Failed to read users from storage:', error);
    return [];
  }
};

const getTenantIds = (): string[] => {
  const currentTenant = resolveTenantId(localAuth.getCurrentUser()?.email);
  const userTenants = getUserRecords().map(user => resolveTenantId(user.email));
  const ids = new Set<string>([DEFAULT_TENANT, currentTenant, ...userTenants]);
  return Array.from(ids);
};  

const getItemStorageKey = (tenantId: string) => `${STORAGE_NAMESPACE}:${tenantId}:${TENANT_KEYS.ITEMS}`;

const readItemsForTenant = (tenantId: string): LostItem[] => {
  try {
    const raw = localStorage.getItem(getItemStorageKey(tenantId));
    return raw ? JSON.parse(raw) : [];
  } catch (error) {
    console.error(`Failed to read items for tenant ${tenantId}:`, error);
    return [];
  }
};

const writeItemsForTenant = (tenantId: string, items: LostItem[]): void => {
  try {
    localStorage.setItem(getItemStorageKey(tenantId), JSON.stringify(items));
  } catch (error) {
    console.error(`Failed to write items for tenant ${tenantId}:`, error);
    throw error;
  }
};

const ensureSharedItemsUpToDate = () => {
  const tenantIds = getTenantIds();
  const sharedItems = readItemsForTenant(DEFAULT_TENANT);
  const sharedIds = new Set(sharedItems.map(item => item.id));
  let dirty = false;

  tenantIds.forEach(tenantId => {
    if (tenantId === DEFAULT_TENANT) return;
    const tenantItems = readItemsForTenant(tenantId);
    tenantItems.forEach(item => {
      const normalized = { ...item, tenantId: item.tenantId ?? tenantId };
      if (!sharedIds.has(normalized.id)) {
        sharedIds.add(normalized.id);
        sharedItems.unshift(normalized);
        dirty = true;
      }
    });
  });

  if (dirty) {
    writeItemsForTenant(DEFAULT_TENANT, sharedItems);
  }
};

// User Management
export interface LocalUser {
  id: string;
  email: string;
  password: string; // In production, this would be hashed!
  username: string;
  full_name: string;
  role: 'admin' | 'user';
  created_at: string;
}

export const localAuth = {
  signUp: (email: string, password: string, username: string): { user: LocalUser; error: null } | { user: null; error: string } => {
    const users = getUserRecords();
    
    // Check if user already exists
    if (users.find(u => u.email === email)) {
      return { user: null, error: 'User with this email already exists' };
    }
    
    const newUser: LocalUser = {
      id: `user_${Date.now()}`,
      email,
      password, // In production, hash this!
      username,
      full_name: username,
      role: 'admin', // First user is admin, others can be regular users
      created_at: new Date().toISOString(),
    };
    
    users.push(newUser);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(newUser));
    
    return { user: newUser, error: null };
  },
  
  signIn: (email: string, password: string): { user: LocalUser; error: null } | { user: null; error: string } => {
    const users = getUserRecords();
    const user = users.find(u => u.email === email && u.password === password);
    
    if (!user) {
      return { user: null, error: 'Invalid email or password' };
    }
    
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    return { user, error: null };
  },
  
  signOut: () => {
    localStorage.removeItem(STORAGE_KEYS.USER);
  },
  
  getCurrentUser: (): LocalUser | null => {
    const userStr = localStorage.getItem(STORAGE_KEYS.USER);
    return userStr ? JSON.parse(userStr) : null;
  },
};

const getActiveTenantId = (): string => resolveTenantId(localAuth.getCurrentUser()?.email);

const getTenantKey = (base: string, tenant?: string | null): string => {
  const tenantId = tenant !== undefined ? resolveTenantId(tenant) : getActiveTenantId();
  return `${STORAGE_NAMESPACE}:${tenantId}:${base}`;
};

// Items Management
export const localItems = {
  getAll: (): LostItem[] => {
    ensureSharedItemsUpToDate();
    const items = readItemsForTenant(DEFAULT_TENANT).map(item => ({
      ...item,
      tenantId: item.tenantId ?? DEFAULT_TENANT,
    }));
    const seen = new Set<string>();
    return items.filter(item => {
      if (seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    });
  },
  
  getById: (id: string): LostItem | null => {
    const tenantIds = getTenantIds();
    for (const tenantId of tenantIds) {
      const items = readItemsForTenant(tenantId);
      const found = items.find(item => item.id === id);
      if (found) {
        return { ...found, tenantId: found.tenantId ?? tenantId };
      }
    }
    return null;
  },
  
  create: (item: Omit<LostItem, 'id' | 'createdAt' | 'updatedAt'>): LostItem => {
    const tenantId = getActiveTenantId();
    const items = readItemsForTenant(tenantId);
    const now = new Date().toISOString();
    const newItem: LostItem = {
      ...item,
      id: `item_${Date.now()}`,
      createdAt: now,
      updatedAt: now,
      createdBy: item.createdBy ?? localAuth.getCurrentUser()?.id,
      tenantId,
    };

    items.unshift(newItem);
    writeItemsForTenant(tenantId, items);

    if (tenantId !== DEFAULT_TENANT) {
      const sharedItems = readItemsForTenant(DEFAULT_TENANT);
      if (!sharedItems.some(existing => existing.id === newItem.id)) {
        sharedItems.unshift(newItem);
        writeItemsForTenant(DEFAULT_TENANT, sharedItems);
      }
    }

    return newItem;
  },
  
  update: (id: string, updates: Partial<LostItem>): LostItem | null => {
    const tenantIds = getTenantIds();
    for (const tenantId of tenantIds) {
      const items = readItemsForTenant(tenantId);
      const index = items.findIndex(item => item.id === id);
      if (index === -1) continue;

      const updatedItem: LostItem = {
        ...items[index],
        ...updates,
        updatedAt: new Date().toISOString(),
        tenantId: items[index].tenantId ?? tenantId,
      };

      items[index] = updatedItem;
      writeItemsForTenant(tenantId, items);
      return updatedItem;
    }

    return null;
  },
  
  delete: (id: string): boolean => {
    const tenantIds = getTenantIds();
    for (const tenantId of tenantIds) {
      const items = readItemsForTenant(tenantId);
      const filtered = items.filter(item => item.id !== id);
      if (filtered.length !== items.length) {
        writeItemsForTenant(tenantId, filtered);
        return true;
      }
    }

    return false;
  },
  
};

// Claims management mirrors item storage to keep tenant data isolated
export const localClaims = {
  getAll: (): ClaimRequest[] => {
    try {
      const raw = localStorage.getItem(getTenantKey(TENANT_KEYS.CLAIMS));
      if (!raw) return [];
      const parsed = JSON.parse(raw) as ClaimRequest[];
      return parsed.map(claim => ({
        ...claim,
        submittedAt: claim.submittedAt ?? (claim as any).submitted_at ?? new Date().toISOString(),
        reviewedAt: claim.reviewedAt ?? (claim as any).reviewed_at ?? undefined,
      }));
    } catch (error) {
      console.error('Failed to read claims from storage:', error);
      return [];
    }
  },

  create: (claim: Omit<ClaimRequest, 'id' | 'submittedAt' | 'reviewedAt'>): ClaimRequest => {
    const claims = localClaims.getAll();
    const newClaim: ClaimRequest = {
      ...claim,
      id: `claim_${Date.now()}`,
      submittedAt: new Date().toISOString(),
      reviewedAt: undefined,
    };

    claims.unshift(newClaim);
    localStorage.setItem(getTenantKey(TENANT_KEYS.CLAIMS), JSON.stringify(claims));
    return newClaim;
  },

  update: (id: string, updates: Partial<ClaimRequest>): ClaimRequest | null => {
    const claims = localClaims.getAll();
    const index = claims.findIndex(claim => claim.id === id);
    if (index === -1) return null;

    claims[index] = { ...claims[index], ...updates };
    localStorage.setItem(getTenantKey(TENANT_KEYS.CLAIMS), JSON.stringify(claims));
    return claims[index];
  },
};

// Sample auto-seeding removed to avoid drifting from Supabase data
