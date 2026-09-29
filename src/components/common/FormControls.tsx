import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { motion, useDragControls, useReducedMotion, type PanInfo } from 'framer-motion';

/**
 * Shared form primitives for Haraya: an iOS-style sheet (bottom sheet with a
 * drag-to-dismiss grabber on phones, centered card on desktop), labeled inputs,
 * selects, textareas, and filter chips. Every interactive control meets the 44px touch floor.
 */

/** Open sheets, oldest first: the body scroll lock and Escape both follow this stack. */
const openSheets: symbol[] = [];

/** Lets ModalHeader take the id that Modal's aria-labelledby points at. */
const ModalLabelContext = createContext<string | undefined>(undefined);

const SHEET_SPRING = { type: 'spring', stiffness: 380, damping: 36, mass: 0.9 } as const;
const PHONE_QUERY = '(max-width: 639px)';

const usePhoneLayout = () => {
  const [isPhone, setIsPhone] = useState(() => typeof window !== 'undefined' && window.matchMedia(PHONE_QUERY).matches);
  useEffect(() => {
    const media = window.matchMedia(PHONE_QUERY);
    const update = () => setIsPhone(media.matches);
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);
  return isPhone;
};

export const Modal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  maxWidth?: string;
  labelledBy?: string;
}> = ({ isOpen, onClose, children, maxWidth = 'sm:max-w-lg', labelledBy }) => {
  const isPhone = usePhoneLayout();
  const reduceMotion = useReducedMotion();
  const dragControls = useDragControls();

  // Parents pass inline closures; a ref keeps the effect keyed on isOpen alone so a re-render
  // does not tear down and re-take the scroll lock
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return;
    const token = Symbol('sheet');
    // Escape closes only the topmost sheet, not every sheet in the stack
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && openSheets[openSheets.length - 1] === token) onCloseRef.current();
    };
    window.addEventListener('keydown', onKey);
    // Lock the page behind the sheet so only the sheet scrolls. Sheets can stack (cafe, then check-in),
    // so the lock is released only when the last one closes.
    openSheets.push(token);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      openSheets.splice(openSheets.indexOf(token), 1);
      if (openSheets.length === 0) document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleDragEnd = (_event: PointerEvent | MouseEvent | TouchEvent, info: PanInfo) => {
    if (info.offset.y > 120 || info.velocity.y > 600) onClose();
  };

  const sheetMotion = reduceMotion
    ? { initial: { opacity: 0 }, animate: { opacity: 1 } }
    : isPhone
      ? { initial: { y: '100%' }, animate: { y: 0 } }
      : { initial: { opacity: 0, scale: 0.96, y: 12 }, animate: { opacity: 1, scale: 1, y: 0 } };

  return (
    <motion.div
      className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center bg-[#13191F]/40 p-0 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby={labelledBy}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25 }}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <motion.div
        {...sheetMotion}
        transition={SHEET_SPRING}
        drag={isPhone && !reduceMotion ? 'y' : false}
        dragControls={dragControls}
        dragListener={false}
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0, bottom: 0.9 }}
        onDragEnd={handleDragEnd}
        className={`relative bg-[#FFFDF9] w-full ${maxWidth} rounded-t-[28px] sm:rounded-[24px] max-h-[92dvh] overflow-y-auto overscroll-contain shadow-[0_-8px_40px_rgba(19,25,31,0.18)] sm:shadow-[0_24px_64px_-12px_rgba(19,25,31,0.35)] sheet-safe`}
      >
        {/* Grabber: the drag handle on phones */}
        <div
          className="sm:hidden sticky top-0 z-20 h-5 -mb-5 flex justify-center pt-1.5 touch-none cursor-grab"
          onPointerDown={(event) => dragControls.start(event)}
          aria-hidden="true"
        >
          <span className="ios-grabber" />
        </div>
        <ModalLabelContext.Provider value={labelledBy}>{children}</ModalLabelContext.Provider>
      </motion.div>
    </motion.div>
  );
};

export const ModalHeader: React.FC<{
  title: string;
  subtitle?: string;
  onClose: () => void;
}> = ({ title, subtitle, onClose }) => {
  const labelId = useContext(ModalLabelContext);
  return (
    <div className="sticky top-0 z-10 bg-surface ios-hairline-b px-4 sm:px-6 pt-5 sm:pt-4 pb-3 flex items-start justify-between gap-3">
      <div className="min-w-0 pt-1">
        <h2 id={labelId} className="font-cooper text-[19px] sm:text-xl font-bold text-[#13191F] leading-tight truncate">{title}</h2>
        {subtitle && <p className="ios-footnote text-[#594C3D] mt-0.5 truncate">{subtitle}</p>}
      </div>
      <button
        onClick={onClose}
        aria-label="Close dialog"
        className="h-11 w-11 -mr-2 -mt-1 shrink-0 flex items-center justify-center ios-press"
      >
        <span className="h-7.5 w-7.5 rounded-full bg-[#766046]/15 flex items-center justify-center text-[#594C3D]">
          <X className="w-4 h-4" strokeWidth={2.5} />
        </span>
      </button>
    </div>
  );
};

