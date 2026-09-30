import { supabase } from '../config/supabase';
import { describePlaceError } from './placeMapping';
import { sessionService } from './sessionService';

/**
 * Reports from visitors and the Control Room's moderation data: the report queue, recent check-ins,
 * the audit log, error reports and usage counts (20260930020000). Everything admin-side is refused by
 * Row Level Security for anyone else; the checks here only keep the interface honest.
 */

export const REPORT_REASONS = [
  { id: 'closed', label: 'Closed for good' },
  { id: 'wrong_info', label: 'Hours or details are wrong' },
  { id: 'wrong_location', label: 'The pin is in the wrong place' },
  { id: 'duplicate', label: 'Listed twice' },
  { id: 'inappropriate', label: 'Offensive or not a real place' },
  { id: 'other', label: 'Something else' },
] as const;
export type ReportReason = (typeof REPORT_REASONS)[number]['id'];
export type ReportTarget = 'spot' | 'visit' | 'review';

export const REPORT_DETAILS_LIMIT = 500;

export const reportReasonLabel = (reason: string): string =>
  REPORT_REASONS.find((entry) => entry.id === reason)?.label ?? 'Report';

export interface ReportRow {
  id: string;
  reporter_id: string;
  target_type: ReportTarget;
  target_id: string;
  target_label: string;
  reason: string;
  details: string;
  status: 'open' | 'resolved' | 'dismissed';
  resolution_note: string | null;
  created_at: string;
  resolved_at: string | null;
}

export interface ModeratedVisit {
  id: string;
  user_id: string;
  visitor_name: string;
  cafe_id: string;
  cafe_name: string;
  session_type: string;
  notes: string | null;
  created_at: string;
}

export interface ModeratedReview {
  id: string;
  user_id: string;
  cafe_id: string;
  rating: number;
  body: string;
  author_name: string;
  created_at: string;
}

export interface AuditRow {
  id: number;
  actor_email: string;
  action: string;
  target_type: string;
  target_id: string;
  summary: string;
  created_at: string;
}

export interface ClientErrorRow {
  id: number;
  created_at: string;
  message: string;
  stack: string;
  page: string;
  user_agent: string;
}

export interface EventCount {
  name: string;
  detail: string;
  total: number;
}

const AUDIT_LABELS: Record<string, string> = {
  place_created: 'Added a place',
  place_edited: 'Edited a place',
  place_listed: 'Put a place back on the app',
  place_hidden: 'Hid a place',
  place_closed: 'Marked a place closed for good',
  place_verified: 'Verified a place',
  place_unverified: 'Removed a verified badge',
  spot_approved: 'Approved a community spot',
  spot_rejected: 'Rejected a community spot',
  application_approved: 'Approved a place application',
  application_rejected: 'Rejected a place application',
  role_changed: 'Changed a role',
  account_restricted: 'Restricted an account',
  account_restored: 'Restored an account',
  visit_removed: 'Removed a check-in',
  review_removed: 'Removed a review',
  report_resolved: 'Resolved a report',
  report_dismissed: 'Dismissed a report',
};

export const auditLabel = (action: string): string => AUDIT_LABELS[action] ?? action.replace(/_/g, ' ');

const listeners = new Set<() => void>();
let version = 0;
let reports: ReportRow[] = [];
let visits: ModeratedVisit[] = [];
let reviews: ModeratedReview[] = [];
let audit: AuditRow[] = [];
let errors: ClientErrorRow[] = [];
let events: EventCount[] = [];
/** False when the latest database update is not applied, so the Control Room can say so once. */
let ready = true;

function notify(): void {
  version += 1;
  listeners.forEach((listener) => listener());
}

const isMissing = (message: string): boolean => /schema cache|does not exist|Could not find/i.test(message);

function describe(message: string): string {
  if (message.includes('report_limit')) return 'You can send up to 10 reports a day.';
  if (message.includes('report_duplicate')) return 'You already reported this. It is waiting for review.';
  if (message.includes('row-level security')) return 'Sign in again to continue.';
  return describePlaceError(message);
}

