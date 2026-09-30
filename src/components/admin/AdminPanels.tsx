import React, { useMemo, useState } from 'react';
import { ArrowLeft, BadgeCheck, Download, ExternalLink, FileUp, Pencil, Plus, Star, Trash2 } from 'lucide-react';
import { ErrorNote, PrimaryButton, SecondaryButton } from '../common/FormControls';
import { ListingEditor } from '../../views/PlacePortalView';
import { placeService, type ListingStatus } from '../../services/placeService';
import { IMPORT_LIMIT, IMPORT_TEMPLATE, parseImport, type ImportResult } from '../../services/placeImport';
import { auditLabel, moderationService, reportReasonLabel, type ReportRow } from '../../services/moderationService';
import { useModerationVersion, usePlaceVersion } from '../../hooks/useServiceVersions';

const CARD = 'rounded-card bg-surface ios-card-shadow p-4 sm:p-5';
const INPUT = 'w-full h-11 ios-fill rounded-row px-3.5 text-[15px] text-ink placeholder:text-ink-3 focus:outline-none focus:focus-ring';
const SMALL_BUTTON = 'h-9 px-3 rounded-full ios-fill text-[13px] font-semibold text-tint-ink inline-flex items-center gap-1 disabled:opacity-50 ios-press';
const DANGER_BUTTON = 'h-9 px-3 rounded-full ios-fill text-[13px] font-semibold text-danger inline-flex items-center gap-1 disabled:opacity-50 ios-press';

const STATUS_LABELS: Record<ListingStatus, string> = {
  listed: 'Listed',
  hidden: 'Hidden',
  closed: 'Closed for good',
};

const when = (iso: string): string =>
  new Date(iso).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

/** Shown once where a tool depends on the newest migration and the database does not have it yet. */
export const NeedsUpdateNote: React.FC = () => (
  <p role="status" className={`${CARD} text-[14px] text-ink-2`}>
    These tools need the latest database update (migration 20260930020000), which is not applied yet. Apply it, then reload.
  </p>
);

// Places ------------------------------------------------------------------------------------------------

