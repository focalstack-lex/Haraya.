import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { TOUR_STEPS } from './tourSteps';

interface GuidedTourProps {
  isOpen: boolean;
  /** Called once when the visitor finishes or skips. */
  onFinish: () => void;
}

interface Box {
  top: number;
  left: number;
  width: number;
  height: number;
}

const HOLE_PAD = 8;
const ARROW_W = 44;
const ARROW_H = 58;
const EDGE = 16;
/** Space the sticky nav bar and the bottom tab bar cover, so targets are scrolled clear of them. */
const SAFE_TOP = 72;
const SAFE_BOTTOM = 96;
const GLIDE = { type: 'spring', stiffness: 170, damping: 24, mass: 0.9 } as const;

/** The rendered, visible element for a data-tour name (phones and desktop tag different tab buttons). */
const findTarget = (name: string): HTMLElement | null => {
  const nodes = document.querySelectorAll<HTMLElement>(`[data-tour="${name}"]`);
  for (const node of nodes) {
    const rect = node.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0 && getComputedStyle(node).visibility !== 'hidden') return node;
  }
  return null;
};

const measure = (el: HTMLElement): Box => {
  const r = el.getBoundingClientRect();
  return {
    top: r.top - HOLE_PAD,
    left: r.left - HOLE_PAD,
    width: r.width + HOLE_PAD * 2,
    height: r.height + HOLE_PAD * 2,
  };
};

/** Hand-drawn guide arrow in the logo's line style, pointing down; a light halo keeps it legible on the dim layer. */
const GuideArrow: React.FC = () => (
  <svg viewBox="0 0 44 58" width={ARROW_W} height={ARROW_H} fill="none" aria-hidden="true">
    <g strokeLinecap="round" strokeLinejoin="round">
      <path d="M24 4c-9 11 4 20-2 44M12 38l10 12 11-11" stroke="#FFFDF9" strokeWidth="8" />
      <path d="M24 4c-9 11 4 20-2 44M12 38l10 12 11-11" stroke="#2D1500" strokeWidth="3.5" />
    </g>
  </svg>
);

/**
 * First-visit guided tour: dims the page around one real control at a time, a drawn arrow travels
 * to it, and a callout explains it. Steps with advance 'action' wait for a tap on the control itself.
 */
