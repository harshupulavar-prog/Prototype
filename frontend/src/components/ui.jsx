import React from 'react';
import {
  Loader2,
  Users,
  Landmark,
  HeartHandshake,
  FileText,
  ShieldCheck,
  Layers,
} from 'lucide-react';

const BUTTON_BASE =
  'inline-flex items-center justify-center gap-2 rounded-lg text-sm font-semibold transition-colors ' +
  'disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap';

const BUTTON_VARIANTS = {
  primary: 'bg-kaara-700 text-white hover:bg-kaara-800 active:bg-kaara-900 shadow-card',
  secondary: 'bg-white text-charcoal border border-line hover:bg-surface hover:border-[#D3D6DE]',
  ghost: 'text-charcoal-500 hover:text-charcoal hover:bg-surface',
  link: 'text-charcoal hover:text-kaara-600 px-0',
};

const BUTTON_SIZES = {
  sm: 'px-5 py-2 text-[13px]',
  md: 'px-4 py-2.5',
  lg: 'px-5 py-3',
};

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  className = '',
  children,
  disabled,
  ...rest
}) {
  const sizeClass = variant === 'link' ? '' : BUTTON_SIZES[size];
  return (
    <button
      disabled={disabled || loading}
      className={`${BUTTON_BASE} ${BUTTON_VARIANTS[variant]} ${sizeClass} ${className}`}
      {...rest}
    >
      {loading && <Loader2 className="w-4 h-4 animate-spin" />}
      {children}
    </button>
  );
}

export function Tag({ children, tone = 'neutral' }) {
  const tones = {
    neutral: 'bg-surface text-charcoal-700 border-line',
    brand: 'bg-kaara-50 text-kaara-700 border-kaara-100',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  };
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${tones[tone]}`}>
      {children}
    </span>
  );
}

function Wave() {
  // Soft flowing lines, the Kaara brand motif, kept very light
  const lines = Array.from({ length: 14 }, (_, i) => {
    const o = i * 5;
    return `M ${520 + o} -10 C ${640 + o * 1.4} 40, ${760 - o} 20, 1000 ${60 + o * 0.9}`;
  });
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 1000 200"
      preserveAspectRatio="xMaxYMin slice"
      className="pointer-events-none absolute right-0 top-0 h-full w-[62%] max-w-[900px]"
    >
      {lines.map((d, i) => (
        <path key={i} d={d} fill="none" stroke="#E91D2B" strokeOpacity={0.09 + (i % 4) * 0.035} strokeWidth="1" />
      ))}
    </svg>
  );
}

export function PageHeader({ title, subtitle, action }) {
  return (
    <div className="relative overflow-hidden border-b border-line bg-white">
      <Wave />
      <div className="relative flex flex-wrap items-end justify-between gap-4 px-6 pb-6 pt-8 lg:px-8">
        <div>
          <h1 className="text-[28px] font-bold leading-tight tracking-tight text-charcoal">{title}</h1>
          {subtitle && <p className="mt-1.5 text-[15px] text-charcoal-500">{subtitle}</p>}
        </div>
        {action}
      </div>
    </div>
  );
}

export function PageBody({ children }) {
  return <div className="px-6 py-6 lg:px-8">{children}</div>;
}

export function EmptyState({ icon: Icon = Layers, title, text, action }) {
  return (
    <div className="rounded-2xl border border-dashed border-line bg-surface/60 px-6 py-16 text-center">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-white border border-line text-charcoal-400">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="text-base font-semibold text-charcoal">{title}</h3>
      {text && <p className="mt-1 text-sm text-charcoal-500 max-w-sm mx-auto">{text}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function ErrorNotice({ children, onClose }) {
  if (!children) return null;
  return (
    <div role="alert" className="flex items-start justify-between gap-3 rounded-lg border border-kaara-200 bg-kaara-50 px-4 py-3 text-sm text-kaara-800">
      <span>{children}</span>
      {onClose && (
        <button onClick={onClose} className="text-kaara-700 hover:text-kaara-900 font-medium">
          Dismiss
        </button>
      )}
    </div>
  );
}

export function LoadingBlock({ label = 'Loading…' }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-charcoal-400">
      <Loader2 className="h-6 w-6 animate-spin" />
      <span className="mt-3 text-sm">{label}</span>
    </div>
  );
}

const CATEGORY_ICONS = [
  [/human|hr/i, Users],
  [/bank|financ/i, Landmark],
  [/crm|sales/i, HeartHandshake],
  [/document|extract/i, FileText],
  [/insur/i, ShieldCheck],
];

export function categoryIcon(category = '') {
  const hit = CATEGORY_ICONS.find(([re]) => re.test(category));
  return hit ? hit[1] : Layers;
}

export function formatDate(iso) {
  if (!iso) return '';
  // Backend sends naive UTC timestamps
  const d = new Date(/[zZ]|[+-]\d\d:?\d\d$/.test(iso) ? iso : `${iso}Z`);
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}