export const moderationService = {
  subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  getVersion(): number {
    return version;
  },

  // Visitor side ----------------------------------------------------------------------------------------

  /** Sends a report about a spot, a check-in or a review. Signed-in visitors only. */
  async submitReport(input: { targetType: ReportTarget; targetId: string; targetLabel: string; reason: ReportReason; details: string }): Promise<void> {
    if (!supabase) throw new Error('Reports are not available right now.');
    if (!sessionService.getUser()) throw new Error('Sign in to send a report.');
    const details = input.details.trim();
    if (details.length > REPORT_DETAILS_LIMIT) throw new Error(`Keep the details under ${REPORT_DETAILS_LIMIT} characters.`);
    const { error } = await supabase.from('reports').insert({
      target_type: input.targetType,
      target_id: input.targetId,
      target_label: input.targetLabel.slice(0, 120),
      reason: input.reason,
      details,
    });
    if (error) {
      console.warn('Haraya: report failed', error.message);
      throw new Error(describe(error.message));
    }
  },

  // Admin side ------------------------------------------------------------------------------------------

  isReady(): boolean {
    return ready;
  },

  getReports(): ReportRow[] {
    return sessionService.isAdmin() ? reports : [];
  },

  getOpenReports(): ReportRow[] {
    return moderationService.getReports().filter((row) => row.status === 'open');
  },

  getRecentVisits(): ModeratedVisit[] {
    return sessionService.isAdmin() ? visits : [];
  },

  getRecentReviews(): ModeratedReview[] {
    return sessionService.isAdmin() ? reviews : [];
  },

  getAuditLog(): AuditRow[] {
    return sessionService.isAdmin() ? audit : [];
  },

  getErrors(): ClientErrorRow[] {
    return sessionService.isAdmin() ? errors : [];
  },

  getEvents(): EventCount[] {
    return sessionService.isAdmin() ? events : [];
  },

  async refresh(): Promise<void> {
    if (!supabase || !sessionService.isAdmin()) {
      reports = [];
      visits = [];
      reviews = [];
      audit = [];
      errors = [];
      events = [];
      notify();
      return;
    }
    const [reportResult, visitResult, reviewResult, auditResult, errorResult, eventResult] = await Promise.all([
      supabase.from('reports').select('*').order('created_at', { ascending: false }).limit(200),
      supabase
        .from('sanctuary_visits')
        .select('id, user_id, visitor_name, cafe_id, cafe_name, session_type, notes, created_at')
        .order('created_at', { ascending: false })
        .limit(50),
      supabase.from('spot_reviews').select('id, user_id, cafe_id, rating, body, author_name, created_at').order('created_at', { ascending: false }).limit(50),
      supabase.from('admin_audit_log').select('*').order('created_at', { ascending: false }).limit(100),
      supabase.from('client_errors').select('id, created_at, message, stack, page, user_agent').order('created_at', { ascending: false }).limit(50),
      supabase.rpc('admin_event_summary', { since_days: 30 }),
    ]);
    ready = !(reportResult.error && isMissing(reportResult.error.message));
    for (const result of [reportResult, visitResult, reviewResult, auditResult, errorResult, eventResult]) {
      if (result.error && !isMissing(result.error.message)) console.warn('Haraya: moderation data could not load', result.error.message);
    }
    reports = (reportResult.data ?? []) as ReportRow[];
    visits = (visitResult.data ?? []) as ModeratedVisit[];
    reviews = (reviewResult.data ?? []) as ModeratedReview[];
    audit = (auditResult.data ?? []) as AuditRow[];
    errors = (errorResult.data ?? []) as ClientErrorRow[];
    events = ((eventResult.data ?? []) as { name: string; detail: string; total: number | string }[]).map((row) => ({
      name: row.name,
      detail: row.detail,
      total: Number(row.total) || 0,
    }));
    notify();
  },

  async resolveReport(id: string, status: 'resolved' | 'dismissed', note: string): Promise<void> {
    if (!supabase || !sessionService.isAdmin()) throw new Error('Only admins can close reports.');
    const { error } = await supabase.rpc('admin_resolve_report', { target: id, new_status: status, note });
    if (error) {
      console.warn('Haraya: report review failed', error.message);
      throw new Error(describe(error.message));
    }
    await moderationService.refresh();
  },

  async removeVisit(id: string): Promise<void> {
    if (!supabase || !sessionService.isAdmin()) throw new Error('Only admins can remove check-ins.');
    const { error } = await supabase.rpc('admin_delete_visit', { target: id });
    if (error) {
      console.warn('Haraya: check-in removal failed', error.message);
      throw new Error(describe(error.message));
    }
    await moderationService.refresh();
  },

  async removeReview(id: string): Promise<void> {
    if (!supabase || !sessionService.isAdmin()) throw new Error('Only admins can remove reviews.');
    const { error } = await supabase.from('spot_reviews').delete().eq('id', id);
    if (error) {
      console.warn('Haraya: review removal failed', error.message);
      throw new Error(describe(error.message));
    }
    await moderationService.refresh();
  },

  async clearErrors(): Promise<void> {
    if (!supabase || !sessionService.isAdmin()) throw new Error('Only admins can clear error reports.');
    const { error } = await supabase.from('client_errors').delete().gte('id', 0);
    if (error) {
      console.warn('Haraya: clearing errors failed', error.message);
      throw new Error(describe(error.message));
    }
    await moderationService.refresh();
  },
};
