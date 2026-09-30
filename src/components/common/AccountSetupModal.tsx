import React, { useState } from 'react';
import { AyaMascot } from './AyaMascot';
import { ErrorNote, Field, Modal, PrimaryButton, TextInput } from './FormControls';
import { PASSWORD_MIN_LENGTH, sessionService } from '../../services/sessionService';

interface AccountSetupModalProps {
  isOpen: boolean;
  onCompleted: () => void;
}

export const AccountSetupModal: React.FC<AccountSetupModalProps> = ({ isOpen, onCompleted }) => {
  const [username, setUsername] = useState(() => sessionService.getDisplayName());
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (busy) return;
    setError('');

    const trimmed = username.trim();
    if (!trimmed) {
      setError('Please choose a username or name.');
      return;
    }
    if (password.length < PASSWORD_MIN_LENGTH) {
      setError(`Use a password of at least ${PASSWORD_MIN_LENGTH} characters.`);
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setBusy(true);
    try {
      await sessionService.completeAccountSetup(trimmed, password);
      onCompleted();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not complete account setup. Try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={() => {}} maxWidth="sm:max-w-md" labelledBy="account-setup-title">
      <div className="p-5 sm:p-6 space-y-4">
        <div className="flex flex-col items-center text-center space-y-2 pt-2 sm:pt-0">
          <AyaMascot pose="welcome" size={80} alt="" />
          <h2 id="account-setup-title" className="ios-title2 font-cooper text-ink">
            Set up your account
          </h2>
          <p className="text-[14px] text-ink-2 max-w-sm">
            Welcome to Haraya. Set your username and a password so you can also sign in with email anytime.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 pt-2">
          <Field label="Username / Display name">
            <TextInput
              value={username}
              onChange={setUsername}
              placeholder="How Haraya greets you"
              disabled={busy}
            />
          </Field>

          <Field label="Password" hint={`At least ${PASSWORD_MIN_LENGTH} characters`}>
            <TextInput
              value={password}
              onChange={setPassword}
              type="password"
              placeholder="Create a password"
              disabled={busy}
            />
          </Field>

          <Field label="Confirm password">
            <TextInput
              value={confirmPassword}
              onChange={setConfirmPassword}
              type="password"
              placeholder="Repeat your password"
              disabled={busy}
            />
          </Field>

          {error && <ErrorNote message={error} />}

          <div className="pt-2">
            <PrimaryButton type="submit" disabled={busy} className="w-full">
              {busy ? 'Saving account...' : 'Complete setup'}
            </PrimaryButton>
          </div>
        </form>
      </div>
    </Modal>
  );
};
