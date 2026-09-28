import React, { useEffect, useMemo, useRef, useState } from 'react';
import L from 'leaflet';
import { ChevronRight, LocateFixed, Minus, Navigation, Plus, X } from 'lucide-react';
import type { Cafe, Trail } from '../../types/coffee';
import { mockTrails } from '../../data/mockTrails';
import { distanceKm, directionsUrl, formatKm, trailLengthKm, walkMinutes } from '../../utils/geo';
import { isOpenNow } from '../../utils/calendar';
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
    <span className="h-9 w-9 rounded-full ios-material-bar shadow-[0_1px_2px_rgba(19,25,31,0.12),0_4px_12px_-4px_rgba(19,25,31,0.25)] flex items-center justify-center text-[#7D5C3D]">
      {children}
    </span>
  </button>
);

interface DavaoCoffeeMapProps {
  cafes: Cafe[];
  onSelectCafe: (cafeId: string) => void;
  selectedCity: string;
}

/**
 * Interactive Davao coffee map: pins for every venue, curated trail overlays,
 * and hop-by-hop distance. Leaflet is imported imperatively so the map canvas
 * only mounts on this view.
 */
export const DavaoCoffeeMap: React.FC<DavaoCoffeeMapProps> = ({ cafes, onSelectCafe, selectedCity }) => {
  const mapRef = useRef<L.Map | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const [activeTrail, setActiveTrail] = useState<Trail | null>(null);

  const trailsWithCafes = useMemo(
    () =>
      mockTrails
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
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: 'OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);
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
    } else {
      map.setView(DAVAO_CENTER, REGION_ZOOM);
    }

    return () => {
      layer.remove();
    };
  }, [activeTrail, trailsWithCafes]);

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
      <LargeTitle title="Coffee Map" subtitle={`Specialty pins across the region. Showing ${selectedCity}.`} />

      <div className="grid lg:grid-cols-3 gap-4 lg:gap-6">
        {/* Map canvas */}
        <div className="lg:col-span-2 space-y-3">
          <div className="relative isolate rounded-[20px] overflow-hidden ios-card-shadow bg-[#FFFDF9]">
            <div
              ref={canvasRef}
              className="h-[380px] sm:h-[460px] lg:h-[520px] z-0"
              role="application"
              aria-label="Interactive map of Davao specialty cafes"
            />
            {/* Floating controls, Apple Maps style */}
            <div className="absolute top-1.5 right-1.5 z-[500] flex flex-col">
              <MapControl label="Zoom in" onClick={() => zoomBy(1)}>
                <Plus className="w-4.5 h-4.5" strokeWidth={2.25} />
              </MapControl>
              <MapControl label="Zoom out" onClick={() => zoomBy(-1)}>
                <Minus className="w-4.5 h-4.5" strokeWidth={2.25} />
              </MapControl>
              <MapControl label={activeTrail ? 'Fit trail in view' : 'Recenter on Davao Region'} onClick={recenter}>
                <LocateFixed className="w-4.5 h-4.5" strokeWidth={2} />
              </MapControl>
            </div>
          </div>

          {activeTrail && (
            <div className="ios-group ios-card-shadow flex items-start justify-between gap-3 pl-4 pr-1 py-2">
              <div className="min-w-0 py-1.5">
                <h3 className="ios-headline text-[#13191F] truncate">{activeTrail.name}</h3>
                <p className="ios-footnote text-[#594C3D] line-clamp-2 mt-0.5">{activeTrail.description}</p>
              </div>
              <button
                onClick={() => {
                  setActiveTrail(null);
                }}
                aria-label="Clear trail"
                className="h-11 w-11 shrink-0 flex items-center justify-center ios-press"
              >
                <span className="h-7.5 w-7.5 rounded-full bg-[#766046]/15 flex items-center justify-center text-[#594C3D]">
                  <X className="w-4 h-4" strokeWidth={2.5} />
                </span>
              </button>
            </div>
          )}
        </div>

        {/* Side column: curated trails, then every venue on the map */}
        <div className="space-y-6 min-w-0">
          <section className="space-y-3" aria-labelledby="map-trails-title">
            <h2 id="map-trails-title" className="ios-title px-1">Curated trails</h2>
            {trailsWithCafes.map(({ trail, stops }) => {
              const totalKm = trailLengthKm(stops);
              const isActive = activeTrail?.id === trail.id;
              return (
                <article
                  key={trail.id}
                  className={`rounded-[20px] bg-[#FFFDF9] p-4 space-y-2 ${
                    isActive ? 'shadow-[0_0_0_2px_#906D4B,0_6px_20px_-6px_rgba(19,25,31,0.14)]' : 'ios-card-shadow'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="ios-headline text-[#13191F]">{trail.name}</h3>
                    <span className="ios-footnote font-mono text-[#594C3D] shrink-0">{stops.length} stops</span>
                  </div>
                  <p className="text-[14px] leading-[1.45] text-[#594C3D]">{trail.description}</p>
                  <p className="ios-footnote font-mono font-medium text-[#7D5C3D]">
                    {formatKm(totalKm)} total, about {walkMinutes(totalKm)} min walk
                  </p>

                  {/* Stops as an inset list on a fill, hop distance trailing */}
                  <ol className="rounded-[14px] overflow-hidden bg-[#766046]/[0.07]">
                    {stops.map((cafe, index) => {
                      const hop = stopDistance(trail, index);
                      return (
                        <li key={cafe.id} className={index > 0 ? 'ios-hairline-t' : ''}>
                          <button
                            onClick={() => onSelectCafe(cafe.id)}
                            className="w-full min-h-11 flex items-center gap-2.5 px-3 py-2 text-left ios-press"
                          >
                            <span className="h-5 w-5 shrink-0 rounded-full bg-[#906D4B] text-[#FFFDF9] text-[11px] font-semibold font-mono flex items-center justify-center">
                              {index + 1}
                            </span>
                            <span className="flex-1 min-w-0 truncate text-[14px] font-medium text-[#13191F]">{cafe.name}</span>
                            {hop !== null && <span className="shrink-0 ios-footnote font-mono text-[#594C3D]">{formatKm(hop)}</span>}
                            <ChevronRight className="w-4 h-4 shrink-0 text-[#6E6150]/60" />
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
                        isActive ? 'ios-fill text-[#7D5C3D] hover:bg-[#766046]/20' : 'bg-[#906D4B] text-[#FFFDF9] hover:bg-[#7D5C3D]'
                      }`}
                    >
                      {isActive ? 'Hide on map' : 'Show on map'}
                    </button>
                    <a
                      href={directionsUrl(stops.map((cafe) => ({ lat: cafe.lat, lng: cafe.lng })))}
                      target="_blank"
                      rel="noreferrer"
                      className="h-11 flex-1 px-4 rounded-full ios-fill text-[15px] font-semibold text-[#7D5C3D] hover:bg-[#766046]/20 inline-flex items-center justify-center gap-1.5 ios-press"
                    >
                      <Navigation className="w-4 h-4" />
                      Directions
                    </a>
                  </div>
                </article>
              );
            })}
          </section>

          <section className="space-y-2" aria-labelledby="map-venues-title">
            <h2 id="map-venues-title" className="px-4 text-[13px] text-[#594C3D]">
              On the map <span className="font-mono">({cafes.length})</span>
            </h2>
            {cafes.length === 0 ? (
              <p className="ios-group px-4 py-3 text-[14px] text-[#594C3D]">No venues in this city yet.</p>
            ) : (
              <ul className="ios-group ios-card-shadow">
                {cafes.map((cafe) => {
                  const openNow = isOpenNow(cafe.hours);
                  return (
                    <li key={cafe.id}>
                      <button onClick={() => onSelectCafe(cafe.id)} className="ios-group-row !px-3">
                        <img
                          src={cafe.images[0]}
                          alt=""
                          loading="lazy"
                          className="h-11 w-11 shrink-0 rounded-[10px] object-cover bg-[#13191F]"
                        />
                        <span className="flex-1 min-w-0">
                          <span className="block ios-headline text-[#13191F] truncate">{cafe.name}</span>
                          <span className="block ios-footnote text-[#594C3D] truncate">
                            {cafe.district}, {cafe.city}
                            <span className={`ml-1.5 font-medium ${openNow ? 'text-[#3E5C48]' : 'text-[#8C3A2E]'}`}>
                              {openNow ? 'Open' : 'Closed'}
                            </span>
                          </span>
                        </span>
                        <ChevronRight className="w-4 h-4 shrink-0 text-[#6E6150]/60" />
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
