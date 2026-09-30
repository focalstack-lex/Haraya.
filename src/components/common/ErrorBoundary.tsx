import React from 'react';
import { reportError } from '../../services/telemetry';

interface ErrorBoundaryState {
  failed: boolean;
}

/**
 * Catches a crash while drawing the app, reports it, and offers a way back instead of a blank page.
 * The visitor's saved spots and passport are untouched: reloading brings them back.
 */
export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, ErrorBoundaryState> {
  state: ErrorBoundaryState = { failed: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { failed: true };
  }

  componentDidCatch(error: Error): void {
    console.error('Haraya: the page crashed', error);
    reportError(error, 'render');
  }

  render(): React.ReactNode {
    if (!this.state.failed) return this.props.children;
    return (
      <div className="min-h-screen bg-canvas text-ink font-sans flex items-center justify-center px-4">
        <div role="alert" className="w-full max-w-sm rounded-card bg-surface ios-card-shadow p-5 space-y-3 text-center">
          <h1 className="ios-title">Something went wrong</h1>
          <p className="text-[15px] text-ink-2">
            Haraya hit a problem drawing this page. Your saved spots and passport are safe. Reloading usually fixes it.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="w-full h-11 rounded-full bg-tint text-surface text-[15px] font-semibold ios-press"
          >
            Reload Haraya
          </button>
          <button
            onClick={() => {
              window.location.hash = '#/tab/feed';
              window.location.reload();
            }}
            className="w-full h-11 rounded-full ios-fill text-tint-ink text-[15px] font-semibold ios-press"
          >
            Go to Discover
          </button>
        </div>
      </div>
    );
  }
}
