import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { TILE_URL, TILE_OPTIONS } from './tiles';
import L from 'leaflet';
import { ChevronRight, Crosshair, Footprints, LocateFixed, Map as MapIcon, Minus, Navigation, Plus, WifiOff, X } from 'lucide-react';
import type { Cafe, Trail } from '../../types/coffee';
import { curatedTrails } from '../../data/trails';
import { distanceKm, directionsUrl, formatKm, trailLengthKm, walkMinutes, type GeoPoint } from '../../utils/geo';
import { useOnline } from '../../hooks/useOnline';
import { useLocation } from '../moodFinder/useLocation';
import { NEARBY_RADIUS_KM, splitByDistance, type SpotDistance } from './nearby';
import {
  CLUSTER_RADIUS_PX,
  PHOTO_PIN_PX,
  PHOTO_PIN_TIP_PX,
  PIN_STATUS_LABELS,
  UNCLUSTER_ZOOM,
  clusterByPixels,
  escapeHtml,
  photoPinHtml,
  photoStackHtml,
  pinStatus,
  spotPhoto,
  type PinStatus,
} from './mapPins';
import { MAP_FILTERS, matchesMapFilters, type MapFilterId } from './mapFilters';
import { MapPreviewCard } from './MapPreviewCard';
import { useLiveNavigation } from './useLiveNavigation';
import { formatRemaining } from './liveNavMath';
import { progressAlongRoute, routeMinutesLeft, routeProgress } from './routeMath';
import { ROUTE_ATTRIBUTION, useWalkingRoute } from './walkingRoute';
import { externalMapLinks } from './DirectionsActionSheet';
import { AyaMascot } from '../common/AyaMascot';
import { routeLoadPhase } from './routeLoadPhase';
import { RouteLoader, useHeldPhase } from './RouteLoader';
import { Chip } from '../common/FormControls';
import { LocationHelp } from '../common/LocationHelp';
import { LargeTitle } from '../common/LargeTitle';

const DAVAO_CENTER: [number, number] = [7.19, 125.55];
const REGION_ZOOM = 9;
const CITY_ZOOM = 12;

/** Floating map control: a round bar-material button inside a 44px hit area. */
const MapControl: React.FC<{ label: string; onClick: () => void; children: React.ReactNode }> = ({ label, onClick, children }) => (
  <button type="button" onClick={onClick} aria-label={label} className="h-11 w-11 flex items-center justify-center ios-press">
    <span className="h-9 w-9 rounded-full ios-material-bar shadow-[0_1px_2px_rgba(19,25,31,0.12),0_4px_12px_-4px_rgba(19,25,31,0.25)] flex items-center justify-center text-tint-ink">
      {children}
    </span>
  </button>
);

const STATUS_TEXT_COLORS: Record<PinStatus, string> = {
  open: 'text-[#3E5C48]',
  closed: 'text-[#8C3A2E]',
  unknown: 'text-[#594C3D]',
};

interface RowHandlers {
  /** Shows the spot on the map with its preview card. */
  onPick: (cafe: Cafe) => void;
  /** Lights up the spot's pin while the pointer or focus is on its row. */
  onHover: (cafeId: string | null) => void;
  activeId: string | null;
}

/** One venue in the side list: photo, name, area, open status and, once the visitor is located, how far it is. */
const VenueRow: React.FC<RowHandlers & { cafe: Cafe; km?: number }> = ({ cafe, km, onPick, onHover, activeId }) => {
  const status = pinStatus(cafe.hours);
  const active = activeId === cafe.id;
  return (
    <li>
      <button
        onClick={() => onPick(cafe)}
        onMouseEnter={() => onHover(cafe.id)}
        onMouseLeave={() => onHover(null)}
        onFocus={() => onHover(cafe.id)}
        onBlur={() => onHover(null)}
        aria-current={active || undefined}
        className={`ios-group-row !px-3 ${active ? 'bg-[#766046]/[0.08]' : ''}`}
      >
        <img src={cafe.images[0]} alt="" loading="lazy" className="h-11 w-11 shrink-0 rounded-[10px] object-cover bg-[#13191F]" />
        <span className="flex-1 min-w-0">
          <span className="block ios-headline text-[#13191F] truncate">{cafe.name}</span>
          <span className="block ios-footnote text-[#594C3D] truncate">
            {cafe.district}, {cafe.city}
            <span className={`ml-1.5 font-medium ${STATUS_TEXT_COLORS[status]}`}>{PIN_STATUS_LABELS[status]}</span>
          </span>
        </span>
        {km !== undefined && (
          <span className="shrink-0 text-right ios-footnote text-[#594C3D]">
            <span className="block font-mono">{formatKm(km)}</span>
            {km <= NEARBY_RADIUS_KM && (
              <span className="flex items-center justify-end gap-0.5" aria-label={`${walkMinutes(km)} minute walk`}>
                <Footprints className="w-3 h-3" aria-hidden="true" />
                <span className="font-mono">{walkMinutes(km)}</span> min
              </span>
            )}
          </span>
        )}
        <ChevronRight className="w-4 h-4 shrink-0 text-[#6E6150]/60" />
      </button>
    </li>
  );
};

