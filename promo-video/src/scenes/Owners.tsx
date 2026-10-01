import React from 'react';
import { AbsoluteFill, Img, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { BadgeCheck, Bookmark, ImagePlus, ShieldCheck } from 'lucide-react';
import { SCENES, STATS_COUNT_FRAMES } from '../timeline';
import { color, gradient } from '../theme';
import { fontFamily } from '../fonts';
import { Words } from '../components/Words';
import { Cursor } from '../components/Cursor';
import { CafeIllustration } from '../components/CafeIllustration';
import { Chip, GlassCard, Place } from '../components/ui';
import { exitEase, glideEase, iosEase, mix, pop, progress, riseEase } from '../lib/motion';

const B = SCENES.owners.beats;

/** The owner editor, built at app pixels (390 wide) and scaled; anchored by its center. */
const EDITOR = { width: 390, scale: 1.55, x: 1300, y: 612 };
const EDITOR_HEIGHT = 470;
const editorPoint = (x: number, y: number) => ({
  x: EDITOR.x + (x - EDITOR.width / 2) * EDITOR.scale,
  y: EDITOR.y + (y - EDITOR_HEIGHT / 2) * EDITOR.scale,
});

/** Amenity chips use the app's own labels (AMENITY_LABELS in src/types/coffee.ts). */
const AMENITY_ROWS = [
  ['Fast WiFi', 'Plugs at Seats', 'Quiet Focus'],
  ['Air-Conditioned', 'Outdoor Garden'],
];
/** Chip centers in app pixels, for the cursor: first row, first and second chip. */
const WIFI = editorPoint(18 + 44, 236);
const PLUGS = editorPoint(18 + 88 + 8 + 62, 236);
const ADD_PHOTO = editorPoint(18 + 56, 392);

/** A demo listing, so every number here reads as a sample and never as a real shop's figures. */
const STATS = [
  { label: 'Views', value: 1240, decimals: 0 },
  { label: 'Saves', value: 96, decimals: 0 },
  { label: 'Check-ins, 30 days', value: 38, decimals: 0 },
  { label: 'Focus hours, 30 days', value: 52.5, decimals: 1 },
];

const HOURS = ['Monday', 'Tuesday', 'Wednesday'];

/** The listing card is 200 by about 232 app pixels; at the end it sits centered at this point and scale. */
const CARD = { width: 200, height: 232 };
const FINAL = { x: 960, y: 660, scale: 2.2 };
/** The permit shield pins to the card's top right corner. */
const SHIELD = { x: FINAL.x + (CARD.width / 2) * FINAL.scale - 10, y: FINAL.y - (CARD.height / 2) * FINAL.scale + 10 };

const Check: React.FC = () => (
  <span style={{ width: 20, height: 20, borderRadius: 5, background: color.tint, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
    <svg width="12" height="12" viewBox="0 0 12 12">
      <path d="M2.5 6.2l2.3 2.3 4.7-5" stroke={color.surface} strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  </span>
);

const TimeField: React.FC<{ value: string }> = ({ value }) => (
  <span style={{ height: 32, width: 78, borderRadius: 10, background: color.fill, fontSize: 14, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontVariantNumeric: 'tabular-nums' }}>
    {value}
  </span>
);

const Label: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ fontSize: 13, fontWeight: 500, color: color.ink2, padding: '0 4px', margin: '16px 0 8px' }}>{children}</div>
);

