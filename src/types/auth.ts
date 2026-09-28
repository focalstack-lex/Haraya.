/**
 * Accounts. Real sign-in is Supabase Auth; the row in public.profiles carries the role. The legacy
 * Account and RoasterApplication shapes remain for the hidden Roaster Suite (beans and drops).
 */

/** profiles.role: guest is every signed-in visitor, roaster is an approved place owner. */
export type ProfileRole = 'guest' | 'roaster' | 'admin';

export type ReviewStatus = 'pending' | 'approved' | 'rejected';

/** One row of public.profiles, as the client reads it. */
export interface Profile {
  id: string;
  email: string;
  name: string;
  business_name: string | null;
  role: ProfileRole;
  status: ReviewStatus;
  /** cafes.id of the listing this owner manages, set on approval. */
  cafe_profile_id: string | null;
  created_at: string;
  updated_at: string;
}

/** What the navigation shows: guest (signed out), user, place owner, or admin. */
export type PortalRole = 'guest' | 'user' | 'roaster' | 'admin';

// Legacy shapes kept for the hidden Roaster Suite -----------------------------------------------------

export type AccountRole = 'roaster' | 'admin';

export type AccountStatus = 'pending' | 'approved' | 'rejected';

export interface RoasterApplication {
  businessName: string;
  handle: string;
  district: string;
  city: string;
  isRoastery: boolean;
  description: string;
  permitNumber: string;
  /** dataURL of the uploaded DTI / Mayor's permit document. */
  permitDoc: string | null;
  /** dataURL of a government ID. */
  idDoc: string | null;
}

export interface Account {
  id: string;
  role: AccountRole;
  email: string;
  name: string;
  /** Roaster-side display name (cafe or roastery brand). */
  businessName: string;
  status: AccountStatus;
  /** Cafe profile created on approval, for the storefront link. */
  cafeProfileId: string | null;
  appliedAt: string;
  reviewNote: string | null;
}
