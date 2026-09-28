import React, { useEffect, useMemo, useState } from 'react';
import { Check, CloudRain, LocateFixed, Loader2, Search, Shuffle, X } from 'lucide-react';
import type { Cafe } from '../../types/coffee';
import type { GeoPoint } from '../../utils/geo';
import { formatKm } from '../../utils/geo';
import { Chip, Modal, ModalHeader } from '../common/FormControls';
import { AyaMascot } from '../common/AyaMascot';
import { EMPTY_REQUEST, MOODS, MUST_HAVES, type MoodId, type MoodRequest, type MustHaveId } from './moods';
import { interpretRequest } from './parseQuery';
import { scoreCafes, type Match, type Weather } from './scoreCafes';
import { useLocation } from './useLocation';
import { fetchWeather } from './weather';
import { loadMoodPrefs, saveMoodPrefs } from './moodStorage';
import { MoodResultCard } from './MoodResultCard';

interface MoodFinderSheetProps {
  isOpen: boolean;
  initialMood: MoodId | null;
  cafes: Cafe[];
  /** Fallback distance origin when location is off: the chosen city's center. */
  cityOrigin: GeoPoint;
  cityLabel: string;
  savedIds: string[];
  recentIds: string[];
  onClose: () => void;
  onOpenCafe: (cafeId: string) => void;
  onToggleSave: (cafe: Cafe) => void;
  onRoute: (cafe: Cafe, origin: GeoPoint | null) => void;
}

const PRICE_LABEL: Record<1 | 2 | 3, string> = { 1: 'Budget', 2: 'Up to mid-range', 3: 'Any price' };
const mustHaveLabel = (id: MustHaveId) => MUST_HAVES.find((item) => item.id === id)?.label ?? id;

const SectionLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <h3 className="px-1 text-[13px] font-medium text-[#594C3D]">{children}</h3>
);

