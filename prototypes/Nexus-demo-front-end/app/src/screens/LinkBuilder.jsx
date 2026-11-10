import { useEffect, useState } from 'react';
import { Icon } from '../components/ui.jsx';
import { KAARA_RED, PROFILES } from '../settings.js';

// For the sales team only: builds a personalised demo link in seconds.
// Open it with ?builder at the end of the demo address.
const PRESETS = ['#C8000A', '#1F4FD8', '#0E7A5A', '#7A3FD1', '#D9480F', '#0F766E'];

export default function LinkBuilder() {
  useEffect(() => {
    let t = 'light';
    try { t = localStorage.getItem('nx-theme') || 'light'; } catch { /* storage blocked */ }
    document.documentElement.setAttribute('data-theme', t);
  }, []);
  const [prospect, setProspect] = useState('');
  const [market, setMarket] = useState('India');
  const [accent, setAccent] = useState(KAARA_RED);
  const [logo, setLogo] = useState('');
  const [contact, setContact] = useState('');
  const [tour, setTour] = useState(true);
  const [profile, setProfile] = useState('');
  const [copied, setCopied] = useState(false);

  const q = new URLSearchParams();
  if (profile) q.set('profile', profile);
  if (prospect.trim()) q.set('prospect', prospect.trim());
  if (!profile) q.set('market', market);
  if (accent.toUpperCase() !== KAARA_RED) q.set('accent', accent.replace('#', ''));
  if (logo.trim()) q.set('logo', logo.trim());
  if (contact.trim()) q.set('contact', contact.trim());
  if (tour) q.set('tour', '1');
  const link = window.location.origin + window.location.pathname + '?' + q.toString();

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="builder" style={{ '--accent': accent, '--accent-line': accent, '--on-accent': '#FFFFFF' }}>
      <div className="builder-card card">
        <span className="eyebrow">Kaara sales · internal</span>
        <h1 className="serif">Build a prospect link</h1>
        <p className="muted">Fill this in, copy the link, send it. The prospect sees their own name, colour and logo across the demo.</p>

        <div className="field">
          <span>Custom build</span>
          <div className="seg">
            <button type="button" className={!profile ? 'on' : ''} onClick={() => setProfile('')}>None</button>
            {Object.values(PROFILES).map((p) => (
              <button key={p.id} type="button" className={profile === p.id ? 'on' : ''} onClick={() => { setProfile(p.id); setAccent(p.accent); }}>{p.prospect}</button>
            ))}
          </div>
        </div>

        <label className="field">
          <span>Prospect name{profile ? ' (leave blank to use the custom build’s)' : ''}</span>
          <input className="input" value={prospect} onChange={(e) => setProspect(e.target.value)} placeholder="e.g. Acme Finance" maxLength={42} />
        </label>

        <div className="field">
          <span>Market</span>
          <div className="seg">
            {['India', 'US'].map((m) => (
              <button key={m} type="button" className={market === m ? 'on' : ''} onClick={() => setMarket(m)}>{m}</button>
            ))}
          </div>
        </div>

        <div className="field">
          <span>Accent colour</span>
          <div className="swatches">
            {PRESETS.map((c) => (
              <button key={c} type="button" className={'swatch' + (accent.toUpperCase() === c ? ' on' : '')} style={{ background: c }} onClick={() => setAccent(c)} aria-label={'Use ' + c} />
            ))}
            <input type="color" value={accent} onChange={(e) => setAccent(e.target.value.toUpperCase())} aria-label="Pick any colour" className="color-input" />
            <span className="mono muted small">{accent}</span>
          </div>
        </div>

        <label className="field">
          <span>Logo link (optional)</span>
          <input className="input" value={logo} onChange={(e) => setLogo(e.target.value)} placeholder="https://… link to a PNG or SVG of their logo" />
        </label>

        <label className="field">
          <span>Your email for the “Talk to Kaara” button (optional)</span>
          <input className="input" value={contact} onChange={(e) => setContact(e.target.value)} placeholder="name@demo.kaara.ai" />
        </label>

        <label className="check-row">
          <input type="checkbox" checked={tour} onChange={(e) => setTour(e.target.checked)} />
          <span>Open with the guided tour (best for links you send by email)</span>
        </label>

        <div className="link-out">
          <code>{link}</code>
          <div className="row-gap">
            <button type="button" className="btn btn-primary" onClick={copy}><Icon name={copied ? 'check' : 'copy'} size={16} />{copied ? 'Copied' : 'Copy link'}</button>
            <a className="btn btn-outline" href={link} target="_blank" rel="noreferrer">Preview<Icon name="arrowRight" size={16} /></a>
          </div>
        </div>
      </div>
    </div>
  );
}
