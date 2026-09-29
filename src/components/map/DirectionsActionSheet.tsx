import React from 'react';
import { ChevronRight, ExternalLink, Navigation } from 'lucide-react';
import type { Cafe } from '../../types/coffee';
import { Modal, ModalHeader } from '../common/FormControls';
import { directionsUrl } from '../../utils/geo';

interface DirectionsActionSheetProps {
  cafe: Cafe | null;
  onClose: () => void;
  /** Starts live walking navigation inside Haraya. */
  onNavigateInApp: (cafe: Cafe) => void;
}

/** External map apps. Apple Maps uses its https form so the link also works outside Apple devices. */
export const externalMapLinks = (cafe: Pick<Cafe, 'lat' | 'lng'>) => [
  { id: 'google', label: 'Google Maps', href: directionsUrl([{ lat: cafe.lat, lng: cafe.lng }]) },
  { id: 'apple', label: 'Apple Maps', href: `https://maps.apple.com/?daddr=${cafe.lat},${cafe.lng}&dirflg=w` },
  { id: 'waze', label: 'Waze', href: `https://waze.com/ul?ll=${cafe.lat},${cafe.lng}&navigate=yes` },
];

const ROW = 'ios-group-row ios-press min-h-12 text-left';

/** Asks how to get there: walk with Haraya's live map, or hand off to a maps app. */
export const DirectionsActionSheet: React.FC<DirectionsActionSheetProps> = ({ cafe, onClose, onNavigateInApp }) => {
  if (!cafe) return null;
  return (
    <Modal isOpen={Boolean(cafe)} onClose={onClose} maxWidth="sm:max-w-md" labelledBy="directions-title">
      <ModalHeader title="Get directions" subtitle={cafe.name} onClose={onClose} />
      <div className="px-4 sm:px-6 py-4 space-y-4">
        <div className="ios-group bg-canvas">
          <button onClick={() => onNavigateInApp(cafe)} className={ROW}>
            <span className="h-8 w-8 shrink-0 rounded-[9px] bg-tint text-surface flex items-center justify-center">
              <Navigation className="w-4 h-4" />
            </span>
            <span className="flex-1 min-w-0">
              <span className="block ios-headline text-ink">Navigate in Haraya</span>
              <span className="block ios-footnote text-ink-2">Live walking guide on the map, uses your location</span>
            </span>
            <ChevronRight className="w-4 h-4 shrink-0 text-ink-3" strokeWidth={2.5} />
          </button>
        </div>

        <div className="space-y-1.5">
          <h3 className="px-4 text-[13px] text-ink-2">Open in another app</h3>
          <div className="ios-group bg-canvas">
            {externalMapLinks(cafe).map((link) => (
              <a key={link.id} href={link.href} target="_blank" rel="noopener noreferrer" onClick={onClose} className={ROW}>
                <span className="flex-1 text-[15px] text-ink">{link.label}</span>
                <ExternalLink className="w-4 h-4 shrink-0 text-ink-3" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
};
