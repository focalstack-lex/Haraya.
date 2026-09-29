import React, { useEffect, useMemo, useRef, useState } from 'react';
import { TILE_URL, TILE_OPTIONS } from './tiles';
import L from 'leaflet';
import { ChevronRight, Crosshair, LocateFixed, Minus, Navigation, Plus, X } from 'lucide-react';
import type { Cafe, Trail } from '../../types/coffee';
import { curatedTrails } from '../../data/trails';
import { distanceKm, directionsUrl, formatKm, trailLengthKm, walkMinutes } from '../../utils/geo';
import { useLiveNavigation } from './useLiveNavigation';
import { formatRemaining } from './liveNavMath';
import { progressAlongRoute, routeMinutesLeft, routeProgress } from './routeMath';
import { ROUTE_ATTRIBUTION, useWalkingRoute } from './walkingRoute';
import { externalMapLinks } from './DirectionsActionSheet';
import { AyaMascot } from '../common/AyaMascot';
import { isOpenNow, hasListedHours } from '../../utils/calendar';
import { LargeTitle } from '../common/LargeTitle';

const DAVAO_CENTER: [number, number] = [7.19, 125.55];
const REGION_ZOOM = 9;
const CITY_ZOOM = 12;

const HTML_ESCAPES: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

/** Escapes catalog text before it is placed into Leaflet tooltip HTML. */
const escapeHtml = (value: string): string => value.replace(/[&<>"']/g, (char) => HTML_ESCAPES[char] ?? char);

/** Floating map control: a round bar-material button inside a 44px hit area. */
const MapControl: React.FC<{ label: string; onClick: () => void; children: React.ReactNode }> = ({ label, onClick, children }) => (
  <button type="button" onClick={onClick} aria-label={label} className="h-11 w-11 flex items-center justify-center ios-press">
    <span className="h-9 w-9 rounded-full ios-material-bar shadow-[0_1px_2px_rgba(19,25,31,0.12),0_4px_12px_-4px_rgba(19,25,31,0.25)] flex items-center justify-center text-tint-ink">
      {children}
    </span>
  </button>
);

interface DavaoCoffeeMapProps {
  cafes: Cafe[];
  onSelectCafe: (cafeId: string) => void;
  selectedCity: string;
  /** Destination of live walking navigation started from the directions sheet, or null. */
  navTarget?: Cafe | null;
  onEndNavigation?: () => void;
  /** Opens the geofenced check-in for the spot just reached. */
  onCheckIn?: (cafe: Cafe) => void;
}

/**
 * Interactive Davao coffee map: pins for every venue, curated trail overlays,
 * and hop-by-hop distance. Leaflet is imported imperatively so the map canvas
 * only mounts on this view.
 */
export const DavaoCoffeeMap: React.FC<DavaoCoffeeMapProps> = ({ cafes, onSelectCafe, selectedCity, navTarget = null, onEndNavigation, onCheckIn }) => {
  const mapRef = useRef<L.Map | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const [activeTrail, setActiveTrail] = useState<Trail | null>(null);
  const lastTrailIdRef = useRef<string | null>(null);
  const nav = useLiveNavigation();
  const [followMe, setFollowMe] = useState(true);
  const navLayers = useRef<{ you: L.Marker; accuracy: L.Circle; casing: L.Polyline; line: L.Polyline } | null>(null);
  const framedFirstFix = useRef(false);
  const framedRoute = useRef(false);
  const walk = useWalkingRoute(navTarget, nav.position);
  // Along the streets once a route is in; the straight line only as a fallback
  const along = useMemo(
    () => (walk.route && nav.position ? progressAlongRoute(walk.route.points, nav.position) : null),
    [walk.route, nav.position]
  );
  const remainingKm = along ? along.remainingKm : nav.remainingKm;
  const minutesLeft = along ? routeMinutesLeft(along.remainingKm) : nav.minutesLeft;
  const progress = along && walk.totalKm !== null ? routeProgress(walk.totalKm, along.remainingKm) : nav.progress;

  const trailsWithCafes = useMemo(
    () =>
      curatedTrails
        .map((trail) => ({
          trail,
          stops: trail.cafeIds
            .map((id) => cafes.find((cafe) => cafe.id === id))
            .filter((cafe): cafe is Cafe => Boolean(cafe)),
        }))
        .filter((entry) => entry.stops.length >= 2),
    [cafes]
  );

  useEffect(() => {
    if (!canvasRef.current || mapRef.current) return;

    const map = L.map(canvasRef.current, {
      center: DAVAO_CENTER,
      zoom: REGION_ZOOM,
      scrollWheelZoom: false,
      zoomControl: false,
      attributionControl: true,
    });
    L.tileLayer(TILE_URL, TILE_OPTIONS).addTo(map);
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Pins: rebuilt whenever the cafe set or trail changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const layer = L.layerGroup().addTo(map);

    const showLabels = map.getZoom() >= CITY_ZOOM;
    if (!showLabels) {
      const container = map.getContainer();
      container.classList.add('haraya-map-far');
    } else {
      const container = map.getContainer();
      container.classList.remove('haraya-map-far');
    }

    for (const cafe of cafes) {
      const isTrailStop = activeTrail?.cafeIds.includes(cafe.id) ?? false;
      const marker = L.marker([cafe.lat, cafe.lng], {
        icon: L.divIcon({
          className: 'haraya-map-pin-container',
          html: `<div style="display:flex;flex-direction:column;align-items:center;">
            <div style="width:26px;height:26px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:${isTrailStop ? '#906D4B' : '#13191F'};border:2.5px solid #FFFDF9;box-shadow:0 1px 2px rgba(19,25,31,.2),0 4px 10px rgba(19,25,31,.3);"></div>
          </div>`,
          iconSize: [26, 26],
          iconAnchor: [13, 26],
        }),
      }).addTo(layer);
      // The pin is a keyboard-focusable role=button with no text; name it for screen readers
      marker.getElement()?.setAttribute('aria-label', `${cafe.name}, ${cafe.district}, ${cafe.city}`);
      marker.bindTooltip(
        `<strong>${escapeHtml(cafe.name)}</strong><br/>${escapeHtml(`${cafe.district}, ${cafe.city}`)}${cafe.isRoastery ? ', Roastery' : ''}`,
        { direction: 'top', offset: [0, -24] }
      );
      marker.on('click', () => onSelectCafe(cafe.id));
    }

    // Recompute label visibility on zoom
    const onZoom = () => {
      if (map.getZoom() >= CITY_ZOOM) map.getContainer().classList.remove('haraya-map-far');
      else map.getContainer().classList.add('haraya-map-far');
    };
    map.on('zoomend', onZoom);

    return () => {
      map.off('zoomend', onZoom);
      layer.remove();
    };
  }, [cafes, activeTrail, onSelectCafe]);

  // Trail polylines
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const layer = L.layerGroup().addTo(map);

    if (activeTrail) {
      const stops = trailsWithCafes.find((entry) => entry.trail.id === activeTrail.id)?.stops ?? [];
      if (stops.length >= 2) {
        L.polyline(
          stops.map((cafe) => [cafe.lat, cafe.lng] as [number, number]),
          { color: '#906D4B', weight: 3, dashArray: '6 8', opacity: 0.85 }
        ).addTo(layer);
        const bounds = L.latLngBounds(stops.map((cafe) => [cafe.lat, cafe.lng] as [number, number]));
        map.fitBounds(bounds.pad(0.25));
      }
    } else if (lastTrailIdRef.current) {
      // Only clearing a trail zooms back out; a catalog refresh (a save, a filter) keeps the visitor's view
      map.setView(DAVAO_CENTER, REGION_ZOOM);
    }
    lastTrailIdRef.current = activeTrail?.id ?? null;

    return () => {
      layer.remove();
    };
  }, [activeTrail, trailsWithCafes]);

  // Live navigation: start or stop the GPS watch when the destination changes
  const { start: startNav, stop: stopNav } = nav;
  useEffect(() => {
    framedFirstFix.current = false;
    framedRoute.current = false;
    setFollowMe(true);
    if (navTarget) startNav({ lat: navTarget.lat, lng: navTarget.lng });
    else stopNav();
  }, [navTarget, startNav, stopNav]);

  // Destination pin while navigating. Declared after the trail effect so its framing wins.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !navTarget) return;
    const layer = L.layerGroup().addTo(map);
    const target: [number, number] = [navTarget.lat, navTarget.lng];
    L.marker(target, {
      icon: L.divIcon({
        className: 'haraya-map-pin-container',
        html: '<div style="width:30px;height:30px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:#906D4B;border:3px solid #FFFDF9;box-shadow:0 1px 2px rgba(19,25,31,.2),0 6px 14px rgba(19,25,31,.35);"></div>',
        iconSize: [30, 30],
        iconAnchor: [15, 30],
      }),
      zIndexOffset: 1000,
    })
      .bindTooltip(`<strong>${escapeHtml(navTarget.name)}</strong>`, { direction: 'top', offset: [0, -28], permanent: true })
      .addTo(layer);
    map.setView(target, 16);

    // Panning the map by hand pauses Follow me until the visitor recenters
    const pauseFollow = () => setFollowMe(false);
    map.on('dragstart', pauseFollow);
    return () => {
      map.off('dragstart', pauseFollow);
      layer.remove();
      navLayers.current?.you.remove();
      navLayers.current?.accuracy.remove();
      navLayers.current?.casing.remove();
      navLayers.current?.line.remove();
      navLayers.current = null;
    };
  }, [navTarget]);

  // The visitor: pulsing dot with a heading cone, accuracy ring, and the path still ahead: the street route,
  // or a dotted straight line while no route is available
  useEffect(() => {
    const map = mapRef.current;
    const here = nav.position;
    if (!map || !navTarget || !here) return;
    const latLng: [number, number] = [here.lat, here.lng];
    const target: [number, number] = [navTarget.lat, navTarget.lng];
    const path: [number, number][] = along
      ? [latLng, ...along.ahead.map((point) => [point.lat, point.lng] as [number, number])]
      : [latLng, target];
    const lineStyle: L.PolylineOptions = along
      ? { color: '#906D4B', weight: 5, dashArray: undefined, lineCap: 'round', lineJoin: 'round', opacity: 1 }
      : { color: '#906D4B', weight: 4, dashArray: '2 10', lineCap: 'round', opacity: 0.95 };
    const cone =
      here.heading === null
        ? ''
        : `<div class="haraya-you-cone" style="transform:rotate(${Math.round(here.heading)}deg)"></div>`;
    const icon = L.divIcon({
      className: 'haraya-you-container',
      html: `<div class="haraya-you">${cone}<div class="haraya-you-pulse"></div><div class="haraya-you-dot"></div></div>`,
      iconSize: [22, 22],
      iconAnchor: [11, 11],
    });

    if (!navLayers.current) {
      navLayers.current = {
        accuracy: L.circle(latLng, { radius: here.accuracy, color: '#2F6FDB', weight: 1, opacity: 0.35, fillOpacity: 0.08 }).addTo(map),
        casing: L.polyline(path, { color: '#FFFDF9', weight: 9, lineCap: 'round', lineJoin: 'round', opacity: along ? 0.9 : 0 }).addTo(map),
        line: L.polyline(path, lineStyle).addTo(map),
        you: L.marker(latLng, { icon, keyboard: false, zIndexOffset: 1100 }).addTo(map),
      };
    } else {
      navLayers.current.accuracy.setLatLng(latLng).setRadius(here.accuracy);
      navLayers.current.casing.setLatLngs(path).setStyle({ opacity: along ? 0.9 : 0 });
      navLayers.current.line.setLatLngs(path).setStyle(lineStyle);
      navLayers.current.you.setLatLng(latLng).setIcon(icon);
    }

    if (!framedFirstFix.current) {
      framedFirstFix.current = true;
      map.fitBounds(L.latLngBounds([latLng, target]).pad(0.35), { maxZoom: 17 });
    } else if (along && !framedRoute.current) {
      // Streets can bend away from the straight line: frame the whole route once it arrives
      framedRoute.current = true;
      map.fitBounds(L.latLngBounds(path).pad(0.2), { maxZoom: 17 });
    } else if (followMe) {
      map.panTo(latLng, { animate: true });
    }
  }, [nav.position, navTarget, followMe, along]);

  // Credit the router while its route is on screen
  const routeShown = walk.status === 'ready';
  useEffect(() => {
    const control = mapRef.current?.attributionControl;
    if (!control || !routeShown) return;
    control.addAttribution(ROUTE_ATTRIBUTION);
    return () => {
      control.removeAttribution(ROUTE_ATTRIBUTION);
    };
  }, [routeShown]);

  const recenterOnMe = () => {
    const map = mapRef.current;
    setFollowMe(true);
    if (map && nav.position) map.setView([nav.position.lat, nav.position.lng], Math.max(map.getZoom(), 16));
  };


  const stopDistance = (trail: Trail, index: number): number | null => {
    const stops = trailsWithCafes.find((entry) => entry.trail.id === trail.id)?.stops ?? [];
    if (index === 0 || index >= stops.length) return null;
    return distanceKm(stops[index - 1], stops[index]);
  };

  const zoomBy = (delta: number) => {
    const map = mapRef.current;
    if (!map) return;
    if (delta > 0) map.zoomIn();
    else map.zoomOut();
  };

  // Recenter: back to the active trail's bounds, or the whole region
  const recenter = () => {
    const map = mapRef.current;
    if (!map) return;
    const stops = activeTrail ? trailsWithCafes.find((entry) => entry.trail.id === activeTrail.id)?.stops ?? [] : [];
    if (stops.length >= 2) {
      map.fitBounds(L.latLngBounds(stops.map((cafe) => [cafe.lat, cafe.lng] as [number, number])).pad(0.25));
    } else {
      map.setView(DAVAO_CENTER, REGION_ZOOM);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-1 pb-6 sm:pt-4 space-y-4">
      <LargeTitle title="Map & Spots" subtitle={navTarget ? `Walking to ${navTarget.name}` : `Showing ${selectedCity}`} />

      <div className="grid lg:grid-cols-3 gap-4 lg:gap-6">
        {/* Map canvas. min-w-0 lets the long one-line address truncate instead of widening the grid */}
        <div className="lg:col-span-2 space-y-3 min-w-0">
          <div className="relative isolate rounded-[20px] overflow-hidden ios-card-shadow bg-surface">
            <div
              ref={canvasRef}
              className="h-[380px] sm:h-[460px] lg:h-[520px] z-0"
              role="application"
              aria-label="Interactive map of Davao cafes and study spots"
            />
            {/* Navigation banner: destination, distance and time left */}
            {navTarget && remainingKm !== null && nav.status !== 'arrived' && (
              <div className="absolute top-2.5 left-2.5 right-14 z-[500] rounded-[14px] ios-material-bar shadow-[0_4px_16px_-6px_rgba(19,25,31,0.35)] px-3.5 py-2.5" aria-live="polite">
                <p className="ios-footnote text-ink-2 truncate">To {navTarget.name}</p>
                <p className="text-[17px] font-semibold text-ink">
                  <span className="font-mono">{formatRemaining(remainingKm)}</span>
                  <span className="text-ink-2 font-normal"> left, about </span>
                  <span className="font-mono">{minutesLeft}</span>
                  <span className="text-ink-2 font-normal"> min walk</span>
                </p>
              </div>
            )}
            {/* Floating controls, Apple Maps style */}
            <div className="absolute top-1.5 right-1.5 z-[500] flex flex-col">
              <MapControl label="Zoom in" onClick={() => zoomBy(1)}>
                <Plus className="w-4.5 h-4.5" strokeWidth={2.25} />
              </MapControl>
              <MapControl label="Zoom out" onClick={() => zoomBy(-1)}>
                <Minus className="w-4.5 h-4.5" strokeWidth={2.25} />
              </MapControl>
              {navTarget && nav.position ? (
                <MapControl label={followMe ? 'Following you' : 'Recenter on me'} onClick={recenterOnMe}>
                  <Crosshair className={`w-4.5 h-4.5 ${followMe ? 'text-[#2F6FDB]' : ''}`} strokeWidth={2} />
                </MapControl>
              ) : (
                <MapControl label={activeTrail ? 'Fit trail in view' : 'Recenter on Davao Region'} onClick={recenter}>
                  <LocateFixed className="w-4.5 h-4.5" strokeWidth={2} />
                </MapControl>
              )}
            </div>
          </div>

          {navTarget && (
            <div className="ios-group ios-card-shadow" aria-live="polite">
              {nav.status === 'arrived' ? (
                <div className="flex items-center gap-3 px-4 py-3.5">
                  <AyaMascot pose="welcome" size={76} alt="" className="-my-1" />
                  <div className="min-w-0 flex-1">
                    <h3 className="ios-headline text-ink">You're here</h3>
                    <p className="ios-footnote text-ink-2 truncate">{navTarget.name}, {navTarget.address}</p>
                    <div className="flex flex-wrap gap-2 pt-2">
                      {onCheckIn && (
                        <button
                          onClick={() => onCheckIn(navTarget)}
                          className="h-9 px-4 rounded-full bg-tint text-surface text-[14px] font-semibold hover:bg-tint-ink ios-press"
                        >
                          Check in
                        </button>
                      )}
                      <button
                        onClick={() => onSelectCafe(navTarget.id)}
                        className={
                          onCheckIn
                            ? 'h-9 px-4 rounded-full ios-fill text-[14px] font-semibold text-tint-ink ios-press'
                            : 'h-9 px-4 rounded-full bg-tint text-surface text-[14px] font-semibold hover:bg-tint-ink ios-press'
                        }
                      >
                        View spot
                      </button>
                      <button onClick={onEndNavigation} className="h-9 px-4 rounded-full ios-fill text-[14px] font-semibold text-tint-ink ios-press">
                        Done
                      </button>
                    </div>
                  </div>
                </div>
              ) : nav.status === 'denied' || nav.status === 'unavailable' ? (
                <div className="px-4 py-3.5 space-y-2.5">
                  <h3 className="ios-headline text-ink">
                    {nav.status === 'denied' ? 'Location is off for Haraya' : 'Your location is unavailable'}
                  </h3>
                  <p className="ios-footnote text-ink-2">
                    {nav.status === 'denied'
                      ? 'Allow location for this site in your browser settings to walk with Haraya, or open a maps app.'
                      : 'Haraya could not get a GPS fix. Try again outdoors, or open a maps app.'}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {externalMapLinks(navTarget).map((link) => (
                      <a
                        key={link.id}
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="h-9 px-3.5 rounded-full ios-fill text-[14px] font-semibold text-tint-ink inline-flex items-center ios-press"
                      >
                        {link.label}
                      </a>
                    ))}
                    <button onClick={onEndNavigation} className="h-9 px-3.5 text-[14px] font-medium text-ink-2 ios-press">
                      End
                    </button>
                  </div>
                </div>
              ) : (
                <div className="px-4 pt-3 pb-3.5 space-y-2.5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="ios-headline text-ink truncate">{navTarget.name}</h3>
                      <p className="ios-footnote text-ink-2 truncate">{navTarget.address}</p>
                    </div>
                    <button
                      onClick={onEndNavigation}
                      className="h-9 px-3.5 shrink-0 rounded-full ios-fill text-[14px] font-semibold text-danger ios-press"
                    >
                      End
                    </button>
                  </div>
                  {nav.status === 'locating' ? (
                    <p className="ios-footnote text-ink-2">Finding your location</p>
                  ) : (
                    <>
                      <div
                        className="h-2 rounded-full bg-shade/15 overflow-hidden"
                        role="progressbar"
                        aria-label="Walk progress"
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-valuenow={Math.round(progress * 100)}
                      >
                        <div className="h-full rounded-full bg-tint transition-[width] duration-500" style={{ width: `${Math.round(progress * 100)}%` }} />
                      </div>
                      <p className="ios-footnote text-ink-2">
                        <span className="font-mono">{Math.round(progress * 100)}%</span> of the walk done.{' '}
                        {walk.status === 'ready'
                          ? 'Follow the brown line along the streets.'
                          : walk.status === 'failed'
                            ? 'Street route unavailable, so this is a straight-line guide. Follow the streets you know.'
                            : 'Finding a walking route.'}
                      </p>
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTrail && (
            <div className="ios-group ios-card-shadow flex items-start justify-between gap-3 pl-4 pr-1 py-2">
              <div className="min-w-0 py-1.5">
                <h3 className="ios-headline text-ink truncate">{activeTrail.name}</h3>
                <p className="ios-footnote text-ink-2 line-clamp-2 mt-0.5">{activeTrail.description}</p>
              </div>
              <button
                onClick={() => {
                  setActiveTrail(null);
                }}
                aria-label="Clear trail"
                className="h-11 w-11 shrink-0 flex items-center justify-center ios-press"
              >
                <span className="h-7.5 w-7.5 rounded-full bg-shade/15 flex items-center justify-center text-ink-2">
                  <X className="w-4 h-4" strokeWidth={2.5} />
                </span>
              </button>
            </div>
          )}
        </div>

        {/* Side column: curated trails, then every venue on the map */}
        <div className="space-y-6 min-w-0">
          {trailsWithCafes.length > 0 && (
          <section className="space-y-3" aria-labelledby="map-trails-title">
            <h2 id="map-trails-title" className="ios-title px-1">Curated trails</h2>
            {trailsWithCafes.map(({ trail, stops }) => {
              const totalKm = trailLengthKm(stops);
              const isActive = activeTrail?.id === trail.id;
              return (
                <article
                  key={trail.id}
                  className={`rounded-[20px] bg-surface p-4 space-y-2 ${
                    isActive ? 'shadow-[0_0_0_2px_#906D4B,0_6px_20px_-6px_rgba(19,25,31,0.14)]' : 'ios-card-shadow'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="ios-headline text-ink">{trail.name}</h3>
                    <span className="ios-footnote font-mono text-ink-2 shrink-0">{stops.length} stops</span>
                  </div>
                  <p className="text-[14px] leading-[1.45] text-ink-2 line-clamp-2">{trail.description}</p>
                  <p className="ios-footnote font-mono font-medium text-tint-ink">
                    {formatKm(totalKm)} total, about {walkMinutes(totalKm)} min walk
                  </p>

                  {/* Stops as an inset list on a fill, hop distance trailing */}
                  <ol className="rounded-[14px] overflow-hidden bg-shade/[0.07]">
                    {stops.map((cafe, index) => {
                      const hop = stopDistance(trail, index);
                      return (
                        <li key={cafe.id} className={index > 0 ? 'ios-hairline-t' : ''}>
                          <button
                            onClick={() => onSelectCafe(cafe.id)}
                            className="w-full min-h-11 flex items-center gap-2.5 px-3 py-2 text-left ios-press"
                          >
                            <span className="h-5 w-5 shrink-0 rounded-full bg-tint text-surface text-[11px] font-semibold font-mono flex items-center justify-center">
                              {index + 1}
                            </span>
                            <span className="flex-1 min-w-0 truncate text-[14px] font-medium text-ink">{cafe.name}</span>
                            {hop !== null && <span className="shrink-0 ios-footnote font-mono text-ink-2">{formatKm(hop)}</span>}
                            <ChevronRight className="w-4 h-4 shrink-0 text-ink-3/60" />
                          </button>
                        </li>
                      );
                    })}
                  </ol>

                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => {
                        setActiveTrail(isActive ? null : trail);
                      }}
                      aria-pressed={isActive}
                      className={`h-11 flex-1 px-4 rounded-full text-[15px] font-semibold ios-press ${
                        isActive ? 'ios-fill text-tint-ink hover:bg-shade/20' : 'bg-tint text-surface hover:bg-tint-ink'
                      }`}
                    >
                      {isActive ? 'Hide on map' : 'Show on map'}
                    </button>
                    <a
                      href={directionsUrl(stops.map((cafe) => ({ lat: cafe.lat, lng: cafe.lng })))}
                      target="_blank"
                      rel="noreferrer"
                      className="h-11 flex-1 px-4 rounded-full ios-fill text-[15px] font-semibold text-tint-ink hover:bg-shade/20 inline-flex items-center justify-center gap-1.5 ios-press"
                    >
                      <Navigation className="w-4 h-4" />
                      Directions
                    </a>
                  </div>
                </article>
              );
            })}
          </section>
          )}

          <section className="space-y-2" aria-labelledby="map-venues-title">
            <h2 id="map-venues-title" className="px-4 text-[13px] text-ink-2">
              On the map <span className="font-mono">({cafes.length})</span>
            </h2>
            {cafes.length === 0 ? (
              <p className="ios-group px-4 py-3 text-[14px] text-ink-2">No venues in this city yet.</p>
            ) : (
              <ul className="ios-group ios-card-shadow">
                {cafes.map((cafe) => {
                  const openNow = isOpenNow(cafe.hours);
                  const hoursKnown = hasListedHours(cafe.hours);
                  return (
                    <li key={cafe.id}>
                      <button onClick={() => onSelectCafe(cafe.id)} className="ios-group-row !px-3">
                        <img
                          src={cafe.images[0]}
                          alt=""
                          loading="lazy"
                          className="h-11 w-11 shrink-0 rounded-[10px] object-cover bg-ink"
                        />
                        <span className="flex-1 min-w-0">
                          <span className="block ios-headline text-ink truncate">{cafe.name}</span>
                          <span className="block ios-footnote text-ink-2 truncate">
                            {cafe.district}, {cafe.city}
                            <span className={`ml-1.5 font-medium ${!hoursKnown ? 'text-ink-2' : openNow ? 'text-ok' : 'text-danger'}`}>
                              {!hoursKnown ? 'Hours not listed' : openNow ? 'Open' : 'Closed'}
                            </span>
                          </span>
                        </span>
                        <ChevronRight className="w-4 h-4 shrink-0 text-ink-3/60" />
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};
