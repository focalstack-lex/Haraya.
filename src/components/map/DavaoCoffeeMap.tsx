import React, { useEffect, useMemo, useRef, useState } from 'react';
import L from 'leaflet';
import { Navigation, Route as RouteIcon, X } from 'lucide-react';
import type { Cafe, Trail } from '../../types/coffee';
import { mockTrails } from '../../data/mockTrails';
import { distanceKm, directionsUrl, formatKm, trailLengthKm, walkMinutes } from '../../utils/geo';

const DAVAO_CENTER: [number, number] = [7.19, 125.55];
const REGION_ZOOM = 9;
const CITY_ZOOM = 12;

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
            <div style="width:26px;height:26px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:${isTrailStop ? '#C86428' : '#1A2225'};border:2px solid #FFF9E9;box-shadow:0 2px 6px rgba(26,34,37,.4);"></div>
          </div>`,
          iconSize: [26, 26],
          iconAnchor: [13, 26],
        }),
      }).addTo(layer);
      marker.bindTooltip(
        `<strong>${cafe.name}</strong><br/>${cafe.district}, ${cafe.city}${cafe.isRoastery ? ' : Roastery' : ''}`,
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
          { color: '#C86428', weight: 3, dashArray: '6 8', opacity: 0.85 }
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-4">
      <div className="relative overflow-hidden bg-[#1A2225] text-[#FFF9E9] p-5 sm:p-8 rounded-2xl sm:rounded-3xl shadow-xl space-y-2">
        <h1 className="font-cooper text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight">Davao Coffee Map</h1>
        <p className="text-xs sm:text-sm text-[#FFF9E9]/75 max-w-2xl font-sans leading-relaxed">
          Specialty pins across Davao City, Tagum, Digos, Panabo, and Mati. Tap a pin for the venue, or walk a
          curated trail hop by hop. Showing: {selectedCity}.
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        {/* Map canvas */}
        <div className="lg:col-span-2 space-y-3">
          <div
            ref={canvasRef}
            className="h-[380px] sm:h-[460px] rounded-2xl overflow-hidden border border-[#E6DCC0] z-0"
            role="application"
            aria-label="Interactive map of Davao specialty cafes"
          />
          {activeTrail && (
            <div className="rounded-2xl bg-[#FFF9E9] border border-[#E6DCC0] p-4 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="font-cooper text-base font-bold text-[#1A2225] truncate">{activeTrail.name}</h3>
                <p className="text-[11px] font-sans text-[#55615D] line-clamp-2">{activeTrail.description}</p>
              </div>
              <button
                onClick={() => {
                  setActiveTrail(null);
                }}
                aria-label="Clear trail"
                className="h-9 w-9 shrink-0 rounded-full bg-[#F3ECD8] border border-[#E6DCC0] flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Trail cards */}
        <div className="space-y-3">
          <h2 className="inline-flex items-center gap-2 font-cooper text-lg font-bold text-[#1A2225]">
            <RouteIcon className="w-4.5 h-4.5 text-[#C86428]" />
            Curated Trails
          </h2>
          {trailsWithCafes.map(({ trail, stops }) => {
            const totalKm = trailLengthKm(stops);
            const isActive = activeTrail?.id === trail.id;
            return (
              <article
                key={trail.id}
                className={`rounded-2xl border p-4 space-y-2 transition-colors ${
                  isActive ? 'bg-[#1A2225] border-[#1A2225] text-[#FFF9E9]' : 'bg-[#FFF9E9] border-[#E6DCC0]'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className={`font-cooper text-base font-bold leading-snug ${isActive ? 'text-[#FFF9E9]' : 'text-[#1A2225]'}`}>
                    {trail.name}
                  </h3>
                  <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full shrink-0 ${
                    isActive ? 'bg-[#C86428] text-[#FFF9E9]' : 'bg-[#F3ECD8] text-[#55615D]'
                  }`}>
                    {stops.length} stops
                  </span>
                </div>
                <p className={`text-[11px] font-sans leading-relaxed ${isActive ? 'text-[#FFF9E9]/75' : 'text-[#55615D]'}`}>
                  {trail.description}
                </p>
                <p className={`text-[10px] font-sans font-semibold ${isActive ? 'text-[#FFB477]' : 'text-[#C86428]'}`}>
                  {formatKm(totalKm)} total : about {walkMinutes(totalKm)} min walk
                </p>

                <ol className="space-y-1.5 pt-1">
                  {stops.map((cafe, index) => {
                    const hop = stopDistance(trail, index);
                    return (
                      <li key={cafe.id} className="text-[11px] font-sans">
                        <button
                          onClick={() => onSelectCafe(cafe.id)}
                          className={`font-semibold hover:underline text-left ${isActive ? 'text-[#FFF9E9]' : 'text-[#1A2225]'}`}
                        >
                          {index + 1}. {cafe.name}
                        </button>
                        {hop !== null && (
                          <span className={`ml-1.5 ${isActive ? 'text-[#FFF9E9]/60' : 'text-[#55615D]'}`}>{formatKm(hop)} hop</span>
                        )}
                      </li>
                    );
                  })}
                </ol>

                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => {
                      setActiveTrail(isActive ? null : trail);
                    }}
                    className={`h-9 px-4 rounded-full text-[11px] font-bold font-sans transition-colors ${
                      isActive
                        ? 'bg-[#FFF9E9] text-[#1A2225]'
                        : 'bg-[#1A2225] text-[#FFF9E9] hover:bg-[#26302F]'
                    }`}
                  >
                    {isActive ? 'Hide on Map' : 'Show on Map'}
                  </button>
                  <a
                    href={directionsUrl(stops.map((cafe) => ({ lat: cafe.lat, lng: cafe.lng })))}
                    target="_blank"
                    rel="noreferrer"
                    className={`h-9 px-4 rounded-full text-[11px] font-bold font-sans inline-flex items-center gap-1.5 border transition-colors ${
                      isActive
                        ? 'border-[#FFF9E9]/30 text-[#FFF9E9] hover:bg-[#FFF9E9]/10'
                        : 'border-[#E6DCC0] text-[#1A2225] hover:bg-[#F3ECD8]'
                    }`}
                  >
                    <Navigation className="w-3.5 h-3.5" />
                    Directions
                  </a>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </div>
  );
};
