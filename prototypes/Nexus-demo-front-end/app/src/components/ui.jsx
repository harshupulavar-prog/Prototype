import { useEffect, useRef, useState } from 'react';

const ICONS = {
  overview: 'M3 13h8V3H3zM13 21h8V11h-8zM3 21h8v-6H3zM13 3v6h8V3z',
  queue: 'M4 6h16M4 12h16M4 18h10',
  case: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8M19 8v6M22 11h-6',
  calls: 'M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z',
  audit: 'M9 12l2 2 4-4M12 3l8 4v5c0 5-3.5 8.5-8 9-4.5-.5-8-4-8-9V7z',
  check: 'M20 6L9 17l-5-5',
  lock: 'M7 11V7a5 5 0 0 1 10 0v4M5 11h14v10H5z',
  sun: 'M12 3v2M12 19v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M3 12h2M19 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8',
  moon: 'M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z',
  arrowLeft: 'M19 12H5M12 19l-7-7 7-7',
  arrowRight: 'M5 12h14M12 5l7 7-7 7',
  chevLeft: 'M15 18l-6-6 6-6',
  chevRight: 'M9 18l6-6-6-6',
  info: 'M12 16v-4M12 8h.01M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20',
  x: 'M18 6L6 18M6 6l12 12',
  spark: 'M12 3l1.9 5.8L20 10l-6.1 1.2L12 17l-1.9-5.8L4 10l6.1-1.2z',
  link: 'M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7',
  credit: 'M3 7h18v10H3zM3 11h18M7 15h4',
  shield: 'M12 3l8 4v5c0 5-3.5 8.5-8 9-4.5-.5-8-4-8-9V7z',
  clock: 'M12 7v5l3 2M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20',
  layers: 'M12 3l9 5-9 5-9-5zM3 13l9 5 9-5M3 17.5l9 5 9-5',
  code: 'M16 18l6-6-6-6M8 6l-6 6 6 6',
  users: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8M23 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8',
  copy: 'M9 9h11v11H9zM5 15H4V4h11v1',
  mail: 'M4 5h16v14H4zM4 6l8 7 8-7',
  database: 'M12 3c4.4 0 8 1.3 8 3s-3.6 3-8 3-8-1.3-8-3 3.6-3 8-3zM4 6v6c0 1.7 3.6 3 8 3s8-1.3 8-3V6M4 12v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6',
  search: 'm21 21-4.3-4.3M10.8 18a7.2 7.2 0 1 1 0-14.4 7.2 7.2 0 0 1 0 14.4z',
  play: 'M6 4l14 8-14 8z',
  cpu: 'M9 9h6v6H9zM5 5h14v14H5zM9 2v3M15 2v3M9 19v3M15 19v3M2 9h3M2 15h3M19 9h3M19 15h3',
  phoneOut: 'M15 3h6v6M21 3l-7 7M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z'
};

export function Icon({ name, size = 18, stroke = 2, style, className }) {
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" style={style} className={className}>
      <path d={ICONS[name]} />
    </svg>
  );
}

const reduceMotion = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Animates a number from its previous value to the new one.
export function CountUp({ value, format, duration = 900 }) {
  const [shown, setShown] = useState(reduceMotion ? value : 0);
  const from = useRef(reduceMotion ? value : 0);
  const raf = useRef(0);
  useEffect(() => {
    if (reduceMotion) { setShown(value); return; }
    const start = performance.now();
    const a = from.current;
    cancelAnimationFrame(raf.current);
    const step = () => {
      // Read the clock here, and clamp, so the number can never overshoot
      // or run backwards if frame timing and page timing disagree.
      const p = Math.min(1, Math.max(0, (performance.now() - start) / duration));
      const e = 1 - Math.pow(1 - p, 3);
      const v = a + (value - a) * e;
      setShown(v);
      from.current = v;
      if (p < 1) raf.current = requestAnimationFrame(step);
    };
    raf.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf.current);
  }, [value, duration]);
  return <>{format ? format(shown) : Math.round(shown)}</>;
}

export function Sparkline({ data, color, width = 120, height = 36, id }) {
  const mx = Math.max(...data), mn = Math.min(...data);
  const pts = data.map((v, i) => [(i * width) / (data.length - 1), height - 4 - ((v - mn) / (mx - mn || 1)) * (height - 8)]);
  const line = pts.map((p) => p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' ');
  const last = pts[pts.length - 1];
  return (
    <svg aria-hidden="true" width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id={id} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor={color} stopOpacity="0.28" />
          <stop offset="1" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={`0,${height} ${line} ${width},${height}`} fill={`url(#${id})`} />
      <polyline points={line} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="nx-draw" />
      <circle cx={last[0]} cy={last[1]} r="3" fill={color} />
    </svg>
  );
}

export function Donut({ items, colors, size = 132, thickness = 16, center }) {
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  let off = 0;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={items.map((x) => x[0] + ' ' + x[1] + '%').join(', ')}>
      <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--track)" strokeWidth={thickness} />
        {items.map((it, i) => {
          const len = (it[1] / 100) * c;
          const gap = 3;
          const el = (
            <circle key={it[0]} cx={size / 2} cy={size / 2} r={r} fill="none" stroke={colors[i]} strokeWidth={thickness}
              strokeDasharray={`${Math.max(0, len - gap)} ${c}`} strokeDashoffset={-off} className="nx-donut-seg" style={{ animationDelay: i * 80 + 'ms' }} />
          );
          off += len;
          return el;
        })}
      </g>
      {center}
    </svg>
  );
}

export function RiskRing({ value, color, size = 132 }) {
  const thickness = 10;
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div className="nx-ring" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--track)" strokeWidth={thickness} />
          <circle key={value} cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={thickness} strokeLinecap="round"
            strokeDasharray={`${(value / 100) * c} ${c}`} className="nx-ring-arc" style={{ '--c': c }} />
        </g>
      </svg>
      <div className="nx-ring-label">
        <span className="serif" style={{ fontSize: 38, fontWeight: 700, color, lineHeight: 1 }}>
          <CountUp value={value} />%
        </span>
        <span className="eyebrow">risk of missing</span>
      </div>
    </div>
  );
}

export function Pill({ tone, children, icon, className = '' }) {
  return (
    <span className={'pill ' + className} style={tone ? { background: tone.bg, color: tone.fg } : undefined}>
      {icon && <Icon name={icon} size={12} stroke={2.5} />}
      {children}
    </span>
  );
}

export function Avatar({ name, tone }) {
  const ini = name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
  return (
    <span className="avatar" style={tone ? { background: tone.bg, color: tone.fg } : undefined} aria-hidden="true">
      {ini}
    </span>
  );
}

export function LiveDot({ color = 'var(--good)', size = 8 }) {
  return <span className="live-dot" style={{ width: size, height: size, '--dot': color }} />;
}
