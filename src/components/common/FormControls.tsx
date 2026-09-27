import React, { useEffect } from 'react';
import { X } from 'lucide-react';

/**
 * Shared form primitives for Haraya: a mobile-first modal shell (bottom sheet
 * on phones, centered card on desktop), labeled inputs, selects, textareas,
 * and filter chips. Every interactive control meets the 36px touch floor.
 */

export const Modal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  maxWidth?: string;
  labelledBy?: string;
}> = ({ isOpen, onClose, children, maxWidth = 'sm:max-w-lg', labelledBy }) => {
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center bg-[#1A2225]/55 backdrop-blur-sm p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={labelledBy}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        className={`bg-[#FFF9E9] border border-[#E6DCC0] w-full ${maxWidth} rounded-t-3xl sm:rounded-3xl max-h-[92vh] overflow-y-auto shadow-2xl`}
      >
        {children}
      </div>
    </div>
  );
};

export const ModalHeader: React.FC<{
  title: string;
  subtitle?: string;
  onClose: () => void;
}> = ({ title, subtitle, onClose }) => (
  <div className="sticky top-0 z-10 bg-[#FFF9E9]/95 backdrop-blur border-b border-[#E6DCC0] px-4 sm:px-6 py-3.5 flex items-start justify-between gap-3">
    <div className="min-w-0">
      <h2 className="font-cooper text-lg sm:text-xl font-bold text-[#1A2225] truncate">{title}</h2>
      {subtitle && <p className="text-xs text-[#55615D] mt-0.5 font-sans truncate">{subtitle}</p>}
    </div>
    <button
      onClick={onClose}
      aria-label="Close dialog"
      className="h-9 w-9 shrink-0 rounded-full bg-[#F3ECD8] border border-[#E6DCC0] flex items-center justify-center text-[#1A2225] hover:bg-[#E6DCC0] transition-colors"
    >
      <X className="w-4 h-4" />
    </button>
  </div>
);

export const Field: React.FC<{
  label: string;
  children: React.ReactNode;
  hint?: string;
}> = ({ label, children, hint }) => (
  <label className="block space-y-1.5">
    <span className="text-[11px] font-semibold uppercase tracking-wider text-[#55615D] font-sans">{label}</span>
    {children}
    {hint && <span className="block text-[11px] text-[#55615D] font-sans">{hint}</span>}
  </label>
);

const inputClass =
  'w-full bg-[#F3ECD8] border border-[#E6DCC0] rounded-xl px-3 h-10 font-sans text-sm text-[#1A2225] placeholder:text-[#55615D] focus:outline-none focus:bg-[#FFF9E9] focus:border-[#55615D] transition-colors';

export const TextInput: React.FC<{
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
  min?: number;
  max?: number;
}> = ({ value, onChange, placeholder, type = 'text', required, min, max }) => (
  <input
    type={type}
    value={value}
    required={required}
    placeholder={placeholder}
    min={min}
    max={max}
    onChange={(event) => onChange(event.target.value)}
    className={inputClass}
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
    className="w-full bg-[#F3ECD8] border border-[#E6DCC0] rounded-xl px-3 py-2.5 font-sans text-sm text-[#1A2225] placeholder:text-[#55615D] focus:outline-none focus:bg-[#FFF9E9] focus:border-[#55615D] transition-colors resize-none"
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
    className="w-full bg-[#F3ECD8] border border-[#E6DCC0] rounded-xl px-3 h-10 font-sans text-sm text-[#1A2225] focus:outline-none focus:border-[#55615D] transition-colors"
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
}> = ({ children, onClick, type = 'button', disabled, className = '' }) => (
  <button
    type={type}
    onClick={onClick}
    disabled={disabled}
    className={`h-10 px-5 rounded-full bg-[#1A2225] text-[#FFF9E9] text-xs font-bold font-sans tracking-wide hover:bg-[#26302F] disabled:opacity-40 disabled:cursor-not-allowed transition-colors ${className}`}
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
    className={`h-10 px-5 rounded-full bg-[#F3ECD8] border border-[#E6DCC0] text-[#1A2225] text-xs font-bold font-sans tracking-wide hover:bg-[#E6DCC0] transition-colors ${className}`}
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
    className={`h-9 shrink-0 px-3.5 rounded-full border text-xs font-semibold font-sans whitespace-nowrap transition-all ${
      active
        ? 'bg-[#1A2225] text-[#FFF9E9] border-[#1A2225]'
        : 'bg-[#F3ECD8] text-[#1A2225] border-[#E6DCC0] hover:border-[#1A2225]/40'
    } ${className}`}
  >
    {label}
  </button>
);

export const ErrorNote: React.FC<{ message: string }> = ({ message }) => (
  <p role="alert" className="text-xs font-sans text-[#8C3A2E] bg-[#8C3A2E]/10 border border-[#8C3A2E]/25 rounded-xl px-3 py-2">
    {message}
  </p>
);
