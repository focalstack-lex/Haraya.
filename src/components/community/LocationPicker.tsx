import React, { useEffect, useRef, useState } from 'react';
import { TILE_URL, TILE_OPTIONS } from '../map/tiles';
import L from 'leaflet';
import { LocateFixed } from 'lucide-react';
import { watchBestFix, type Fix } from '../../utils/bestFix';
import { fixQuality, formatAccuracy, GOOD_FIX_M, REFINE_WINDOW_MS } from '../../utils/locationQuality';

interface LocationPickerProps {
  lat: number | null;
  lng: number | null;
  onChange: (point: { lat: number; lng: number }) => void;
}

const DAVAO_CENTER: [number, number] = [7.07, 125.61];

/**
 * Pin placement for Add a Spot: tap the map, or use the device location. The location is read on tap and only
 * fills this form; it is not stored anywhere else. The phone's first answer is often a network fix a kilometre or
 * more wide, so the button listens for the GPS to tighten it (watchBestFix) and moves the pin as it does. A
 * town-wide guess never moves the pin: a spot pinned in the wrong city is worse than none. A tap on the map
 * stops the listening, so the visitor's own pin always wins.
 */
export const LocationPicker: React.FC<LocationPickerProps> = ({ lat, lng, onChange }) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const [locating, setLocating] = useState(false);
  const [locateError, setLocateError] = useState('');
  /** Set when the pin came from a fix too wide to trust as the entrance. */
  const [locateNote, setLocateNote] = useState('');
  const cancelFix = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!canvasRef.current || mapRef.current) return;
    const map = L.map(canvasRef.current, { center: DAVAO_CENTER, zoom: 12, zoomControl: true, scrollWheelZoom: false });
    L.tileLayer(TILE_URL, TILE_OPTIONS).addTo(map);
    map.on('click', (event: L.LeafletMouseEvent) => {
      cancelFix.current?.();
      cancelFix.current = null;
      setLocating(false);
      setLocateNote('');
      onChangeRef.current({ lat: event.latlng.lat, lng: event.latlng.lng });
    });
    mapRef.current = map;
    return () => {
      cancelFix.current?.();
      cancelFix.current = null;
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, []);

  // Keep the pin in sync with the form value
  useEffect(() => {
    const map = mapRef.current;
    if (!map || lat === null || lng === null) return;
    const point: [number, number] = [lat, lng];
    if (!markerRef.current) {
      markerRef.current = L.marker(point, {
        icon: L.divIcon({
          className: 'haraya-map-pin-container',
          html: '<div style="width:28px;height:28px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:#906D4B;border:3px solid #FFFDF9;box-shadow:0 4px 10px rgba(19,25,31,.35);"></div>',
          iconSize: [28, 28],
          iconAnchor: [14, 28],
        }),
      }).addTo(map);
    } else {
      markerRef.current.setLatLng(point);
    }
    map.panTo(point);
  }, [lat, lng]);

  const useMyLocation = () => {
    if (!('geolocation' in navigator)) {
      setLocateError('This browser cannot share a location. Tap the map instead.');
      return;
    }
    cancelFix.current?.();
    setLocating(true);
    setLocateError('');
    setLocateNote('');
    const place = (fix: Fix) => {
      onChangeRef.current({ lat: fix.lat, lng: fix.lng });
      mapRef.current?.setView([fix.lat, fix.lng], fixQuality(fix.accuracy) === 'precise' ? 17 : 15);
    };
    cancelFix.current = watchBestFix({
      highAccuracy: true,
      maximumAgeMs: 30_000,
      timeoutMs: 15_000,
      windowMs: REFINE_WINDOW_MS,
      isGoodEnough: (fix) => fix.accuracy <= GOOD_FIX_M,
      onFix: (fix) => {
        if (fixQuality(fix.accuracy) !== 'rough') place(fix);
      },
      onSettled: (fix) => {
        cancelFix.current = null;
        setLocating(false);
        const quality = fixQuality(fix.accuracy);
        if (quality === 'rough') {
          setLocateError(`Your location is only a rough guess (${formatAccuracy(fix.accuracy)}). Tap the map where the entrance is.`);
        } else if (quality === 'approximate') {
          setLocateNote(`Your location is only accurate to ${formatAccuracy(fix.accuracy)}. Check the pin and tap the map where the entrance is.`);
        }
      },
      onError: (failure) => {
        cancelFix.current = null;
        setLocating(false);
        console.warn('Haraya: add a spot location error', failure);
        setLocateError(
          failure === 'denied'
            ? 'Location is off for this site. Tap the map to place the pin.'
            : 'Could not get your location. Tap the map to place the pin.'
        );
      },
    });
  };

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={useMyLocation}
        disabled={locating}
        className="h-11 w-full sm:w-auto px-4 rounded-full ios-fill text-[15px] font-semibold text-tint-ink inline-flex items-center justify-center gap-2 hover:bg-shade/20 disabled:opacity-50 ios-press"
      >
        <LocateFixed className="w-4 h-4" />
        {locating ? 'Finding you' : 'Use my current location'}
      </button>
      <div className="relative isolate rounded-row overflow-hidden ios-card-shadow">
        <div ref={canvasRef} className="h-56 sm:h-64 z-0" role="application" aria-label="Tap to place the spot on the map" />
      </div>
      <p className="ios-footnote text-ink-2">
        {lat !== null && lng !== null ? (
          <>
            Pin set at <span className="font-mono">{lat.toFixed(5)}, {lng.toFixed(5)}</span>. Tap the map to move it.
          </>
        ) : (
          'Tap the map where the entrance is.'
        )}
      </p>
      {locateNote && <p className="ios-footnote text-ink">{locateNote}</p>}
      {locateError && <p className="ios-footnote text-danger">{locateError}</p>}
    </div>
  );
};
