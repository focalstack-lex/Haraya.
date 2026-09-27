/** Roaster, cafe owner, and admin accounts for the Haraya Roaster Suite. */

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

export type PortalRole = 'guest' | 'roaster' | 'admin';