/** Paste or pick a sheet, check it, then add every good row at once. */
const ImportPanel: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [text, setText] = useState('');
  const [result, setResult] = useState<ImportResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [added, setAdded] = useState<number | null>(null);

  const pickFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (file.size > 1_000_000) {
      setError('That file is too large for an import. Keep it under 1 MB.');
      return;
    }
    setText(await file.text());
    setResult(null);
    setAdded(null);
    setError('');
  };

  const downloadTemplate = () => {
    const url = URL.createObjectURL(new Blob([IMPORT_TEMPLATE], { type: 'text/csv' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'haraya-places-template.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  const runImport = async () => {
    if (!result || result.listings.length === 0) return;
    setBusy(true);
    setError('');
    try {
      setAdded(await placeService.importListings(result.listings));
      setResult(null);
      setText('');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not import the places.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="space-y-3" aria-labelledby="import-title">
      <button onClick={onBack} className="min-h-11 inline-flex items-center gap-1 text-[15px] font-semibold text-tint-ink ios-press">
        <ArrowLeft className="w-4 h-4" />
        Places
      </button>
      <h2 id="import-title" className="ios-title px-1">
        Import places from a sheet
      </h2>
      <div className={`${CARD} space-y-3`}>
        <p className="text-[14px] text-ink-2">
          Save the sheet as CSV with the column names in the first row. Up to {IMPORT_LIMIT} places at a time. Every place is added
          unverified and without photos; check the pin of each one afterwards.
        </p>
        <div className="flex flex-wrap gap-2">
          <button onClick={downloadTemplate} className={SMALL_BUTTON}>
            <Download className="w-3.5 h-3.5" />
            Download the template
          </button>
          <label className={`${SMALL_BUTTON} cursor-pointer`}>
            <FileUp className="w-3.5 h-3.5" />
            Choose a CSV file
            <input type="file" accept=".csv,text/csv" onChange={(event) => void pickFile(event)} className="sr-only" />
          </label>
        </div>
        <textarea
          value={text}
          onChange={(event) => {
            setText(event.target.value);
            setResult(null);
            setAdded(null);
          }}
          rows={6}
          aria-label="Sheet contents as CSV"
          placeholder="Or paste the sheet here"
          className="w-full ios-fill rounded-row px-3.5 py-3 font-mono text-[13px] text-ink placeholder:text-ink-3 focus:outline-none focus:focus-ring resize-y"
        />
        <SecondaryButton onClick={() => setResult(parseImport(text))} className="w-full sm:w-auto">
          Check the sheet
        </SecondaryButton>
        {error && <ErrorNote message={error} />}
        {added !== null && (
          <p role="status" className="ios-footnote text-ok bg-ok/10 rounded-row px-3.5 py-2.5">
            Added {added} {added === 1 ? 'place' : 'places'}. They are live and unverified.
          </p>
        )}
      </div>

      {result && (
        <div className={`${CARD} space-y-3`}>
          <h3 className="ios-headline text-ink">
            <span className="font-mono">{result.listings.length}</span> ready, <span className="font-mono">{result.problems.length}</span> left out
          </h3>
          {result.problems.length > 0 && (
            <ul className="space-y-1 text-[13px] text-danger">
              {result.problems.map((problem) => (
                <li key={problem}>{problem}</li>
              ))}
            </ul>
          )}
          {result.listings.length > 0 && (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[13px]">
                  <thead className="text-ink-2">
                    <tr>
                      <th className="py-1.5 pr-3 font-medium">Name</th>
                      <th className="py-1.5 pr-3 font-medium">City</th>
                      <th className="py-1.5 pr-3 font-medium">Area</th>
                      <th className="py-1.5 font-medium">Pin</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.listings.map((listing) => (
                      <tr key={`${listing.name}-${listing.lat}-${listing.lng}`} className="border-t border-shade/15">
                        <td className="py-1.5 pr-3 text-ink">{listing.name}</td>
                        <td className="py-1.5 pr-3 text-ink-2 whitespace-nowrap">{listing.city}</td>
                        <td className="py-1.5 pr-3 text-ink-2 whitespace-nowrap">{listing.district}</td>
                        <td className="py-1.5 font-mono text-ink-2 whitespace-nowrap">
                          {listing.lat?.toFixed(4)}, {listing.lng?.toFixed(4)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <PrimaryButton onClick={() => void runImport()} disabled={busy} className="w-full">
                {busy ? 'Importing' : `Add ${result.listings.length} ${result.listings.length === 1 ? 'place' : 'places'}`}
              </PrimaryButton>
            </>
          )}
        </div>
      )}
    </section>
  );
};

/** Every row of the catalog: add, import, edit, verify, and take a place off the app or mark it closed. */
export const PlacesPanel: React.FC<{ onViewCafe: (cafeId: string) => void }> = ({ onViewCafe }) => {
  usePlaceVersion();
  const [mode, setMode] = useState<'list' | 'import' | { edit: string }>('list');
  const [query, setQuery] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const rows = placeService.getAllListingRows();
  const canManage = placeService.supportsPhotos();

  const act = async (cafeId: string, action: () => Promise<void>) => {
    setBusyId(cafeId);
    setError('');
    try {
      await action();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not save the change.');
    } finally {
      setBusyId(null);
    }
  };

  if (mode === 'import') return <ImportPanel onBack={() => setMode('list')} />;

  if (typeof mode === 'object') {
    return (
      <section className="space-y-3">
        <button onClick={() => setMode('list')} className="min-h-11 inline-flex items-center gap-1 text-[15px] font-semibold text-tint-ink ios-press">
          <ArrowLeft className="w-4 h-4" />
          Places
        </button>
        <h2 className="ios-title px-1">{mode.edit === 'new' ? 'Add a place' : 'Edit place'}</h2>
        <ListingEditor target={mode.edit} onViewPlace={onViewCafe} onDone={(cafeId) => setMode(mode.edit === 'new' ? { edit: cafeId } : 'list')} />
      </section>
    );
  }

  const needle = query.trim().toLowerCase();
  const shown = needle
    ? rows.filter((row) => `${row.name} ${row.city} ${row.district}`.toLowerCase().includes(needle))
    : rows;

  return (
    <section className="space-y-3" aria-labelledby="listings-title">
      <h2 id="listings-title" className="ios-title px-1">
        Places <span className="font-mono text-ink-2">({rows.length})</span>
      </h2>
      <div className="flex flex-col sm:flex-row gap-2">
        <PrimaryButton onClick={() => setMode({ edit: 'new' })} className="w-full sm:w-auto">
          <span className="inline-flex items-center gap-1.5">
            <Plus className="w-4 h-4" />
            Add a place
          </span>
        </PrimaryButton>
        <SecondaryButton onClick={() => setMode('import')} className="w-full sm:w-auto">
          <span className="inline-flex items-center gap-1.5">
            <FileUp className="w-4 h-4" />
            Import from a sheet
          </span>
        </SecondaryButton>
      </div>
      <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search places" aria-label="Search places" className={INPUT} />
      {error && <ErrorNote message={error} />}
      {shown.length === 0 ? (
        <p className="px-1 text-[14px] text-ink-2">{rows.length === 0 ? 'No places in the database yet. Add one, or import a sheet.' : 'No places match.'}</p>
      ) : (
        <ul className="space-y-2">
          {shown.map((row) => {
            const status = (row.status ?? 'listed') as ListingStatus;
            const busy = busyId === row.id;
            return (
              <li key={row.id} className={`${CARD} space-y-2.5`}>
                <div className="flex items-center gap-3">
                  <span className="flex-1 min-w-0">
                    <span className="block text-[15px] font-semibold text-ink truncate">{row.name}</span>
                    <span className="block ios-footnote text-ink-2 truncate">
                      {row.district}, {row.city}
                      {status !== 'listed' && <span className="text-danger font-semibold"> · {STATUS_LABELS[status]}</span>}
                    </span>
                  </span>
                  {status !== 'hidden' && (
                    <button onClick={() => onViewCafe(row.id)} aria-label={`View ${row.name}`} className="h-11 w-11 -mr-2 flex items-center justify-center text-tint-ink ios-press">
                      <ExternalLink className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => void act(row.id, () => placeService.setVerified(row.id, !row.verified))}
                    disabled={busy}
                    aria-pressed={row.verified}
                    className={`h-9 px-3 rounded-full text-[13px] font-semibold inline-flex items-center gap-1 disabled:opacity-50 ios-press ${
                      row.verified ? 'bg-ok text-surface' : 'ios-fill text-ink'
                    }`}
                  >
                    <BadgeCheck className="w-3.5 h-3.5" />
                    {row.verified ? 'Verified' : 'Unverified'}
                  </button>
                  <button onClick={() => setMode({ edit: row.id })} className={SMALL_BUTTON}>
                    <Pencil className="w-3.5 h-3.5" />
                    Edit
                  </button>
                  {canManage && (
                    <label className="ml-auto">
                      <span className="sr-only">Status of {row.name}</span>
                      <select
                        value={status}
                        disabled={busy}
                        onChange={(event) => void act(row.id, () => placeService.setStatus(row.id, event.target.value as ListingStatus))}
                        className="h-9 ios-fill rounded-control px-2.5 text-[13px] font-semibold text-ink focus:outline-none focus:focus-ring disabled:opacity-60"
                      >
                        {(Object.keys(STATUS_LABELS) as ListingStatus[]).map((value) => (
                          <option key={value} value={value}>
                            {STATUS_LABELS[value]}
                          </option>
                        ))}
                      </select>
                    </label>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
      <p className="px-1 ios-footnote text-ink-2">
        Hidden takes a place off the app for everyone. Closed for good keeps it findable, marked as closed, and stops check-ins.
      </p>
    </section>
  );
};

// Reports and moderation ---------------------------------------------------------------------------------

const ReportCard: React.FC<{ report: ReportRow; onViewCafe: (cafeId: string) => void }> = ({ report, onViewCafe }) => {
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const run = async (action: () => Promise<void>) => {
    setBusy(true);
    setError('');
    try {
      await action();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not save.');
      setBusy(false);
    }
  };

  const listed = report.target_type === 'spot' && placeService.isListed(report.target_id);

  return (
    <article className={`${CARD} space-y-2.5`}>
      <div>
        <h3 className="ios-headline text-ink">{reportReasonLabel(report.reason)}</h3>
        <p className="ios-footnote text-ink-2">
          {report.target_type === 'spot' ? 'Spot' : report.target_type === 'visit' ? 'Check-in' : 'Review'}
          {report.target_label ? `: ${report.target_label}` : ''}
          {' · '}
          {when(report.created_at)}
        </p>
        {report.details && <p className="text-[14px] text-ink/85 mt-1 break-words">{report.details}</p>}
      </div>
      {error && <ErrorNote message={error} />}
      <div className="flex flex-wrap gap-2">
        {report.target_type === 'spot' && (
          <button onClick={() => onViewCafe(report.target_id)} className={SMALL_BUTTON}>
            <ExternalLink className="w-3.5 h-3.5" />
            Open the spot
          </button>
        )}
        {listed && (
          <>
            <button onClick={() => void run(() => placeService.setStatus(report.target_id, 'closed'))} disabled={busy} className={DANGER_BUTTON}>
              Mark closed for good
            </button>
            <button onClick={() => void run(() => placeService.setStatus(report.target_id, 'hidden'))} disabled={busy} className={DANGER_BUTTON}>
              Hide the place
            </button>
          </>
        )}
        {report.target_type === 'visit' && (
          <button onClick={() => void run(() => moderationService.removeVisit(report.target_id))} disabled={busy} className={DANGER_BUTTON}>
            <Trash2 className="w-3.5 h-3.5" />
            Remove the check-in
          </button>
        )}
        {report.target_type === 'review' && (
          <button onClick={() => void run(() => moderationService.removeReview(report.target_id))} disabled={busy} className={DANGER_BUTTON}>
            <Trash2 className="w-3.5 h-3.5" />
            Remove the review
          </button>
        )}
      </div>
      <input
        value={note}
        onChange={(event) => setNote(event.target.value)}
        maxLength={280}
        placeholder="Note to the reporter (optional)"
        aria-label="Note to the reporter"
        className={INPUT}
      />
      <div className="flex gap-2">
        <button
          onClick={() => void run(() => moderationService.resolveReport(report.id, 'resolved', note))}
          disabled={busy}
          className="h-11 flex-1 rounded-full bg-ok text-surface text-[15px] font-semibold disabled:opacity-50 ios-press"
        >
          Resolved
        </button>
        <button
          onClick={() => void run(() => moderationService.resolveReport(report.id, 'dismissed', note))}
          disabled={busy}
          className="h-11 flex-1 rounded-full ios-fill text-ink text-[15px] font-semibold disabled:opacity-50 ios-press"
        >
          Dismiss
        </button>
      </div>
    </article>
  );
};

/** The report queue, then the newest check-ins and reviews so bad ones can be removed without a report. */
export const ReportsPanel: React.FC<{ onViewCafe: (cafeId: string) => void }> = ({ onViewCafe }) => {
  useModerationVersion();
  usePlaceVersion();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const open = moderationService.getOpenReports();
  const visits = moderationService.getRecentVisits();
  const reviews = moderationService.getRecentReviews();

  const remove = async (id: string, action: () => Promise<void>) => {
    setBusyId(id);
    setError('');
    try {
      await action();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not remove it.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-6">
      {!moderationService.isReady() && <NeedsUpdateNote />}

      <section className="space-y-2" aria-labelledby="reports-title">
        <h2 id="reports-title" className="ios-title px-1">
          Reports <span className="font-mono text-ink-2">({open.length})</span>
        </h2>
        {open.length === 0 ? (
          <p className="px-1 text-[14px] text-ink-2">No reports waiting.</p>
        ) : (
          open.map((report) => <ReportCard key={report.id} report={report} onViewCafe={onViewCafe} />)
        )}
      </section>

      {error && <ErrorNote message={error} />}

      <section className="space-y-1.5" aria-labelledby="recent-visits-title">
        <h2 id="recent-visits-title" className="px-4 text-[13px] text-ink-2">
          Newest check-ins
        </h2>
        {visits.length === 0 ? (
          <p className="px-4 text-[14px] text-ink-2">No check-ins yet.</p>
        ) : (
          <ul className="ios-group ios-card-shadow">
            {visits.map((visit) => (
              <li key={visit.id} className="ios-group-row">
                <span className="flex-1 min-w-0">
                  <span className="block text-[15px] text-ink truncate">
                    {visit.visitor_name} at {visit.cafe_name}
                  </span>
                  <span className="block ios-footnote text-ink-2 break-words">
                    {when(visit.created_at)}
                    {visit.notes ? ` · ${visit.notes}` : ''}
                  </span>
                </span>
                <button
                  onClick={() => void remove(visit.id, () => moderationService.removeVisit(visit.id))}
                  disabled={busyId === visit.id}
                  aria-label={`Remove the check-in by ${visit.visitor_name} at ${visit.cafe_name}`}
                  className="h-11 w-11 -mr-2 shrink-0 flex items-center justify-center text-danger disabled:opacity-50 ios-press"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-1.5" aria-labelledby="recent-reviews-title">
        <h2 id="recent-reviews-title" className="px-4 text-[13px] text-ink-2">
          Newest reviews
        </h2>
        {reviews.length === 0 ? (
          <p className="px-4 text-[14px] text-ink-2">No reviews yet.</p>
        ) : (
          <ul className="ios-group ios-card-shadow">
            {reviews.map((review) => (
              <li key={review.id} className="ios-group-row">
                <span className="flex-1 min-w-0">
                  <span className="flex items-center gap-1 text-[15px] text-ink">
                    <span className="truncate">{review.author_name}</span>
                    <Star className="w-3.5 h-3.5 shrink-0 text-star fill-star" />
                    <span className="font-mono">{review.rating}</span>
                  </span>
                  <span className="block ios-footnote text-ink-2 break-words">
                    {when(review.created_at)}
                    {review.body ? ` · ${review.body}` : ''}
                  </span>
                </span>
                <button
                  onClick={() => void remove(review.id, () => moderationService.removeReview(review.id))}
                  disabled={busyId === review.id}
                  aria-label={`Remove the review by ${review.author_name}`}
                  className="h-11 w-11 -mr-2 shrink-0 flex items-center justify-center text-danger disabled:opacity-50 ios-press"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
};

// Health ------------------------------------------------------------------------------------------------

const EVENT_TITLES: Record<string, string> = {
  search_no_results: 'Searches that found nothing',
  city_empty: 'Cities opened with no spots',
  tab_view: 'Pages opened',
};

/** Error reports from visitors' browsers, what people looked for and did not find, and the admin audit log. */
export const HealthPanel: React.FC = () => {
  useModerationVersion();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const errors = moderationService.getErrors();
  const events = moderationService.getEvents();
  const audit = moderationService.getAuditLog();

  const grouped = useMemo(() => {
    const groups = new Map<string, { detail: string; total: number }[]>();
    for (const event of events) {
      const list = groups.get(event.name) ?? [];
      list.push({ detail: event.detail, total: event.total });
      groups.set(event.name, list);
    }
    return [...groups.entries()];
  }, [events]);

  const clear = async () => {
    setBusy(true);
    setError('');
    try {
      await moderationService.clearErrors();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not clear the list.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      {!moderationService.isReady() && <NeedsUpdateNote />}

      <section className="space-y-2" aria-labelledby="errors-title">
        <div className="flex items-center justify-between gap-3 px-1">
          <h2 id="errors-title" className="ios-title">
            Errors <span className="font-mono text-ink-2">({errors.length})</span>
          </h2>
          {errors.length > 0 && (
            <button onClick={() => void clear()} disabled={busy} className={SMALL_BUTTON}>
              Clear
            </button>
          )}
        </div>
        {error && <ErrorNote message={error} />}
        {errors.length === 0 ? (
          <p className="px-1 text-[14px] text-ink-2">No errors reported by visitors' browsers.</p>
        ) : (
          <ul className="space-y-2">
            {errors.map((row) => (
              <li key={row.id} className={`${CARD} space-y-1`}>
                <p className="text-[14px] font-semibold text-ink break-words">{row.message}</p>
                <p className="ios-footnote text-ink-2 break-all">
                  {when(row.created_at)} · {row.page || 'unknown page'}
                </p>
                {row.stack && (
                  <details className="text-[12px] text-ink-2">
                    <summary className="min-h-11 flex items-center cursor-pointer text-tint-ink font-semibold">Details</summary>
                    <pre className="overflow-x-auto font-mono whitespace-pre-wrap break-all">{row.stack}</pre>
                    <p className="mt-1 break-all">{row.user_agent}</p>
                  </details>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-2" aria-labelledby="usage-title">
        <h2 id="usage-title" className="ios-title px-1">
          Usage, last 30 days
        </h2>
        {grouped.length === 0 ? (
          <p className="px-1 text-[14px] text-ink-2">Nothing recorded yet. Counts are anonymous: no account or device is stored.</p>
        ) : (
          grouped.map(([name, list]) => (
            <div key={name} className="space-y-1.5">
              <h3 className="px-4 text-[13px] text-ink-2">{EVENT_TITLES[name] ?? name}</h3>
              <ul className="ios-group ios-card-shadow">
                {list.slice(0, 12).map((entry) => (
                  <li key={entry.detail} className="ios-group-row">
                    <span className="flex-1 min-w-0 text-[15px] text-ink truncate">{entry.detail || 'unspecified'}</span>
                    <span className="font-mono text-[15px] text-ink-2 shrink-0">{entry.total.toLocaleString()}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))
        )}
      </section>

      <section className="space-y-1.5" aria-labelledby="audit-title">
        <h2 id="audit-title" className="ios-title px-1">
          Admin activity
        </h2>
        {audit.length === 0 ? (
          <p className="px-1 text-[14px] text-ink-2">No admin actions recorded yet.</p>
        ) : (
          <ul className="ios-group ios-card-shadow">
            {audit.map((row) => (
              <li key={row.id} className="ios-group-row">
                <span className="flex-1 min-w-0">
                  <span className="block text-[15px] text-ink truncate">
                    {auditLabel(row.action)}
                    {row.summary ? `: ${row.summary}` : ''}
                  </span>
                  <span className="block ios-footnote text-ink-2 truncate">
                    {row.actor_email || 'unknown admin'} · {when(row.created_at)}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
};
