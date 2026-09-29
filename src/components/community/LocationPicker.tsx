import React, { useEffect, useRef, useState } from 'react';
import { TILE_URL, TILE_OPTIONS } from '../map/tiles';
import L from 'leaflet';
import { LocateFixed } from 'lucide-react';

interface LocationPickerProps {
  lat: number | null;
  lng: number | null;
  onChange: (point: { lat: number; lng: number }) => void;
}

const DAVAO_CENTER: [number, number] = [7.07, 125.61];

/**
 * Pin placement for Add a Spot: tap the map, or use the device location. The location is read once on
 * tap and only fills this form; it is not stored anywhere else.
 */
export const LocationPicker: React.FC<LocationPickerProps> = ({ lat, lng, onChange }) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const [locating, setLocating] = useState(false);
  const [locateError, setLocateError] = useState('');

  useEffect(() => {
    if (!canvasRef.current || mapRef.current) return;
    const map = L.map(canvasRef.current, { center: DAVAO_CENTER, zoom: 12, zoomControl: true, scrollWheelZoom: false });
    L.tileLayer(TILE_URL, TILE_OPTIONS).addTo(map);
    map.on('click', (event: L.LeafletMouseEvent) => onChangeRef.current({ lat: event.latlng.lat, lng: event.latlng.lng }));
    mapRef.current = map;
    return () => {
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
    setLocating(true);
    setLocateError('');
    navigator.geolocation.getCurrentPosition(
      (fix) => {
        setLocating(false);
        onChangeRef.current({ lat: fix.coords.latitude, lng: fix.coords.longitude });
        mapRef.current?.setView([fix.coords.latitude, fix.coords.longitude], 17);
      },
      (error) => {
        setLocating(false);
        console.warn('Haraya: add a spot location error', error.code, error.message);
        setLocateError(
          error.code === error.PERMISSION_DENIED
            ? 'Location is off for this site. Tap the map to place the pin.'
            : 'Could not get your location. Tap the map to place the pin.'
        );
      },
      { enableHighAccuracy: true, timeout: 15_000, maximumAge: 30_000 }
    );
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
      <div className="relative isolate rounded-[16px] overflow-hidden ios-card-shadow">
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
      {locateError && <p className="ios-footnote text-danger">{locateError}</p>}
    </div>
  );
};