/** The mood finder: say how you feel and what you need, get three explained picks and a route. */
export const MoodFinderSheet: React.FC<MoodFinderSheetProps> = ({
  isOpen,
  initialMood,
  cafes,
  cityOrigin,
  cityLabel,
  savedIds,
  recentIds,
  onClose,
  onOpenCafe,
  onToggleSave,
  onRoute,
}) => {
  const [request, setRequest] = useState<MoodRequest>(EMPTY_REQUEST);
  const [text, setText] = useState('');
  const [parseNote, setParseNote] = useState<string | null>(null);
  const [weather, setWeather] = useState<Weather | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [surprise, setSurprise] = useState<Match | null>(null);
  const location = useLocation();

  // Fresh state each time the sheet opens, with remembered must-haves
  useEffect(() => {
    if (!isOpen) return;
    setRequest({ ...EMPTY_REQUEST, mood: initialMood, mustHaves: loadMoodPrefs() });
    setText('');
    setParseNote(null);
    setShowAll(false);
    setSurprise(null);
    let active = true;
    fetchWeather().then((value) => {
      if (active) setWeather(value);
    });
    return () => {
      active = false;
    };
  }, [isOpen, initialMood]);

  const update = (next: MoodRequest) => {
    setRequest(next);
    setSurprise(null);
    setShowAll(false);
    saveMoodPrefs(next.mustHaves);
  };

  const toggleMustHave = (id: MustHaveId) =>
    update({
      ...request,
      mustHaves: request.mustHaves.includes(id) ? request.mustHaves.filter((other) => other !== id) : [...request.mustHaves, id],
    });

  const applyText = async (event: React.FormEvent) => {
    event.preventDefault();
    const parsed = await interpretRequest(text);
    if (Object.keys(parsed).length === 0) {
      setParseNote('Tap a mood or must-have to refine.');
      return;
    }
    setParseNote(null);
    update({
      mood: parsed.mood ?? request.mood,
      mustHaves: [...new Set([...request.mustHaves, ...(parsed.mustHaves ?? [])])],
      maxPrice: parsed.maxPrice ?? request.maxPrice,
      district: parsed.district ?? request.district,
    });
  };

  const origin = location.position ?? cityOrigin;
  const hasAsk = Boolean(request.mood || request.mustHaves.length || request.maxPrice || request.district);

  const result = useMemo(
    () =>
      scoreCafes(cafes, request, {
        origin,
        now: new Date(),
        weather,
        savedIds,
        recentIds,
      }),
    [cafes, request, origin, weather, savedIds, recentIds]
  );

  const { relax } = result;
  const pickedIds = new Set(result.picks.map((pick) => pick.match.cafe.id));
  const surpriseMe = () => {
    const pool = result.matches.filter((match) => !pickedIds.has(match.cafe.id) && match.cafe.id !== surprise?.cafe.id);
    if (pool.length === 0) return;
    setSurprise(pool[Math.floor(Math.random() * pool.length)]);
  };

  const routeTo = (match: Match) => onRoute(match.cafe, location.position);

  const renderCard = (label: string, match: Match) => (
    <MoodResultCard
      key={`${label}-${match.cafe.id}`}
      label={label}
      match={match}
      saved={savedIds.includes(match.cafe.id)}
      onRoute={() => routeTo(match)}
      onOpen={() => onOpenCafe(match.cafe.id)}
      onToggleSave={() => onToggleSave(match.cafe)}
    />
  );

  const locationLine = (() => {
    switch (location.status) {
      case 'granted':
        return 'Using your location';
      case 'locating':
        return 'Finding you...';
      case 'denied':
        return `Location is off. Distances from ${cityLabel} center.`;
      case 'unavailable':
        return `Location unavailable. Distances from ${cityLabel} center.`;
      default:
        return `Distances from ${cityLabel} center`;
    }
  })();

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="sm:max-w-2xl" labelledBy="mood-finder-title">
      <ModalHeader title="Find your cafe" subtitle="By mood, needs and distance" onClose={onClose} />

      <div className="px-4 sm:px-6 py-4 space-y-5">
        {/* Describe it */}
        <form onSubmit={applyText} className="space-y-1.5">
          <div className="flex items-center gap-2">
            <label className="flex-1 flex items-center ios-fill rounded-[12px] h-11 px-3 focus-within:shadow-[0_0_0_1.5px_rgba(144,109,75,0.6)] transition-shadow">
              <Search className="w-[18px] h-[18px] text-[#6E6150] shrink-0 mr-2" strokeWidth={2.2} />
              <input
                value={text}
                onChange={(event) => setText(event.target.value)}
                enterKeyHint="search"
                placeholder="Describe it: quiet place to study near Matina"
                aria-label="Describe the cafe you want"
                className="w-full min-w-0 bg-transparent text-[15px] text-[#13191F] placeholder:text-[#6E6150] focus:outline-none"
              />
            </label>
            <button
              type="submit"
              disabled={!text.trim()}
              className="h-11 px-4 rounded-full bg-[#906D4B] text-[#FFFDF9] text-[15px] font-semibold hover:bg-[#7D5C3D] disabled:opacity-40 ios-press"
            >
              Go
            </button>
          </div>
          {parseNote && <p className="px-1 ios-footnote text-[#594C3D]">{parseNote}</p>}
        </form>

        {/* Mood */}
        <section className="space-y-2">
          <SectionLabel>How are you feeling?</SectionLabel>
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Mood">
            {MOODS.map((mood) => (
              <Chip
                key={mood.id}
                label={mood.label}
                active={request.mood === mood.id}
                onClick={() => update({ ...request, mood: request.mood === mood.id ? null : mood.id })}
              />
            ))}
          </div>
          {request.mood && (
            <p className="px-1 ios-footnote text-[#594C3D]">{MOODS.find((mood) => mood.id === request.mood)?.hint}</p>
          )}
        </section>

        {/* Must-haves */}
        <section className="space-y-2">
          <SectionLabel>Must have</SectionLabel>
          <div className="flex flex-wrap gap-2">
            {MUST_HAVES.map((item) => (
              <Chip
                key={item.id}
                label={item.label}
                active={request.mustHaves.includes(item.id)}
                onClick={() => toggleMustHave(item.id)}
              />
            ))}
          </div>
          {(request.district || request.maxPrice) && (
            <div className="flex flex-wrap gap-2 pt-1">
              {request.district && (
                <button
                  onClick={() => update({ ...request, district: null })}
                  className="h-8 pl-3 pr-2 rounded-full bg-[#906D4B] text-[#FFFDF9] text-[13px] font-medium inline-flex items-center gap-1 ios-press"
                  aria-label={`Remove area ${request.district}`}
                >
                  In {request.district}
                  <X className="w-3.5 h-3.5" strokeWidth={2.5} />
                </button>
              )}
              {request.maxPrice && (
                <button
                  onClick={() => update({ ...request, maxPrice: null })}
                  className="h-8 pl-3 pr-2 rounded-full bg-[#906D4B] text-[#FFFDF9] text-[13px] font-medium inline-flex items-center gap-1 ios-press"
                  aria-label="Remove price limit"
                >
                  {PRICE_LABEL[request.maxPrice]}
                  <X className="w-3.5 h-3.5" strokeWidth={2.5} />
                </button>
              )}
            </div>
          )}
        </section>

        {/* Where, and the weather */}
        <section className="ios-group bg-[#FAF5EB]">
          <div className="ios-group-row">
            <LocateFixed className="w-4.5 h-4.5 shrink-0 text-[#906D4B]" />
            <span className="flex-1 min-w-0 text-[14px] text-[#13191F]" aria-live="polite">
              {locationLine}
            </span>
            {location.status === 'granted' ? (
              <Check className="w-5 h-5 text-[#3E5C48]" aria-hidden="true" />
            ) : (
              <button
                onClick={location.request}
                disabled={location.status === 'locating'}
                className="h-9 px-3.5 rounded-full ios-fill text-[14px] font-semibold text-[#7D5C3D] inline-flex items-center gap-1.5 ios-press disabled:opacity-60"
              >
                {location.status === 'locating' && <Loader2 className="w-4 h-4 animate-spin" />}
                Near me
              </button>
            )}
          </div>
          {weather && (
            <div className="ios-group-row">
              <CloudRain className="w-4.5 h-4.5 shrink-0 text-[#906D4B]" />
              <span className="flex-1 min-w-0 text-[14px] text-[#13191F]">
                {weather.summary}
                {weather.rainy ? ', leaning cozy and indoor' : weather.hot ? ', leaning air-con' : ''}
              </span>
            </div>
          )}
        </section>

        {/* Results */}
        <section aria-labelledby="mood-results-title" aria-live="polite" className="space-y-3">
          <h3 id="mood-results-title" className="ios-title text-[19px] px-1">
            {hasAsk ? (result.matches.length > 0 ? 'Your picks' : 'No exact match') : 'Pick a mood to start'}
          </h3>

          {!hasAsk && (
            <div className="flex justify-center py-2">
              <AyaMascot pose="mood" size={128} alt="Aya, the Haraya mascot, dreaming up a cafe" />
            </div>
          )}

          {hasAsk && result.matches.length === 0 && (
            <div className="bg-[#FAF5EB] rounded-[20px] px-4 py-5 text-center space-y-3">
              <AyaMascot pose="empty" size={88} alt="" />
              <p className="text-[14px] text-[#594C3D]">
                {relax
                  ? `Nothing matches ${request.mustHaves.map(mustHaveLabel).join(' and ')}. ${relax.count} ${
                      relax.count === 1 ? 'cafe matches' : 'cafes match'
                    } without ${mustHaveLabel(relax.mustHave)}.`
                  : 'No cafe fits all of that. Try another mood, or remove the area or price limit.'}
              </p>
              {relax && (
                <button
                  onClick={() => toggleMustHave(relax.mustHave)}
                  className="h-11 px-5 rounded-full bg-[#906D4B] text-[#FFFDF9] text-[15px] font-semibold hover:bg-[#7D5C3D] ios-press"
                >
                  Drop {mustHaveLabel(relax.mustHave)}
                </button>
              )}
            </div>
          )}

          {hasAsk && result.picks.map((pick) => renderCard(pick.label, pick.match))}
          {hasAsk && surprise && renderCard('Surprise', surprise)}

          {hasAsk && result.matches.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 pt-1">
              {result.matches.length > result.picks.length && (
                <button
                  onClick={surpriseMe}
                  className="h-10 px-4 rounded-full ios-fill text-[14px] font-semibold text-[#7D5C3D] inline-flex items-center gap-1.5 hover:bg-[#766046]/20 ios-press"
                >
                  <Shuffle className="w-4 h-4" />
                  Surprise me
                </button>
              )}
              <button
                onClick={() => setShowAll((value) => !value)}
                aria-expanded={showAll}
                className="h-10 px-4 rounded-full ios-fill text-[14px] font-semibold text-[#7D5C3D] hover:bg-[#766046]/20 ios-press"
              >
                {showAll ? 'Hide full list' : `Show all ${result.matches.length} ${result.matches.length === 1 ? 'match' : 'matches'}`}
              </button>
            </div>
          )}

          {hasAsk && showAll && (
            <div className="ios-group bg-[#FAF5EB]">
              {result.matches.map((match, index) => (
                <button key={match.cafe.id} onClick={() => onOpenCafe(match.cafe.id)} className="ios-group-row">
                  <span className="w-6 text-[13px] font-mono text-[#594C3D]">{index + 1}</span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-[15px] text-[#13191F] truncate">{match.cafe.name}</span>
                    <span className="block ios-footnote text-[#594C3D] truncate">{match.reasons.join(', ')}</span>
                  </span>
                  <span className="text-[13px] font-mono text-[#594C3D] shrink-0">{formatKm(match.km)}</span>
                </button>
              ))}
            </div>
          )}
        </section>
      </div>
    </Modal>
  );
};