export const Field: React.FC<{
  label: string;
  children: React.ReactNode;
  hint?: string;
}> = ({ label, children, hint }) => (
  <label className="block space-y-1.5">
    <span className="block px-1 text-[13px] font-medium text-[#594C3D] font-sans">{label}</span>
    {children}
    {hint && <span className="block px-1 ios-footnote text-[#594C3D]">{hint}</span>}
  </label>
);

const inputClass =
  'w-full ios-fill rounded-[12px] px-3.5 h-11 min-h-[40px] font-sans text-[15px] text-[#13191F] placeholder:text-[#6E6150] focus:outline-none focus:bg-[#FFFDF9] focus:shadow-[0_0_0_2px_#906D4B] transition-[background-color,box-shadow]';

export const TextInput: React.FC<{
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
  min?: number;
  max?: number;
  disabled?: boolean;
}> = ({ value, onChange, placeholder, type = 'text', required, min, max, disabled }) => (
  <input
    type={type}
    value={value}
    required={required}
    disabled={disabled}
    placeholder={placeholder}
    min={min}
    max={max}
    onChange={(event) => onChange(event.target.value)}
    className={`${inputClass} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
  />
);

export const TextArea: React.FC<{
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  maxLength?: number;
}> = ({ value, onChange, placeholder, rows = 3, maxLength }) => (
  <textarea
    value={value}
    rows={rows}
    maxLength={maxLength}
    placeholder={placeholder}
    onChange={(event) => onChange(event.target.value)}
    className="w-full ios-fill rounded-[12px] px-3.5 py-3 font-sans text-[15px] text-[#13191F] placeholder:text-[#6E6150] focus:outline-none focus:bg-[#FFFDF9] focus:shadow-[0_0_0_2px_#906D4B] transition-[background-color,box-shadow] resize-none"
  />
);

export const SelectInput: React.FC<{
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}> = ({ value, onChange, options }) => (
  <select
    value={value}
    onChange={(event) => onChange(event.target.value)}
    className="w-full ios-fill rounded-[12px] px-3.5 h-11 min-h-[40px] font-sans text-[15px] text-[#13191F] focus:outline-none focus:shadow-[0_0_0_2px_#906D4B] transition-shadow"
  >
    {options.map((option) => (
      <option key={option.value} value={option.value}>
        {option.label}
      </option>
    ))}
  </select>
);

export const PrimaryButton: React.FC<{
  children: React.ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit';
  disabled?: boolean;
  className?: string;
  ref?: React.Ref<HTMLButtonElement>;
}> = ({ children, onClick, type = 'button', disabled, className = '', ref }) => (
  <button
    ref={ref}
    type={type}
    onClick={onClick}
    disabled={disabled}
    className={`h-11 px-5 rounded-full bg-[#906D4B] text-[#FFFDF9] text-[15px] font-semibold font-sans hover:bg-[#7D5C3D] ios-press disabled:opacity-40 disabled:cursor-not-allowed ${className}`}
  >
    {children}
  </button>
);

export const SecondaryButton: React.FC<{
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}> = ({ children, onClick, className = '' }) => (
  <button
    type="button"
    onClick={onClick}
    className={`h-11 px-5 rounded-full ios-fill text-[#7D5C3D] text-[15px] font-semibold font-sans hover:bg-[#766046]/20 ios-press ${className}`}
  >
    {children}
  </button>
);

export const Chip: React.FC<{
  label: string;
  active: boolean;
  onClick: () => void;
  className?: string;
}> = ({ label, active, onClick, className = '' }) => (
  <button
    type="button"
    onClick={onClick}
    aria-pressed={active}
    className={`h-8 shrink-0 px-3.5 rounded-full text-[13px] font-medium font-sans whitespace-nowrap ios-press ${
      active ? 'bg-[#13191F] text-[#FFFDF9]' : 'ios-fill text-[#13191F] hover:bg-[#766046]/20'
    } ${className}`}
  >
    {label}
  </button>
);

export const ErrorNote: React.FC<{ message: string }> = ({ message }) => (
  <p role="alert" className="ios-footnote text-[#8C3A2E] bg-[#8C3A2E]/10 rounded-[12px] px-3.5 py-2.5">
    {message}
  </p>
);
