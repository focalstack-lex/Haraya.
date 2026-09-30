import React, { useEffect, useState } from 'react';
import { ErrorNote, Field, Modal, ModalHeader, PrimaryButton, SelectInput, TextArea } from '../common/FormControls';
import { moderationService, REPORT_DETAILS_LIMIT, REPORT_REASONS, type ReportReason, type ReportTarget } from '../../services/moderationService';
import { sessionService } from '../../services/sessionService';
import { useSessionVersion } from '../../hooks/useServiceVersions';

export interface ReportSubject {
  type: ReportTarget;
  id: string;
  /** What the admin reads in the queue: the spot name, or whose check-in or review it is. */
  label: string;
}

/** Reasons that fit each kind of thing; a check-in or a review cannot be "closed for good". */
const reasonsFor = (type: ReportTarget) =>
  type === 'spot' ? REPORT_REASONS : REPORT_REASONS.filter((reason) => reason.id === 'inappropriate' || reason.id === 'other');

/** Tell Haraya something is wrong with a spot, a check-in or a review. Goes to the Control Room queue. */
export const ReportSheet: React.FC<{ subject: ReportSubject | null; onClose: () => void }> = ({ subject, onClose }) => {
  useSessionVersion();
  const [reason, setReason] = useState<ReportReason>('other');
  const [details, setDetails] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (!subject) return;
    setReason(subject.type === 'spot' ? 'wrong_info' : 'inappropriate');
    setDetails('');
    setError('');
    setSent(false);
  }, [subject]);

  if (!subject) return null;

  const signedIn = sessionService.getUser() !== null;

  const send = async () => {
    setBusy(true);
    setError('');
    try {
      await moderationService.submitReport({ targetType: subject.type, targetId: subject.id, targetLabel: subject.label, reason, details });
      setSent(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not send the report.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal isOpen onClose={onClose} maxWidth="sm:max-w-md">
      <ModalHeader title={subject.type === 'spot' ? 'Report a problem' : 'Report this'} subtitle={subject.label} onClose={onClose} />
      <div className="px-4 sm:px-6 py-4 space-y-4">
        {sent ? (
          <>
            <p role="status" className="text-[15px] text-ink">
              Thank you. Haraya will look at it, and you will get a note in your Passport once it is reviewed.
            </p>
            <PrimaryButton onClick={onClose} className="w-full">
              Done
            </PrimaryButton>
          </>
        ) : !signedIn ? (
          <p className="text-[15px] text-ink-2">Sign in from the Passport tab to send a report. It keeps reports honest and lets Haraya reply to you.</p>
        ) : (
          <>
            <Field label="What is wrong?">
              <SelectInput
                value={reason}
                onChange={(value) => setReason(value as ReportReason)}
                options={reasonsFor(subject.type).map((entry) => ({ value: entry.id, label: entry.label }))}
              />
            </Field>
            <Field label="Details (optional)" hint={`${details.length} of ${REPORT_DETAILS_LIMIT}`}>
              <TextArea
                value={details}
                onChange={setDetails}
                rows={3}
                maxLength={REPORT_DETAILS_LIMIT}
                placeholder={subject.type === 'spot' ? 'e.g. It now closes at 8 PM, not 10 PM.' : 'What should Haraya know?'}
              />
            </Field>
            {error && <ErrorNote message={error} />}
            <PrimaryButton onClick={() => void send()} disabled={busy} className="w-full">
              {busy ? 'Sending' : 'Send report'}
            </PrimaryButton>
          </>
        )}
      </div>
    </Modal>
  );
};