/** The app's cafe card for the demo listing, with the no-photo placeholder until a photo is added. */
const ListingCard: React.FC<{ photo: number; badge: number }> = ({ photo, badge }) => (
  <GlassCard width={CARD.width} style={{ fontFamily }}>
    <div style={{ position: 'relative', height: 150, overflow: 'hidden' }}>
      <Img src={staticFile('placeholders/no-photo.svg')} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
      <div style={{ position: 'absolute', inset: 0, opacity: photo }}>
        <CafeIllustration width={200} height={150} />
      </div>
      <span style={{ position: 'absolute', right: 8, top: 8, width: 28, height: 28, borderRadius: 14, background: 'rgba(19, 25, 31, 0.36)', color: color.surface, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Bookmark size={14} strokeWidth={2.2} />
      </span>
    </div>
    <div style={{ padding: '10px 12px 12px' }}>
      <div style={{ fontSize: 15, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5 }}>
        Your Cafe
        <span style={{ display: 'inline-flex', color: color.tint, transform: `scale(${badge})`, opacity: Math.min(1, badge * 2) }}>
          <BadgeCheck size={16} strokeWidth={2.2} />
        </span>
      </div>
      <div style={{ fontSize: 13, color: color.ink2, marginTop: 2 }}>Davao Region</div>
      <div style={{ fontSize: 13, color: color.ok, marginTop: 4 }}>Open now</div>
    </div>
  </GlassCard>
);

/** 0:54 Dark. For owners: a verified listing, details they control, their numbers, and the permit check. */
export const Owners: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const listingIn = pop(frame, B.listing, fps, 150, 16);
  const badge = pop(frame, B.badge, fps, 260, 11);
  const toSide = progress(frame, B.editor - 6, 44, iosEase);
  const editorIn = progress(frame, B.editor, 50, riseEase);
  const editorOut = progress(frame, B.stats - 10, 24, exitEase);
  const statsIn = progress(frame, B.stats, 30, riseEase);
  const statsOut = progress(frame, B.permit - 8, 22, exitEase);
  const count = progress(frame, B.stats + 8, STATS_COUNT_FRAMES, glideEase);
  const toCenter = progress(frame, B.permit - 8, 44, iosEase);
  const shield = pop(frame, B.permit + 14, fps, 220, 12);
  const wifiOn = progress(frame, B.wifi + 1, 8);
  const plugsOn = progress(frame, B.plugs + 1, 8);
  const photoIn = progress(frame, B.photo + 6, 18, riseEase);
  const out = progress(frame, B.out, 26, exitEase);
  const burst = progress(frame, B.badge, 30);

  const cardX = toCenter > 0 ? mix(560, FINAL.x, toCenter) : mix(960, 560, toSide);
  const cardScale = toCenter > 0 ? mix(2.05, FINAL.scale, toCenter) : mix(2.35, 2.05, toSide);
  const cardY = toCenter > 0 ? mix(612, FINAL.y, toCenter) : 612;

  const headline = (text: string, inAt: number, outAt: number | undefined, size = 84, y = 150) => (
    <Place x={960} y={y}>
      <Words text={text} at={inAt} exitAt={outAt} size={size} color={color.surface} accentFill={gradient.onDark} maxWidth={1640} style={{ whiteSpace: size > 80 ? 'nowrap' : undefined }} />
    </Place>
  );

  return (
    <AbsoluteFill style={{ opacity: 1 - out, filter: out > 0 ? `blur(${out * 10}px)` : undefined }}>
      {headline('Own a cafe or *study spot?*', B.question, B.listing - 12, 112, 520)}
      {headline('Get a *verified listing.*', B.listing, B.editor - 10)}
      {headline('Update hours, Wi-Fi and plugs *any time.*', B.editor, B.stats - 10, 76)}
      {headline('See your views, saves *and check-ins.*', B.stats, B.permit - 10, 80)}
      {headline('We check the permit number *before a listing goes live.*', B.permit, undefined, 76, 176)}

      {frame >= B.listing && (
        <Place x={cardX} y={cardY} scale={cardScale * (0.6 + 0.4 * listingIn)} opacity={Math.min(1, listingIn * 2)}>
          <div style={{ position: 'relative' }}>
            <ListingCard photo={photoIn} badge={badge} />
            {/* A ring and three steam sparks as the verified badge lands */}
            {burst > 0 && burst < 1 && (
              <div style={{ position: 'absolute', left: 100, top: 172, width: 0, height: 0 }}>
                <div style={{ position: 'absolute', left: -mix(8, 30, burst), top: -mix(8, 30, burst), width: mix(16, 60, burst), height: mix(16, 60, burst), borderRadius: '50%', border: `2px solid ${color.steam}`, opacity: 1 - burst }} />
              </div>
            )}
          </div>
        </Place>
      )}

      {/* The owner editor tilts up beside the listing */}
      {frame >= B.editor && editorOut < 1 && (
        <AbsoluteFill style={{ perspective: 1600 }}>
          <Place x={EDITOR.x} y={EDITOR.y} scale={EDITOR.scale} opacity={editorIn * (1 - editorOut)}>
            <div style={{ transform: `translateX(${(1 - editorIn) * 180}px) rotateY(${(1 - editorIn) * -32}deg) translateY(${editorOut * 60}px)`, transformOrigin: '0% 50%' }}>
              <GlassCard width={EDITOR.width} style={{ padding: '2px 18px 18px', height: EDITOR_HEIGHT }}>
                <Label>Opening hours</Label>
                <div style={{ borderRadius: 14, background: color.canvas, overflow: 'hidden' }}>
                  {HOURS.map((day, index) => (
                    <div key={day} style={{ height: 44, display: 'flex', alignItems: 'center', gap: 10, padding: '0 12px', boxShadow: index > 0 ? `inset 0 0.5px 0 ${color.separator}` : undefined }}>
                      <Check />
                      <span style={{ fontSize: 15, flex: 1 }}>{day}</span>
                      <TimeField value="07:00" />
                      <span style={{ fontSize: 12, color: color.ink2 }}>to</span>
                      <TimeField value="22:00" />
                    </div>
                  ))}
                </div>
                <Label>Amenities</Label>
                <div style={{ display: 'grid', gap: 8 }}>
                  {AMENITY_ROWS.map((row) => (
                    <div key={row.join()} style={{ display: 'flex', gap: 8 }}>
                      {row.map((amenity) => (
                        <Chip key={amenity} label={amenity} height={32} size={14} on={amenity === 'Fast WiFi' ? wifiOn : amenity === 'Plugs at Seats' ? plugsOn : 0} />
                      ))}
                    </div>
                  ))}
                </div>
                <Label>Photos</Label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                  {[0, 1, 2].map((slot) => {
                    const photoHere = slot === 0 && photoIn > 0;
                    const addHere = slot === (photoIn > 0 ? 1 : 0);
                    return (
                      <div key={slot} style={{ position: 'relative', aspectRatio: '1', borderRadius: 14, overflow: 'hidden', background: addHere || photoHere ? color.fill : 'transparent' }}>
                        {addHere && (
                          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, color: color.tintInk, fontSize: 13, fontWeight: 600 }}>
                            <ImagePlus size={20} />
                            Add photo
                          </div>
                        )}
                        {photoHere && (
                          <div style={{ position: 'absolute', inset: 0, opacity: photoIn, transform: `scale(${mix(0.7, 1, photoIn)})` }}>
                            <CafeIllustration width={112} height={112} />
                            <span style={{ position: 'absolute', left: 6, bottom: 6, height: 20, padding: '0 8px', borderRadius: 10, background: 'rgba(19, 25, 31, 0.36)', color: color.surface, fontSize: 11, fontWeight: 600, display: 'flex', alignItems: 'center' }}>
                              Cover
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </GlassCard>
            </div>
          </Place>
        </AbsoluteFill>
      )}

      {/* Listing numbers, the tiles an owner sees for their place */}
      {frame >= B.stats && statsOut < 1 && (
        <Place x={EDITOR.x} y={EDITOR.y} scale={1.9} opacity={statsIn * (1 - statsOut)}>
          <div style={{ transform: `translateY(${(1 - statsIn) * 40}px)` }}>
            <GlassCard width={364} style={{ padding: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {STATS.map((stat) => (
                  <div key={stat.label} style={{ borderRadius: 14, background: color.fill, padding: '10px 14px' }}>
                    <div style={{ fontSize: 12, color: color.ink2 }}>{stat.label}</div>
                    <div style={{ fontSize: 22, fontWeight: 600, marginTop: 2, fontVariantNumeric: 'tabular-nums' }}>
                      {(stat.value * count).toLocaleString('en-PH', { minimumFractionDigits: stat.decimals, maximumFractionDigits: stat.decimals })}
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>
          </div>
        </Place>
      )}

      {/* The permit check: Haraya reviews every place before it goes live */}
      {frame >= B.permit && (
        <Place x={SHIELD.x} y={SHIELD.y} scale={0.5 + 0.5 * shield} opacity={Math.min(1, shield * 2)}>
          <div style={{ width: 132, height: 132, borderRadius: 66, background: color.tint, color: color.surface, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 24px 50px -16px rgba(0, 0, 0, 0.55)', border: `6px solid ${color.surface}` }}>
            <ShieldCheck size={64} strokeWidth={2} />
          </div>
        </Place>
      )}

      <Cursor
        keys={[
          { at: B.wifi - 44, x: 1800, y: 1180 },
          { at: B.wifi - 10, x: WIFI.x, y: WIFI.y },
          { at: B.plugs - 10, x: PLUGS.x, y: PLUGS.y },
          { at: B.photo - 12, x: ADD_PHOTO.x, y: ADD_PHOTO.y },
          { at: B.photo + 34, x: ADD_PHOTO.x + 70, y: ADD_PHOTO.y + 80 },
          { at: B.stats, x: 1820, y: 1180 },
        ]}
        taps={[B.wifi, B.plugs, B.photo]}
        hideAt={B.stats - 14}
      />
    </AbsoluteFill>
  );
};
