// Reads the per-prospect settings from the link, e.g.
// ?prospect=Acme%20Finance&market=US&accent=1F4FD8&logo=https://...
// Anything missing or invalid falls back to a safe default.

import { ICICI_HFC } from './profiles/iciciHfc.js';
// Written by PrototypeHub when this prototype is hosted (name, colour, logo). {} when run from source.
import branding from './branding.json';

export const KAARA_RED = '#C8000A';

export const PROFILES = { [ICICI_HFC.id]: ICICI_HFC };

function cleanColor(raw) {
  let c = (raw || '').trim();
  if (!c) return KAARA_RED;
  if (!c.startsWith('#')) c = '#' + c;
  if (/^#[0-9a-f]{3}$/i.test(c)) c = '#' + c[1] + c[1] + c[2] + c[2] + c[3] + c[3];
  return /^#[0-9a-f]{6}$/i.test(c) ? c.toUpperCase() : KAARA_RED;
}

function cleanUrl(raw) {
  if (!raw) return '';
  // A logo file shipped inside this app, e.g. /logo.png
  if (/^\/(?!\/)[\w./-]+$/.test(raw.trim())) return raw.trim();
  try {
    const u = new URL(raw.trim());
    return u.protocol === 'https:' || u.protocol === 'http:' ? u.href : '';
  } catch {
    return '';
  }
}

function cleanEmail(raw) {
  let e = (raw || '').trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) return '';
  // Check domain: ensure untrusted / placeholder domains like nexuscommercial.in switch to Kaara-owned demo domain
  if (/@nexuscommercial(\.in)?$/i.test(e)) {
    e = e.replace(/@nexuscommercial(\.in)?$/i, '@demo.kaara.ai');
  }
  return e;
}

function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function luminance(hex) {
  const ch = hexToRgb(hex).map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * ch[0] + 0.7152 * ch[1] + 0.0722 * ch[2];
}

function mix(hex, toHex, amount) {
  const a = hexToRgb(hex), b = hexToRgb(toHex);
  const out = a.map((v, i) => Math.round(v + (b[i] - v) * amount));
  return '#' + out.map((v) => v.toString(16).padStart(2, '0')).join('');
}

export function readSettings(search = window.location.search) {
  const q = new URLSearchParams(search);
  // A prospect profile (e.g. ?profile=icici-hfc) sets its own name, colour,
  // market and data. Anything else in the link still overrides it.
  // A build can also bake a profile in (VITE_PROFILE), for hosts where the
  // link's settings are not passed through.
  const profile = PROFILES[(q.get('profile') || import.meta.env.VITE_PROFILE || '').trim().toLowerCase()] || null;
  const m = (q.get('market') || (profile ? profile.market : '')).trim().toUpperCase();
  const market = m === 'US' || m === 'USA' ? 'US' : 'India';
  let rawProspect = (q.get('prospect') || (profile ? profile.prospect : '') || branding.companyName || '').trim().slice(0, 42);
  if (!rawProspect || /kaara\.code/i.test(rawProspect) || /internal platform/i.test(rawProspect)) {
    rawProspect = profile ? profile.prospect : 'Nexus Collections';
  }
  const prospect = rawProspect;

  let rawSubtitle = (q.get('subtitle') || branding.subtitle || '').trim();
  if (!rawSubtitle || /kaara\.code|internal platform|nexus commercial/i.test(rawSubtitle)) {
    rawSubtitle = 'AI Collections Command Centre';
  }
  const subtitle = rawSubtitle;

  const accent = cleanColor(q.get('accent') || (profile ? profile.accent : '') || branding.primaryColor || '');
  const lum = luminance(accent);
  return {
    market,
    US: market === 'US',
    prospect,
    subtitle,
    accent,
    // Lines and text need a version of the brand colour that sits calmly on
    // each background: lifted a little on dark, deepened a little on light.
    accentLineDark: mix(accent, '#FFFFFF', lum < 0.06 ? 0.35 : 0.14),
    accentTextDark: mix(accent, '#FFFFFF', lum < 0.2 ? 0.52 : 0.3),
    accentLineLight: lum > 0.5 ? mix(accent, '#000000', 0.35) : accent,
    accentTextLight: mix(accent, '#000000', lum > 0.4 ? 0.45 : 0.12),
    // Button text: white on dark brand colours, charcoal on light ones.
    onAccent: lum > 0.45 ? '#1A1A1A' : '#FFFFFF',
    logo: cleanUrl(q.get('logo') || branding.logo || ''),
    contact: cleanEmail(q.get('contact')) || 'contact@demo.kaara.ai',
    builder: q.has('builder'),
    tour: q.get('tour') === '1' || q.has('tourstep'),
    // Presentation shortcuts: open a state straight from the link.
    tourStep: Math.max(0, parseInt(q.get('tourstep') || '0', 10) || 0),
    lens: q.get('lens') === '1',
    panel: q.get('panel') || '',
    theme: ['light', 'dark'].includes(q.get('theme')) ? q.get('theme') : '',
    quiet: q.get('quiet') === '1',
    profile
  };
}

export function initialsOf(name) {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0].toUpperCase())
      .join('') || 'YC'
  );
}