const VenueList: React.FC<RowHandlers & { entries: SpotDistance<Cafe>[] }> = ({ entries, ...handlers }) => (
  <ul className="ios-group ios-card-shadow">
    {entries.map(({ spot, km }) => (
      <VenueRow key={spot.id} cafe={spot} km={km} {...handlers} />
    ))}
  </ul>
);

const prefersReducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

const ZOOM_KEY = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.userAgent) ? '⌘' : 'Ctrl';

/**
 * Tiles drawn 1px larger than their grid cell so neighbours overlap. Without it, a display or page scale that puts
 * tile edges on fractional pixels (125%, 150%, a zoomed page) leaves hairline gaps between tiles.
 */
const SeamlessTileLayer = L.TileLayer.extend({
  _initTile(this: L.TileLayer, tile: HTMLElement) {
    (L.TileLayer.prototype as unknown as { _initTile: (tile: HTMLElement) => void })._initTile.call(this, tile);
    const size = this.getTileSize();
    tile.style.width = `${size.x + 1}px`;
    tile.style.height = `${size.y + 1}px`;
  },
}) as unknown as typeof L.TileLayer;

interface DavaoCoffeeMapProps {
  cafes: Cafe[];
  onSelectCafe: (cafeId: string) => void;
  /** Opens the directions picker (walk with Haraya or a maps app) from a pin's preview card. */
  onDirections?: (cafe: Cafe) => void;
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
export const DavaoCoffeeMap: React.FC<DavaoCoffeeMapProps> = ({
  cafes,
  onSelectCafe,
  onDirections,
  selectedCity,
  navTarget = null,
  onEndNavigation,
  onCheckIn,
}) => {
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
  // The first wait of a walk (GPS fix, then the street route): Aya stands in for the numbers until they are real
  const loadPhase = useHeldPhase(routeLoadPhase(Boolean(navTarget), nav.status, Boolean(nav.position), walk.status));
  const remainingKm = along ? along.remainingKm : nav.remainingKm;
  const minutesLeft = along ? routeMinutesLeft(along.remainingKm) : nav.minutesLeft;
  const progress = along && walk.totalKm !== null ? routeProgress(walk.totalKm, along.remainingKm) : nav.progress;
  const online = useOnline();
  // A fresh GPS fix every time: the nearby list is only as good as the position, and after a walk or a tap on
  // "near me" the visitor may have moved
  const { position: myPosition, status: locationStatus, request: requestLocation } = useLocation({ maximumAgeMs: 0, highAccuracy: true });
  const framedNearbyFix = useRef<GeoPoint | null>(null);
  const [filters, setFilters] = useState<ReadonlySet<MapFilterId>>(() => new Set());
  const visibleCafes = useMemo(
    () => (filters.size === 0 ? cafes : cafes.filter((cafe) => matchesMapFilters(cafe, filters))),
    [cafes, filters]
  );
  const ranked = useMemo(() => (myPosition ? splitByDistance(visibleCafes, myPosition) : null), [visibleCafes, myPosition]);
  // Live navigation owns the map while walking; the nearby view comes back once the walk ends
  const showNearby = ranked !== null && !navTarget;
  const [zoom, setZoom] = useState(REGION_ZOOM);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [hoverId, setHoverId] = useState<string | null>(null);
  const [wheelHint, setWheelHint] = useState(false);
  const wheelHintTimer = useRef<number | undefined>(undefined);
  // A filter can hide the previewed spot; the card comes back if the filter is cleared
  const previewCafe = previewId && !navTarget ? visibleCafes.find((cafe) => cafe.id === previewId) ?? null : null;
  /** Spot id to the marker that shows it: its own pin, or the bubble it is clustered into. */
  const markersRef = useRef(new Map<string, L.Marker>());
  const highlight = useRef<{ preview: string | null; hover: string | null }>({ preview: null, hover: null });

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

    const canvas = canvasRef.current;
    const map = L.map(canvas, {
      center: DAVAO_CENTER,
      zoom: REGION_ZOOM,
      scrollWheelZoom: true,
      zoomControl: false,
      attributionControl: true,
    });
    new SeamlessTileLayer(TILE_URL, TILE_OPTIONS).addTo(map);
    // Clusters depend on the zoom; a tap on bare map closes the preview card
    map.on('zoomend', () => setZoom(map.getZoom()));
    map.on('click', () => setPreviewId(null));
    mapRef.current = map;

    // Wheel over the map, Google Maps style: Ctrl or ⌘ + scroll (and a trackpad pinch, which arrives as Ctrl +
    // wheel) zooms the map instead of the whole page; a plain scroll keeps scrolling the page and shows a hint.
    // Stopping the plain wheel on the way down means Leaflet's own wheel zoom never sees it.
    const onWheel = (event: WheelEvent) => {
      if (event.ctrlKey || event.metaKey) return;
      event.stopPropagation();
      setWheelHint(true);
      window.clearTimeout(wheelHintTimer.current);
      wheelHintTimer.current = window.setTimeout(() => setWheelHint(false), 1200);
    };
    canvas.addEventListener('wheel', onWheel, { capture: true, passive: true });

    return () => {
      canvas.removeEventListener('wheel', onWheel, { capture: true });
      window.clearTimeout(wheelHintTimer.current);
      map.remove();
      mapRef.current = null;
    };
  }, []);

  /** Grows the pin (or bubble) of the previewed spot and the one whose list row is hovered. */
  const paintHighlight = useCallback(() => {
    const lit = new Set<L.Marker>();
    for (const id of [highlight.current.preview, highlight.current.hover]) {
      const marker = id ? markersRef.current.get(id) : undefined;
      if (marker) lit.add(marker);
    }
    for (const marker of new Set(markersRef.current.values())) {
      marker.getElement()?.classList.toggle('haraya-pin-active', lit.has(marker));
      marker.setZIndexOffset(lit.has(marker) ? 900 : 0);
    }
  }, []);

  // Pins: each spot's profile picture, rebuilt when the visible spots, the trail or the zoom changes.
  // Pins that would overlap on screen merge into a stack of their pictures; a tap on it zooms in to split them.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    map.getContainer().classList.toggle('haraya-map-far', zoom < CITY_ZOOM);

    const layer = L.layerGroup().addTo(map);
    const markers = new Map<string, L.Marker>();
    const stopIds = new Set(activeTrail?.cafeIds ?? []);
    // While a trail is shown, the spots off the trail step back
    const offTrail = (cafe: Cafe) => activeTrail !== null && !stopIds.has(cafe.id);

    const addPin = (cafe: Cafe) => {
      const marker = L.marker([cafe.lat, cafe.lng], {
        icon: L.divIcon({
          className: 'haraya-map-pin-container',
          html: photoPinHtml(spotPhoto(cafe), offTrail(cafe)),
          iconSize: [PHOTO_PIN_PX, PHOTO_PIN_TIP_PX],
          iconAnchor: [PHOTO_PIN_PX / 2, PHOTO_PIN_TIP_PX],
        }),
      }).addTo(layer);
      // The pin is a keyboard-focusable role=button with no text; name it for screen readers
      marker.getElement()?.setAttribute('aria-label', `${cafe.name}, ${cafe.district}, ${cafe.city}`);
      marker.bindTooltip(
        `<strong>${escapeHtml(cafe.name)}</strong><br/>${escapeHtml(`${cafe.district}, ${cafe.city}`)}${cafe.isRoastery ? ', Roastery' : ''}`,
        { direction: 'top', offset: [0, -PHOTO_PIN_TIP_PX] }
      );
      marker.on('click', () => setPreviewId(cafe.id));
      markers.set(cafe.id, marker);
    };

    // The walk's destination has its own large pin; trail stops always stand alone so the route reads stop by stop
    const pinned = navTarget ? visibleCafes.filter((cafe) => cafe.id !== navTarget.id) : visibleCafes;
    const loose = pinned.filter((cafe) => !stopIds.has(cafe.id));
    pinned.filter((cafe) => stopIds.has(cafe.id)).forEach(addPin);

    const radius = zoom >= UNCLUSTER_ZOOM ? 0 : CLUSTER_RADIUS_PX;
    for (const { members } of clusterByPixels(loose, (cafe) => map.project([cafe.lat, cafe.lng], zoom), radius)) {
      if (members.length === 1) {
        addPin(members[0]);
        continue;
      }
      const bounds = L.latLngBounds(members.map((cafe) => [cafe.lat, cafe.lng] as [number, number]));
      const names = members.slice(0, 3).map((cafe) => escapeHtml(cafe.name)).join(', ');
      const stack = photoStackHtml(members.map(spotPhoto), activeTrail !== null);
      const bubble = L.marker(bounds.getCenter(), {
        icon: L.divIcon({
          className: 'haraya-map-pin-container',
          html: stack.html,
          iconSize: [stack.width, stack.height],
          iconAnchor: [stack.width / 2, stack.height / 2],
        }),
      }).addTo(layer);
      bubble.getElement()?.setAttribute('aria-label', `${members.length} spots in this area. Show each one`);
      bubble.bindTooltip(`${names}${members.length > 3 ? ` and ${members.length - 3} more` : ''}`, {
        direction: 'top',
        offset: [0, -stack.height / 2],
      });
      // Zoom far enough in that the bubble splits into its pins
      bubble.on('click', () => map.fitBounds(bounds.pad(0.3), { maxZoom: UNCLUSTER_ZOOM + 1 }));
      for (const cafe of members) markers.set(cafe.id, bubble);
    }

    markersRef.current = markers;
    paintHighlight();

    return () => {
      markersRef.current = new Map();
      layer.remove();
    };
  }, [visibleCafes, activeTrail, zoom, navTarget, paintHighlight]);

  useEffect(() => {
    highlight.current = { preview: previewCafe?.id ?? null, hover: hoverId };
    paintHighlight();
  }, [previewCafe, hoverId, paintHighlight]);

  // Escape closes the preview card
  useEffect(() => {
    if (!previewCafe) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setPreviewId(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [previewCafe]);

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
    // The destination's own photo pin, shown large; the pins layer leaves this spot out while walking
    L.marker(target, {
      icon: L.divIcon({
        className: 'haraya-map-pin-container haraya-pin-active',
        html: photoPinHtml(spotPhoto(navTarget)),
        iconSize: [PHOTO_PIN_PX, PHOTO_PIN_TIP_PX],
        iconAnchor: [PHOTO_PIN_PX / 2, PHOTO_PIN_TIP_PX],
      }),
      zIndexOffset: 1000,
    })
      .bindTooltip(`<strong>${escapeHtml(navTarget.name)}</strong>`, {
        direction: 'top',
        offset: [0, -PHOTO_PIN_TIP_PX * 1.25],
        permanent: true,
      })
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
      : // The straight-line guide waits until the street route has been tried
        { color: '#906D4B', weight: 4, dashArray: '2 10', lineCap: 'round', opacity: loadPhase ? 0 : 0.95 };
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
        // Not interactive: the dot and its pulse ring must not swallow taps on the pins under them
        you: L.marker(latLng, { icon, keyboard: false, interactive: false, zIndexOffset: 1100 }).addTo(map),
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
  }, [nav.position, navTarget, followMe, along, loadPhase]);

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

  // Find the visitor as soon as the map opens, and again when the connection comes back or a walk ends,
  // so the spots around them show up without a search. Live navigation runs its own GPS watch.
  useEffect(() => {
    if (online && !navTarget) requestLocation();
  }, [online, navTarget, requestLocation]);

  // The visitor's dot and the nearby radius. Live navigation draws its own dot, so this steps aside while walking.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !myPosition || navTarget) return;
    const center: [number, number] = [myPosition.lat, myPosition.lng];
    const layer = L.layerGroup().addTo(map);
    L.circle(center, {
      radius: NEARBY_RADIUS_KM * 1000,
      color: '#906D4B',
      weight: 1.5,
      dashArray: '4 6',
      opacity: 0.6,
      fillColor: '#906D4B',
      fillOpacity: 0.05,
      interactive: false,
    }).addTo(layer);
    L.marker(center, {
      icon: L.divIcon({
        className: 'haraya-you-container',
        html: '<div class="haraya-you"><div class="haraya-you-pulse"></div><div class="haraya-you-dot"></div></div>',
        iconSize: [22, 22],
        iconAnchor: [11, 11],
      }),
      keyboard: false,
      // Not interactive: the dot and its pulse ring must not swallow taps on the cafe pins under them
      interactive: false,
      zIndexOffset: 1100,
    }).addTo(layer);
    return () => {
      layer.remove();
    };
  }, [myPosition, navTarget]);

  // Frame each new fix once: the visitor and every spot within the radius, or the whole radius when none are.
  // A catalog refresh keeps the view; a trail or a walk keeps its own framing until it ends.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !myPosition || !ranked || navTarget || activeTrail || framedNearbyFix.current === myPosition) return;
    framedNearbyFix.current = myPosition;
    const here = L.latLng(myPosition.lat, myPosition.lng);
    const area =
      ranked.nearby.length > 0
        ? L.latLngBounds([here, ...ranked.nearby.map(({ spot }) => L.latLng(spot.lat, spot.lng))]).pad(0.2)
        : here.toBounds(NEARBY_RADIUS_KM * 2000);
    map.fitBounds(area, { maxZoom: 16 });
  }, [myPosition, ranked, navTarget, activeTrail]);

  const showNearMe = () => {
    framedNearbyFix.current = null;
    requestLocation();
  };

  const toggleFilter = (id: MapFilterId) =>
    setFilters((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  // A tapped list row: open its preview and fly the map to it, close enough that it is out of any bubble
  const focusSpot = (cafe: Cafe) => {
    setPreviewId(cafe.id);
    const map = mapRef.current;
    const canvas = canvasRef.current;
    if (!map || !canvas) return;
    const still = prefersReducedMotion();
    const target: [number, number] = [cafe.lat, cafe.lng];
    const zoomTo = Math.max(map.getZoom(), UNCLUSTER_ZOOM);
    if (still) map.setView(target, zoomTo);
    else map.flyTo(target, zoomTo, { duration: 0.6 });
    // On phones the list sits under the map: bring the map back on screen so the tap shows something
    const box = canvas.getBoundingClientRect();
    if (box.top < 0 || box.bottom > window.innerHeight) canvas.scrollIntoView({ behavior: still ? 'auto' : 'smooth', block: 'center' });
  };

  const rowHandlers: RowHandlers = { onPick: focusSpot, onHover: setHoverId, activeId: previewCafe?.id ?? null };

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
          {/* Quick filters: the pins and the list both follow them */}
          {!navTarget && (
            <div className="-mx-4 sm:mx-0">
              <div className="ios-shelf gap-2 px-4 sm:px-0 py-0.5" role="group" aria-label="Map filters">
                {MAP_FILTERS.map((filter) => (
                  <Chip key={filter.id} label={filter.label} active={filters.has(filter.id)} onClick={() => toggleFilter(filter.id)} />
                ))}
              </div>
            </div>
          )}

          <div className="relative isolate rounded-card overflow-hidden ios-card-shadow bg-surface">
            <div
              ref={canvasRef}
              className="h-[380px] sm:h-[460px] lg:h-[520px] z-0"
              role="application"
              aria-label="Interactive map of Davao cafes and study spots"
            />
            <div
              aria-hidden="true"
              className={`pointer-events-none absolute inset-0 z-[700] flex items-center justify-center bg-[#13191F]/35 transition-opacity duration-200 ${
                wheelHint ? 'opacity-100' : 'opacity-0'
              }`}
            >
              <p className="px-4 text-center text-[17px] font-semibold text-[#FFFDF9]">Use {ZOOM_KEY} + scroll to zoom the map</p>
            </div>
            {previewCafe && (
              <MapPreviewCard
                cafe={previewCafe}
                km={myPosition ? distanceKm(myPosition, previewCafe) : null}
                onView={onSelectCafe}
                onDirections={onDirections}
                onClose={() => setPreviewId(null)}
              />
            )}
            {/* Navigation banner: destination, distance and time left */}
            {navTarget && remainingKm !== null && nav.status !== 'arrived' && !loadPhase && (
              <div className="absolute top-2.5 left-2.5 right-14 z-[500] rounded-row ios-material-bar shadow-[0_4px_16px_-6px_rgba(19,25,31,0.35)] px-3.5 py-2.5" aria-live="polite">
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
                <>
                  <MapControl label="Show spots near me" onClick={showNearMe}>
                    <LocateFixed className={`w-4.5 h-4.5 ${myPosition ? 'text-[#2F6FDB]' : ''}`} strokeWidth={2} />
                  </MapControl>
                  <MapControl label={activeTrail ? 'Fit trail in view' : 'Recenter on Davao Region'} onClick={recenter}>
                    <MapIcon className="w-4.5 h-4.5" strokeWidth={2} />
                  </MapControl>
                </>
              )}
            </div>
          </div>

          {/* Why the nearby spots are not showing yet, kept small under the map */}
          {!navTarget && (!online || locationStatus !== 'idle' && locationStatus !== 'granted') && (
            <div role="status" className="ios-group flex items-center gap-2.5 px-4 py-2.5 text-[14px] leading-snug text-[#594C3D]">
              {!online ? (
                <>
                  <WifiOff className="w-4 h-4 shrink-0 text-[#7D5C3D]" strokeWidth={2} />
                  <span>You're offline. Connect to the internet and the cafes near you will show up on the map automatically.</span>
                </>
              ) : locationStatus === 'locating' ? (
                <span>Finding the cafes near you</span>
              ) : (
                (locationStatus === 'denied' || locationStatus === 'unavailable' || locationStatus === 'insecure') && (
                  <LocationHelp problem={locationStatus} onRetry={showNearMe} />
                )
              )}
            </div>
          )}

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
                  {loadPhase ? (
                    <RouteLoader phase={loadPhase} />
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
                  className={`rounded-card bg-surface p-4 space-y-2 ${
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
                  <ol className="rounded-row overflow-hidden bg-shade/[0.07]">
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

          {cafes.length > 0 && visibleCafes.length === 0 ? (
            <section className="space-y-2" aria-labelledby="map-venues-title">
              <h2 id="map-venues-title" className="px-4 text-[13px] text-ink-2">
                On the map <span className="font-mono">(0)</span>
              </h2>
              <div className="ios-group px-4 py-3 flex items-center gap-3 text-[14px] text-ink-2">
                <span className="flex-1">No spots match these filters.</span>
                <button
                  onClick={() => setFilters(new Set())}
                  className="shrink-0 h-8 px-3 rounded-full ios-fill text-[14px] font-semibold text-tint-ink ios-press"
                >
                  Clear filters
                </button>
              </div>
            </section>
          ) : showNearby ? (
            <>
              <section className="space-y-2" aria-labelledby="map-nearby-title">
                <h2 id="map-nearby-title" className="px-4 text-[13px] text-ink-2">
                  Within <span className="font-mono">{NEARBY_RADIUS_KM} km</span> of you{' '}
                  <span className="font-mono">({ranked.nearby.length})</span>
                </h2>
                {ranked.nearby.length === 0 ? (
                  <p className="ios-group px-4 py-3 text-[14px] text-ink-2">
                    No spots within {NEARBY_RADIUS_KM} km of you yet.
                    {ranked.farther.length > 0 && ` The closest is ${ranked.farther[0].spot.name}, ${formatKm(ranked.farther[0].km)} away.`}
                  </p>
                ) : (
                  <VenueList entries={ranked.nearby} {...rowHandlers} />
                )}
              </section>
              {ranked.farther.length > 0 && (
                <section className="space-y-2" aria-labelledby="map-farther-title">
                  <h2 id="map-farther-title" className="px-4 text-[13px] text-ink-2">
                    Farther away <span className="font-mono">({ranked.farther.length})</span>
                  </h2>
                  <VenueList entries={ranked.farther} {...rowHandlers} />
                </section>
              )}
            </>
          ) : (
            <section className="space-y-2" aria-labelledby="map-venues-title">
              <h2 id="map-venues-title" className="px-4 text-[13px] text-ink-2">
                On the map <span className="font-mono">({visibleCafes.length})</span>
              </h2>
              {visibleCafes.length === 0 ? (
                <p className="ios-group px-4 py-3 text-[14px] text-ink-2">No venues in this city yet.</p>
              ) : (
                <ul className="ios-group ios-card-shadow">
                  {visibleCafes.map((cafe) => (
                    <VenueRow key={cafe.id} cafe={cafe} {...rowHandlers} />
                  ))}
                </ul>
              )}
            </section>
          )}
        </div>
      </div>
    </div>
  );
};
