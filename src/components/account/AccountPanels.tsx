import React, { useEffect, useState } from 'react';
import { Bell, ChevronRight, Download, Trash2 } from 'lucide-react';
import { ErrorNote, Field, Modal, ModalHeader, TextInput } from '../common/FormControls';
import { accountService } from '../../services/accountService';
import { notificationService } from '../../services/notificationService';
import { sessionService } from '../../services/sessionService';
import { timeAgo } from '../../services/visitMapping';
import { useNotificationVersion, useSessionVersion } from '../../hooks/useServiceVersions';

const ROW_ICON = 'h-7.5 w-7.5 shrink-0 rounded-[8px] flex items-center justify-center';

/**
 * Updates for the signed-in visitor: a spot or application was reviewed, a report was closed, someone
 * clinked a visit. Draws nothing when there are none, so the Passport stays as it was.
 */
export const NotificationsCard: React.FC = () => {
  useNotificationVersion();
  useSessionVersion();
  const user = sessionService.getUser();

  // Approval happens on someone else's device; look again whenever the Passport opens
  useEffect(() => {
    if (user) void notificationService.refresh();
  }, [user?.id]);

  const rows = notificationService.getAll();
  if (!user || rows.length === 0) return null;

  const unread = notificationService.getUnreadCount();
  const now = new Date();

  return (
    <section className="space-y-1.5" aria-labelledby="updates-title">
      <div className="flex items-center justify-between gap-3 px-4">
        <h3 id="updates-title" className="text-[13px] text-ink-2">
          Updates{unread > 0 && <span className="font-mono"> ({unread} new)</span>}
        </h3>
        {unread > 0 && (
          <button onClick={() => void notificationService.markAllRead()} className="min-h-11 -my-3 text-[13px] font-semibold text-tint-ink ios-press">
            Mark all as read
          </button>
        )}
      </div>
      <ul className="ios-group ios-card-shadow">
        {rows.slice(0, 6).map((row) => {
          const body = (
            <>
              <span className={`${ROW_ICON} ${row.read_at ? 'bg-shade/12 text-ink-2' : 'bg-tint/15 text-tint-ink'}`}>
                <Bell className="w-4 h-4" strokeWidth={2.2} />
              </span>
              <span className="flex-1 min-w-0">
                <span className={`block text-[15px] text-ink truncate ${row.read_at ? '' : 'font-semibold'}`}>{row.title}</span>
                <span className="block ios-footnote text-ink-2 break-words">
                  {row.body ? `${row.body} · ` : ''}
                  {timeAgo(row.created_at, now)}
                </span>
              </span>
            </>
          );
          return (
            <li key={row.id}>
              {row.link.startsWith('#/') ? (
                <a href={row.link} className="ios-group-row ios-press">
                  {body}
                  <ChevronRight className="w-4 h-4 shrink-0 text-ink-3/60" strokeWidth={2.5} />
                </a>
              ) : (
                <div className="ios-group-row">{body}</div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
};

/** Download everything Haraya holds about the account, or delete the account for good. */
export const AccountDataSection: React.FC = () => {
  useSessionVersion();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [confirming, setConfirming] = useState(false);
  const [typed, setTyped] = useState('');
  const user = sessionService.getUser();
  if (!user) return null;

  const download = async () => {
    setBusy(true);
    setError('');
    try {
      const data = await accountService.exportMyData();
      const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = `haraya-my-data-${new Date().toISOString().slice(0, 10)}.json`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not prepare the download.');
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    setBusy(true);
    setError('');
    try {
      await accountService.deleteMyAccount();
      window.location.hash = '#/tab/feed';
      window.location.reload();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not delete the account.');
      setBusy(false);
    }
  };

  return (
    <section className="space-y-1.5">
      <h3 className="px-4 text-[13px] text-ink-2">Your data</h3>
      <div className="ios-group">
        <button onClick={() => void download()} disabled={busy} className="ios-group-row ios-press disabled:opacity-60">
          <span className={`${ROW_ICON} bg-tint/15 text-tint-ink`}>
            <Download className="w-4 h-4" strokeWidth={2.2} />
          </span>
          <span className="flex-1 min-w-0">
            <span className="block text-[15px] text-ink">Download my data</span>
            <span className="block ios-footnote text-ink-2 truncate">Your check-ins, reviews, saved spots and more, as one file</span>
          </span>
        </button>
        <button
          onClick={() => {
            setTyped('');
            setError('');
            setConfirming(true);
          }}
          className="ios-group-row ios-press"
        >
          <span className={`${ROW_ICON} bg-danger/12 text-danger`}>
            <Trash2 className="w-4 h-4" strokeWidth={2.2} />
          </span>
          <span className="flex-1 min-w-0 text-[15px] text-danger">Delete my account</span>
        </button>
      </div>
      {error && !confirming && <ErrorNote message={error} />}

      <Modal isOpen={confirming} onClose={() => setConfirming(false)} maxWidth="sm:max-w-md">
        <ModalHeader title="Delete your account" subtitle={user.email ?? ''} onClose={() => setConfirming(false)} />
        <div className="px-4 sm:px-6 py-4 space-y-4">
          <p className="text-[15px] text-ink">
            This removes your sign-in, passport, check-ins, reviews, reports, saved spots and the community spots you added. It cannot
            be undone. A place you own stays listed, without an owner.
          </p>
          <Field label="Type DELETE to confirm">
            <TextInput value={typed} onChange={setTyped} placeholder="DELETE" />
          </Field>
          {error && <ErrorNote message={error} />}
          <button
            onClick={() => void remove()}
            disabled={busy || typed.trim() !== 'DELETE'}
            className="w-full h-11 rounded-full bg-danger text-surface text-[15px] font-semibold disabled:opacity-40 disabled:cursor-not-allowed ios-press"
          >
            {busy ? 'Deleting' : 'Delete my account for good'}
          </button>
        </div>
      </Modal>
    </section>
  );
};