export const GuidedTour: React.FC<GuidedTourProps> = ({ isOpen, onFinish }) => {
  const reduceMotion = useReducedMotion();
  const [index, setIndex] = useState(0);
  const [box, setBox] = useState<Box | null>(null);
  const [viewport, setViewport] = useState({ w: window.innerWidth, h: window.innerHeight });
  const [calloutHeight, setCalloutHeight] = useState(150);
  const targetRef = useRef<HTMLElement | null>(null);
  const calloutRef = useRef<HTMLDivElement>(null);
  const primaryRef = useRef<HTMLButtonElement>(null);
  const finishedRef = useRef(false);

  const step = TOUR_STEPS[index];
  const isLast = index === TOUR_STEPS.length - 1;

  // The parent re-renders on every save or filter change; keep its callback in a ref so those
  // renders never re-run the step effects (which would cancel a pending advance)
  const onFinishRef = useRef(onFinish);
  onFinishRef.current = onFinish;

  const finish = useCallback(() => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    onFinishRef.current();
  }, []);

  const indexRef = useRef(index);
  indexRef.current = index;

  const next = useCallback(() => {
    if (indexRef.current >= TOUR_STEPS.length - 1) finish();
    else setIndex(indexRef.current + 1);
  }, [finish]);

  // Reset whenever the tour is opened again (replay from Profile)
  useEffect(() => {
    if (!isOpen) return;
    finishedRef.current = false;
    setIndex(0);
    setBox(null);
  }, [isOpen]);

  // Resolve the step's target, scroll it clear of the bars, then start tracking it
  useEffect(() => {
    if (!isOpen || !step) return;
    const el = findTarget(step.target);
    // Missing target, or an action already done (a saved bookmark on replay): skip the step
    if (!el || (step.advance === 'action' && el.getAttribute('aria-pressed') === 'true')) {
      next();
      return;
    }
    targetRef.current = el;
    const rect = el.getBoundingClientRect();
    const fixed = getComputedStyle(el.closest('nav, header') ?? el).position === 'fixed';
    if (!fixed && (rect.top < SAFE_TOP || rect.bottom > window.innerHeight - SAFE_BOTTOM - calloutHeight)) {
      const y = window.scrollY + rect.top - Math.max(SAFE_TOP + ARROW_H, window.innerHeight * 0.3);
      window.scrollTo({ top: Math.max(0, y), behavior: reduceMotion ? 'auto' : 'smooth' });
    }
    setBox(measure(el));
    // calloutHeight is read for the scroll offset only; re-running on its change would re-scroll
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, index]);

  // Follow the target through scrolling, resizing and rotation
  useEffect(() => {
    if (!isOpen) return;
    let frame = 0;
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        setViewport({ w: window.innerWidth, h: window.innerHeight });
        if (targetRef.current?.isConnected) setBox(measure(targetRef.current));
      });
    };
    window.addEventListener('scroll', update, { passive: true, capture: true });
    window.addEventListener('resize', update);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', update, { capture: true });
      window.removeEventListener('resize', update);
    };
  }, [isOpen]);

  // Action steps advance when the visitor taps the real control
  useEffect(() => {
    if (!isOpen || step?.advance !== 'action') return;
    const el = targetRef.current;
    if (!el) return;
    let timer = 0;
    const onTap = () => {
      timer = window.setTimeout(next, 350);
    };
    el.addEventListener('click', onTap);
    return () => {
      el.removeEventListener('click', onTap);
      window.clearTimeout(timer);
    };
  }, [isOpen, index, box !== null, step?.advance, next]);

  // Escape skips; focus lands on the callout's primary action each step
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') finish();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, finish]);

  useEffect(() => {
    if (isOpen && box) primaryRef.current?.focus({ preventScroll: true });
  }, [isOpen, index, box !== null]);

  useLayoutEffect(() => {
    if (calloutRef.current) setCalloutHeight(calloutRef.current.offsetHeight);
  }, [index, box !== null, viewport.w]);

  if (!isOpen || !step || !box) return null;

  const { w: vw, h: vh } = viewport;
  const centerX = box.left + box.width / 2;

  // Arrow sits above the target pointing down, unless the target hugs the top of the screen
  const arrowAbove = box.top - ARROW_H - 6 > 8;
  const arrowTop = arrowAbove ? box.top - ARROW_H - 4 : box.top + box.height + 4;
  const arrowLeft = Math.min(Math.max(centerX - ARROW_W / 2, EDGE), vw - EDGE - ARROW_W);

  // Callout goes on the side the arrow is not on when it fits, otherwise stacks beyond the arrow
  const belowTop = (arrowAbove ? box.top + box.height : arrowTop + ARROW_H) + 12;
  const aboveTop = (arrowAbove ? arrowTop : box.top) - calloutHeight - 12;
  const fitsBelow = belowTop + calloutHeight < vh - EDGE;
  const calloutTop = Math.max(EDGE, fitsBelow ? belowTop : aboveTop);
  const calloutWidth = vw < 640 ? vw - EDGE * 2 : 320;
  const calloutLeft = vw < 640 ? EDGE : Math.min(Math.max(centerX - calloutWidth / 2, EDGE), vw - EDGE - calloutWidth);

  const radius = Math.min(18, box.height / 2);
  const glide = reduceMotion ? { duration: 0 } : GLIDE;
  const isAction = step.advance === 'action';

  return (
    <div className="fixed inset-0 z-[90] pointer-events-none" role="dialog" aria-modal="true" aria-label="Haraya tour">
      {/* Dim layer with a rounded cutout around the target */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" aria-hidden="true">
        <defs>
          <mask id="haraya-tour-mask">
            <rect width="100%" height="100%" fill="white" />
            <motion.rect
              initial={false}
              animate={{ x: box.left, y: box.top, width: box.width, height: box.height, rx: radius }}
              transition={glide}
              fill="black"
            />
          </mask>
        </defs>
        <rect width="100%" height="100%" fill="rgba(19, 25, 31, 0.55)" mask="url(#haraya-tour-mask)" />
      </svg>

      {/* Tap blockers: the page stays inert, except the cutout itself on action steps.
          The root ignores pointer events so the cutout is truly open. */}
      {isAction ? (
        <>
          <div className="absolute inset-x-0 top-0 pointer-events-auto" style={{ height: Math.max(0, box.top) }} />
          <div className="absolute inset-x-0 bottom-0 pointer-events-auto" style={{ top: box.top + box.height }} />
          <div className="absolute left-0 pointer-events-auto" style={{ top: box.top, height: box.height, width: Math.max(0, box.left) }} />
          <div className="absolute right-0 pointer-events-auto" style={{ top: box.top, height: box.height, left: box.left + box.width }} />
        </>
      ) : (
        <div className="absolute inset-0 pointer-events-auto" />
      )}

      {/* Guide arrow: flies between targets, then nudges toward the current one */}
      <motion.div
        className="absolute left-0 top-0 pointer-events-none drop-shadow-[0_2px_6px_rgba(19,25,31,0.35)]"
        initial={false}
        animate={{ x: arrowLeft, y: arrowTop }}
        transition={reduceMotion ? { duration: 0 } : { type: 'spring', stiffness: 120, damping: 16, mass: 0.8 }}
      >
        <motion.div
          style={{ rotate: arrowAbove ? 0 : 180 }}
          animate={reduceMotion ? undefined : { y: arrowAbove ? [0, 7, 0] : [0, -7, 0] }}
          transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
        >
          <GuideArrow />
        </motion.div>
      </motion.div>

      {/* Callout */}
      <motion.div
        ref={calloutRef}
        className="absolute left-0 top-0 pointer-events-auto bg-[#FFFDF9] rounded-[20px] p-4 shadow-[0_12px_40px_-8px_rgba(19,25,31,0.45)]"
        style={{ width: calloutWidth }}
        initial={false}
        animate={{ x: calloutLeft, y: calloutTop }}
        transition={glide}
      >
        <motion.p
          key={index}
          initial={reduceMotion ? false : { opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          aria-live="polite"
          className="text-[15px] leading-snug text-[#13191F]"
        >
          {step.text}
        </motion.p>
        <div className="mt-3.5 flex items-center gap-2">
          <span className="ios-footnote font-mono text-[#594C3D]">
            {index + 1} of {TOUR_STEPS.length}
          </span>
          <button
            ref={isAction ? primaryRef : undefined}
            onClick={finish}
            className="ml-auto h-11 px-3 text-[15px] font-medium text-[#594C3D] ios-press"
          >
            Skip
          </button>
          {!isAction && (
            <button
              ref={primaryRef}
              onClick={next}
              className="h-11 px-5 rounded-full bg-[#906D4B] text-[#FFFDF9] text-[15px] font-semibold hover:bg-[#7D5C3D] ios-press"
            >
              {isLast ? 'Done' : 'Next'}
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
};
