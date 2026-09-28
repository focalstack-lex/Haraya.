import type { Account, AccountRole, RoasterApplication } from '../types/auth';
import type { DavaoCity, District } from '../types/coffee';
import { DAVAO_CITIES, DAVAO_DISTRICTS } from '../types/coffee';
import { catalogService } from './catalogService';

/**
 * Browser-mock account layer for the Roaster Suite. Accounts, applications, and
 * the active session live in localStorage. Password checks are plain compares by
 * design: this is a front-end demo boundary, and a real deployment must replace
 * it with server-side auth (Security-First Deployment Gate, checks 3 and 4).
 */

/** Neutral placeholder until the roaster uploads real photos. */
const PLACEHOLDER_PHOTO = '/placeholders/no-photo.svg';

const KEYS = {
  ACCOUNTS: 'haraya_accounts',
  APPLICATIONS: 'haraya_applications',
  CREDENTIALS: 'haraya_credentials',
  CURRENT: 'haraya_current_account',
} as const;

export interface StoredApplication extends RoasterApplication {
  accountId: string;
  email: string;
  contactName: string;
  submittedAt: string;
}

export interface SignUpInput {
  email: string;
  password: string;
  contactName: string;
  application: RoasterApplication;
  permitDoc: string | null;
  idDoc: string | null;
}

const listeners = new Set<() => void>();
let version = 0;

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown): void {
  localStorage.setItem(key, JSON.stringify(value));
}

function notify(): void {
  version += 1;
  listeners.forEach((listener) => listener());
}

