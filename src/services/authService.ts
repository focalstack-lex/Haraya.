import type { Account, AccountRole, RoasterApplication } from '../types/auth';
import type { DavaoCity, District } from '../types/coffee';
import { DAVAO_CITIES, DAVAO_DISTRICTS } from '../types/coffee';
import { catalogService } from './catalogService';

/**
 * Browser account layer for the Roaster Suite. Accounts, applications, and the
 * active session live in localStorage until sign-in moves to Supabase Auth.
 * Passwords are never stored in plain text: each is a salted PBKDF2-SHA256 hash.
 * Identity documents are not collected here; they wait for a secure server-side
 * intake. This is still not server-side auth (Security-First Deployment Gate,
 * checks 3 and 4), so it must not guard anything beyond this browser.
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
}

/** Salted password hash. Legacy records from before hashing are plain strings and are upgraded on load. */
interface StoredCredential {
  salt: string;
  hash: string;
  iterations: number;
}
type CredentialStore = Record<string, StoredCredential | string>;

const PBKDF2_ITERATIONS = 210_000;
/** Id of the demo admin that older builds seeded into every browser. */
const SEEDED_ADMIN_ID = 'acct-admin';

const toBase64 = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes));
const fromBase64 = (text: string) => Uint8Array.from(atob(text), (char) => char.charCodeAt(0));

async function derive(password: string, salt: Uint8Array<ArrayBuffer>, iterations: number): Promise<string> {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations }, key, 256);
  return toBase64(new Uint8Array(bits));
}

async function hashPassword(password: string): Promise<StoredCredential> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  return { salt: toBase64(salt), hash: await derive(password, salt, PBKDF2_ITERATIONS), iterations: PBKDF2_ITERATIONS };
}

async function verifyPassword(password: string, stored: StoredCredential | string): Promise<boolean> {
  if (typeof stored === 'string') return stored === password;
  const candidate = await derive(password, fromBase64(stored.salt), stored.iterations);
  // Constant-time compare so the check does not leak how many characters matched
  if (candidate.length !== stored.hash.length) return false;
  let diff = 0;
  for (let i = 0; i < candidate.length; i++) diff |= candidate.charCodeAt(i) ^ stored.hash.charCodeAt(i);
  return diff === 0;
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

/**
 * Local development only: seeds a demo admin so the Control Room can be exercised. Production builds
 * compile this to an early return, so no admin credential ships in the public bundle. Real admin access
 * comes from Supabase Auth roles.
 */
function ensureSeedAdmin(): void {
  if (!import.meta.env.DEV) return;
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
  const credentials = readJson<CredentialStore>(KEYS.CREDENTIALS, {});
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

  async signIn(email: string, password: string): Promise<Account> {
    ensureSeedAdmin();
    const normalized = email.trim().toLowerCase();
    if (!normalized || !password) throw new Error('Email and password are required.');
    const accounts = readJson<Account[]>(KEYS.ACCOUNTS, []);
    const account = accounts.find((candidate) => candidate.email === normalized);
    if (!account) throw new Error('No account found for that email. Sign up as a roaster first.');
    const credentials = readJson<CredentialStore>(KEYS.CREDENTIALS, {});
    const stored = credentials[normalized];
    if (!stored || !(await verifyPassword(password, stored))) throw new Error('Incorrect password.');
    if (typeof stored === 'string') {
      credentials[normalized] = await hashPassword(password);
      writeJson(KEYS.CREDENTIALS, credentials);
    }
    writeJson(KEYS.CURRENT, account);
    notify();
    return account;
  },

  signOut(): void {
    writeJson(KEYS.CURRENT, null);
    notify();
  },

  /** Multi-step roaster registration: creates a pending account plus application. */
  async signUpRoaster(input: SignUpInput): Promise<Account> {
    ensureSeedAdmin();
    const email = input.email.trim().toLowerCase();
    if (!email.includes('@')) throw new Error('Enter a valid email address.');
    if (input.password.length < 8) throw new Error('Password must be at least 8 characters.');
    if (!input.contactName.trim()) throw new Error('Contact name is required.');
    if (!input.application.businessName.trim()) throw new Error('Business name is required.');
    if (!input.application.permitNumber.trim()) {
      throw new Error('A DTI or Mayor permit number is required for verification.');
    }
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

    const credentials = readJson<CredentialStore>(KEYS.CREDENTIALS, {});
    credentials[email] = await hashPassword(input.password);
    writeJson(KEYS.CREDENTIALS, credentials);

    const applications = readJson<StoredApplication[]>(KEYS.APPLICATIONS, []);
    applications.push({
      ...input.application,
      permitDoc: null,
      idDoc: null,
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

  /**
   * Runs once per load. Removes what earlier builds left in this browser: identity and permit photos
   * inside applications, the seeded demo admin (outside development), and any plain-text password,
   * which is re-stored as a salted hash.
   */
  async purgeSensitiveStorage(): Promise<void> {
    let changed = false;

    const applications = readJson<StoredApplication[]>(KEYS.APPLICATIONS, []);
    if (applications.some((application) => application.idDoc || application.permitDoc)) {
      writeJson(
        KEYS.APPLICATIONS,
        applications.map((application) => ({ ...application, idDoc: null, permitDoc: null }))
      );
      changed = true;
    }

    const credentials = readJson<CredentialStore>(KEYS.CREDENTIALS, {});
    if (!import.meta.env.DEV) {
      const accounts = readJson<Account[]>(KEYS.ACCOUNTS, []);
      const seeded = accounts.find((account) => account.id === SEEDED_ADMIN_ID);
      if (seeded) {
        writeJson(KEYS.ACCOUNTS, accounts.filter((account) => account.id !== SEEDED_ADMIN_ID));
        delete credentials[seeded.email];
        if (readJson<Account | null>(KEYS.CURRENT, null)?.id === SEEDED_ADMIN_ID) writeJson(KEYS.CURRENT, null);
        changed = true;
      }
    }

    let rehashed = false;
    for (const [email, stored] of Object.entries(credentials)) {
      if (typeof stored === 'string') {
        credentials[email] = await hashPassword(stored);
        rehashed = true;
      }
    }
    if (changed || rehashed) writeJson(KEYS.CREDENTIALS, credentials);
    if (changed) notify();
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
