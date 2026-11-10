import { useEffect, useRef } from 'react';
import { Icon } from './ui.jsx';

// What we learned about this prospect from public sources, with links, and
// how it shaped the build. Real facts live only here, never on the dashboards.
export function BuiltAround({ profile, open }) {
  const order = Object.keys(profile.sources);
  return (
    <section className="built" id="built-around">
      <span className="eyebrow">Built around {profile.prospect}</span>
      <ul className="built-facts">
        {profile.facts.map((f) => (
          <li key={f.k}>
            <strong>{f.k}</strong>
            <span>{f.v} <sup className="cite">[{order.indexOf(f.src) + 1}]</sup></span>
          </li>
        ))}
      </ul>
      <span className="eyebrow">How this build reflects it</span>
      <ul className="built-shaped">
        {profile.shaped.map((x) => <li key={x}><Icon name="check" size={13} stroke={3} />{x}</li>)}
      </ul>
      <ol className="built-sources">
        {order.map((id) => (
          <li key={id}><a href={profile.sources[id].url} target="_blank" rel="noreferrer" tabIndex={open ? 0 : -1}>{profile.sources[id].name}</a></li>
        ))}
      </ol>
      <span className="fine">Public information only. The borrowers, amounts and rates on every screen are illustrative, not {profile.prospect} data.</span>
    </section>
  );
}

export default function Blueprint({ open, onClose, settings, D }) {
  const { prospect, contact } = settings;
  const closeRef = useRef(null);
  useEffect(() => {
    if (open && closeRef.current) closeRef.current.focus();
  }, [open]);

  const points = [
    { icon: 'code', title: 'You own the code and the models', text: 'Built on your stack. Borrower data stays in your environment, and the models are trained only on your book.' },
    { icon: 'layers', title: 'Works with what you already run', text: 'Kaara builds around ' + D.platforms + '. No migration.' },
    { icon: 'clock', title: 'Live in 8 to 10 weeks', text: 'Starting with the screens you see here, shaped around how your team already works.' },
    { icon: 'users', title: 'A person approves every contact', text: 'Nothing reaches a borrower without sign-off. Hardship and disputes always go to your team.' },
    { icon: 'credit', title: 'Collections feeds credit', text: 'What collections learns flows back into your credit decisions. Kaara builds across the lending lifecycle.' }
  ];

  return (
    <div className={'drawer-wrap' + (open ? ' open' : '')} aria-hidden={!open}>
      <div className="drawer-scrim" onClick={onClose} />
      <aside className="drawer" role="dialog" aria-modal="true" aria-label="How Kaara builds this">
        <div className="drawer-head">
          <span className="eyebrow">A blueprint for {prospect}</span>
          <button ref={closeRef} type="button" className="icon-btn" onClick={onClose} aria-label="Close" tabIndex={open ? 0 : -1}><Icon name="x" size={18} /></button>
        </div>
        <h2 className="serif drawer-title">What Kaara Technologies would build for your collections team</h2>
        <p className="muted">This command centre is a working blueprint. Every borrower and figure in it is illustrative.</p>

        <div className="pillars-strip nx-in" style={{ margin: '14px 0' }}>
          <div className="pillar-item">
            <span className="pillar-outcome-tag"><Icon name="spark" size={13} /> Fewer roll-forwards</span>
            <span className="pillar-copy">Pre-due early warning flags stress before the first missed EMI</span>
          </div>
          <div className="pillar-item">
            <span className="pillar-outcome-tag"><Icon name="users" size={13} /> Fewer field visits</span>
            <span className="pillar-copy">Omnichannel resolution cures accounts before physical escalation</span>
          </div>
          <div className="pillar-item">
            <span className="pillar-outcome-tag"><Icon name="check" size={13} stroke={3} /> Higher cure rate</span>
            <span className="pillar-copy">Portfolio memory matches proven historical plans to maximize recovery</span>
          </div>
        </div>

        {settings.profile && <BuiltAround profile={settings.profile} open={open} />}
        <ul className="bp-list">
          {points.map((p, i) => (
            <li key={p.title} style={{ transitionDelay: open ? 80 + i * 60 + 'ms' : '0ms' }}>
              <span className="bp-icon"><Icon name={p.icon} size={18} /></span>
              <span><strong>{p.title}</strong><span className="muted">{p.text}</span></span>
            </li>
          ))}
        </ul>
        <div className="drawer-foot">
          {contact ? (
            <a className="btn btn-primary" href={'mailto:' + contact + '?subject=' + encodeURIComponent('Collections blueprint for ' + prospect)} tabIndex={open ? 0 : -1}>
              <Icon name="mail" size={16} />Talk to Kaara
            </a>
          ) : null}
          <span className="fine">Designed and built by Kaara Technologies</span>
        </div>
      </aside>
    </div>
  );
}