function makeAccountId(): string {
  return `acct-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

/** Seed demo admin so the Control Room is reachable on first run. */
function ensureSeedAdmin(): void {
  const accounts = readJson<Account[]>(KEYS.ACCOUNTS, []);
  if (accounts.some((account) => account.role === 'admin')) return;
  const admin: Account = {
    id: 'acct-admin',
    role: 'admin',
    email: 'admin@haraya.ph',
    name: 'Haraya Control Room',
    businessName: 'Haraya Admin',
    status: 'approved',
    cafeProfileId: null,
    appliedAt: '2026-08-01T00:00:00.000Z',
    reviewNote: null,
  };
  writeJson(KEYS.ACCOUNTS, [...accounts, admin]);
  const credentials = readJson<Record<string, string>>(KEYS.CREDENTIALS, {});
  credentials[admin.email] = 'haraya-admin';
  writeJson(KEYS.CREDENTIALS, credentials);
}

export const authService = {
  subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  getVersion(): number {
    return version;
  },

  getCurrentAccount(): Account | null {
    ensureSeedAdmin();
    return readJson<Account | null>(KEYS.CURRENT, null);
  },

  signIn(email: string, password: string): Account {
    ensureSeedAdmin();
    const normalized = email.trim().toLowerCase();
    if (!normalized || !password) throw new Error('Email and password are required.');
    const accounts = readJson<Account[]>(KEYS.ACCOUNTS, []);
    const account = accounts.find((candidate) => candidate.email === normalized);
    if (!account) throw new Error('No account found for that email. Sign up as a roaster first.');
    const credentials = readJson<Record<string, string>>(KEYS.CREDENTIALS, {});
    if (credentials[normalized] !== password) throw new Error('Incorrect password.');
    writeJson(KEYS.CURRENT, account);
    notify();
    return account;
  },

  signOut(): void {
    writeJson(KEYS.CURRENT, null);
    notify();
  },

  /** Multi-step roaster registration: creates a pending account plus application. */
  signUpRoaster(input: SignUpInput): Account {
    ensureSeedAdmin();
    const email = input.email.trim().toLowerCase();
    if (!email.includes('@')) throw new Error('Enter a valid email address.');
    if (input.password.length < 8) throw new Error('Password must be at least 8 characters.');
    if (!input.contactName.trim()) throw new Error('Contact name is required.');
    if (!input.application.businessName.trim()) throw new Error('Business name is required.');
    if (!input.application.permitNumber.trim()) {
      throw new Error('A DTI or Mayor permit number is required for verification.');
    }
    if (!input.idDoc) throw new Error('One government ID photo is required for verification.');
    if (input.application.handle && !/^[a-z0-9-]+$/.test(input.application.handle)) {
      throw new Error('Handles use lowercase letters, numbers, and hyphens only.');
    }

    const accounts = readJson<Account[]>(KEYS.ACCOUNTS, []);
    if (accounts.some((account) => account.email === email)) {
      throw new Error('That email already has an account. Sign in instead.');
    }

    const account: Account = {
      id: makeAccountId(),
      role: 'roaster',
      email,
      name: input.contactName.trim(),
      businessName: input.application.businessName.trim(),
      status: 'pending',
      cafeProfileId: null,
      appliedAt: new Date().toISOString(),
      reviewNote: null,
    };
    accounts.push(account);
    writeJson(KEYS.ACCOUNTS, accounts);

    const credentials = readJson<Record<string, string>>(KEYS.CREDENTIALS, {});
    credentials[email] = input.password;
    writeJson(KEYS.CREDENTIALS, credentials);

    const applications = readJson<StoredApplication[]>(KEYS.APPLICATIONS, []);
    applications.push({
      ...input.application,
      permitDoc: input.permitDoc,
      idDoc: input.idDoc,
      accountId: account.id,
      email,
      contactName: account.name,
      submittedAt: account.appliedAt,
    });
    writeJson(KEYS.APPLICATIONS, applications);

    writeJson(KEYS.CURRENT, account);
    notify();
    return account;
  },

  // Admin review queue ---------------------------------------------------------

  getApplications(): StoredApplication[] {
    return readJson<StoredApplication[]>(KEYS.APPLICATIONS, []).sort(
      (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
    );
  },

  getApplicationForAccount(accountId: string): StoredApplication | undefined {
    return this.getApplications().find((application) => application.accountId === accountId);
  },

  approveAccount(accountId: string): void {
    const accounts = readJson<Account[]>(KEYS.ACCOUNTS, []);
    const index = accounts.findIndex((account) => account.id === accountId);
    if (index === -1) throw new Error('Account not found.');
    const application = this.getApplicationForAccount(accountId);
    const account = accounts[index];

    const rawCity = (application?.city ?? 'Davao City') as DavaoCity;
    const city: DavaoCity = DAVAO_CITIES.includes(rawCity) ? rawCity : 'Davao City';
    const rawDistrict = (application?.district ?? 'Poblacion') as District;
    const district: District = DAVAO_DISTRICTS.includes(rawDistrict) ? rawDistrict : 'Poblacion';

    const cafe = catalogService.createCustomCafe({
      handle: application?.handle || account.businessName.toLowerCase().replace(/[^a-z0-9]+/g, ''),
      name: application?.businessName || account.businessName,
      isRoastery: application?.isRoastery ?? true,
      city,
      district,
      address: `${district}, ${city}`,
      lat: 7.07 + (Math.random() - 0.5) * 0.08,
      lng: 125.61 + (Math.random() - 0.5) * 0.08,
      // Nothing is invented for a real business: no stock photos, menu, amenities or Wi-Fi until the roaster
      // adds them. Empty fields hide their sections in the app.
      images: [PLACEHOLDER_PHOTO],
      logoUrl: PLACEHOLDER_PHOTO,
      description: application?.description || 'Newly verified Haraya roastery. Menu and beans coming soon.',
      signature: '',
      menu: [],
      amenities: [],
      wifiMbps: 0,
      brewMethods: [],
      priceLevel: 2,
      hours: {
        Monday: { open: '08:00', close: '20:00' },
        Tuesday: { open: '08:00', close: '20:00' },
        Wednesday: { open: '08:00', close: '20:00' },
        Thursday: { open: '08:00', close: '20:00' },
        Friday: { open: '08:00', close: '22:00' },
        Saturday: { open: '08:00', close: '22:00' },
        Sunday: { open: '08:00', close: '20:00' },
      },
      vibeTags: ['New Roaster'],
      verified: true,
    });

    accounts[index] = { ...account, status: 'approved', cafeProfileId: cafe.id };
    writeJson(KEYS.ACCOUNTS, accounts);

    const current = this.getCurrentAccount();
    if (current?.id === accountId) writeJson(KEYS.CURRENT, accounts[index]);
    notify();
  },

  rejectAccount(accountId: string, note: string): void {
    const accounts = readJson<Account[]>(KEYS.ACCOUNTS, []);
    const index = accounts.findIndex((account) => account.id === accountId);
    if (index === -1) throw new Error('Account not found.');
    accounts[index] = { ...accounts[index], status: 'rejected', reviewNote: note };
    writeJson(KEYS.ACCOUNTS, accounts);
    const current = this.getCurrentAccount();
    if (current?.id === accountId) writeJson(KEYS.CURRENT, accounts[index]);
    notify();
  },

  getAllAccounts(): Account[] {
    ensureSeedAdmin();
    return readJson<Account[]>(KEYS.ACCOUNTS, []);
  },

  roleLabel(role: AccountRole): string {
    return role === 'admin' ? 'Control Room' : 'Roaster Suite';
  },
};
