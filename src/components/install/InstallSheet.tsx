import React, { useEffect, useRef, useState } from 'react';
import { Share, SquarePlus, EllipsisVertical, Ellipsis, Link } from 'lucide-react';
import { Modal, PrimaryButton, SecondaryButton } from '../common/FormControls';
import { AyaMascot } from '../common/AyaMascot';
import type { InstallMode } from './installPlatform';
import type { PromptResult } from './installPromptStore';

interface InstallSheetProps {
  /** Snapshot taken when App opened the sheet, not the live mode. Open while non-null. */
  mode: InstallMode | null;
  onInstall: () => Promise<PromptResult>;
  onClose: () => void;
}

interface Step {
  text: string;
  icon?: React.ReactNode;
}

const ICON = 'w-5 h-5';

const StepIcon: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span aria-hidden="true" className="h-9 w-9 shrink-0 rounded-[8px] bg-[#906D4B]/15 text-[#7D5C3D] flex items-center justify-center">
    {children}
  </span>
);

/**
 * Aya offers to put Haraya on the home screen. The variant follows the platform mode snapshot: a real
 * install button, step-by-step help, or a nudge out of an in-app browser. After a successful install the
 * sheet shows a done state that outranks the mode.
 */
export const InstallSheet: React.FC<InstallSheetProps> = ({ mode, onInstall, onClose }) => {
  const [done, setDone] = useState(false);
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);
  const primaryRef = useRef<HTMLButtonElement>(null);

  const isOpen = mode !== null;

  // Reset on close so reopening never flashes the previous done or copied state
  useEffect(() => {
    if (!isOpen) {
      setDone(false);
      setCopied(false);
      setBusy(false);
    }
  }, [isOpen]);

  // Focus the primary action on open and when the done state appears
  useEffect(() => {
    if (!isOpen) return;
    const frame = requestAnimationFrame(() => primaryRef.current?.focus({ preventScroll: true }));
    return () => cancelAnimationFrame(frame);
  }, [isOpen, done]);

  const showable = done || mode === 'native-prompt' || mode === 'ios-steps' || mode === 'android-menu' || mode === 'open-in-browser';

  let title = 'One more thing';
  let body = "Keep me on your home screen so I'm one tap away.";
  let steps: Step[] = [];
  let primaryLabel = 'Got it';
  let primaryAction: () => void = onClose;
  let showSecondary = false;

  if (done) {
    title = 'All set';
    body = 'Find me on your home screen. See you at the next cup.';
    primaryLabel = 'Done';
  } else if (mode === 'native-prompt') {
    body = 'Keep me on your home screen. Next time, just tap my icon. No app store, and I stay up to date on my own.';
    primaryLabel = 'Add Haraya';
    showSecondary = true;
    primaryAction = async () => {
      if (busy) return;
      setBusy(true);
      let result: PromptResult = 'unavailable';
      try {
        result = await onInstall();
      } catch {
        result = 'unavailable';
      }
      setBusy(false);
      if (result === 'accepted') setDone(true);
      else onClose();
    };
  } else if (mode === 'ios-steps') {
    steps = [
      { text: '1. Tap Share', icon: <Share className={ICON} /> },
      { text: '2. Choose Add to Home Screen', icon: <SquarePlus className={ICON} /> },
      { text: '3. Tap Add' },
    ];
  } else if (mode === 'android-menu') {
    steps = [
      { text: '1. Open your browser menu', icon: <EllipsisVertical className={ICON} /> },
      { text: '2. Tap Install app or Add to Home screen' },
    ];
  } else if (mode === 'open-in-browser') {
    title = 'Open me in your browser';
    body = "Messenger and Facebook can't add me to your home screen. Open this page in Chrome or Safari, then I'll show you how.";
    steps = [
      { text: '1. Tap the menu', icon: <Ellipsis className={ICON} /> },
      { text: '2. Choose Open in browser' },
    ];
    primaryLabel = copied ? 'Link copied' : 'Copy link';
    showSecondary = true;
    primaryAction = async () => {
      try {
        await navigator.clipboard.writeText(window.location.origin + '/');
        setCopied(true);
      } catch {
        // Copying is a nicety; stay quiet if the browser refuses
      }
    };
  }

  return (
    <Modal isOpen={isOpen && showable} onClose={onClose} maxWidth="sm:max-w-md" labelledBy="install-title">
      <div className="py-4 px-5 flex flex-col items-center gap-3 text-center">
        <AyaMascot pose="welcome" size={112} alt="" />
        <h3 id="install-title" className="ios-title text-[19px] text-[#13191F]">
          {title}
        </h3>
        <p className="text-[14px] text-[#594C3D] max-w-xs">{body}</p>
        {steps.length > 0 && (
          <ul className="w-full flex flex-col gap-2 text-left">
            {steps.map((step) => (
              <li key={step.text} className="flex items-center gap-3 min-h-11 text-[14px] text-[#13191F]">
                {step.icon ? <StepIcon>{step.icon}</StepIcon> : <span aria-hidden="true" className="h-9 w-9 shrink-0" />}
                <span>{step.text}</span>
              </li>
            ))}
          </ul>
        )}
        <div className="w-full flex flex-col gap-2 pt-1">
          <PrimaryButton ref={primaryRef} onClick={primaryAction} disabled={busy} className="w-full min-h-11 inline-flex items-center justify-center gap-2">
            {mode === 'open-in-browser' && !done && <Link className="w-4 h-4" aria-hidden="true" />}
            {primaryLabel}
          </PrimaryButton>
          {showSecondary && !done && (
            <SecondaryButton onClick={onClose} className="w-full min-h-11">
              Maybe later
            </SecondaryButton>
          )}
        </div>
      </div>
    </Modal>
  );
};
