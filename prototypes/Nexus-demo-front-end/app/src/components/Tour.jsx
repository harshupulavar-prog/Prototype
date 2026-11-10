import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { CountUp, Icon } from './ui.jsx';
import { buildSteps, MINUTES } from './tourSteps.js';

const PAD = 8;

// Guided walkthrough: moves through the screens, spotlights one part at a
// time and keeps a running, illustrative tally of team time saved.
export default function Tour({ open, onClose, D, fmt, settings, live, screen, sel, go, openCase, openBlueprint, setLens, startStep = 0 }) {
  const [step, setStep] = useState(startStep);
  const [rect, setRect] = useState(null);
  const [cardSize, setCardSize] = useState({ w: 384, h: 320 });
  const [picked, setPicked] = useState({});
  const cardRef = useRef(null);
  const steps = buildSteps({ D, fmt, settings, live });
  const s = steps[step];
  const spot = !!s.target;

  // Restart from the welcome screen each time the tour is reopened.
  const wasOpen = useRef(open);
  useEffect(() => {
    if (open && !wasOpen.current) setStep(0);
    wasOpen.current = open;
  }, [open]);

  // Move to the right screen, then find and scroll to the highlighted part.
  useEffect(() => {
    if (!open) return;
    setRect(null);
    if (setLens) setLens(!!s.lens);
    if (s.screen) {
      if (s.caseIdx != null) { if (screen !== 'case' || sel !== s.caseIdx) openCase(s.caseIdx); }
      else if (screen !== s.screen) go(s.screen);
    }
    if (!s.target) return;
    let tries = 0, raf = 0, cancelled = false;
    const find = () => {
      if (cancelled) return;
      const el = document.querySelector('[data-tour="' + s.target + '"]');
      if (!el) { if (tries++ < 60) raf = requestAnimationFrame(find); return; }
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight;
      const top = r.height > vh - 260 ? r.top + window.scrollY - 100 : r.top + window.scrollY - (vh - r.height) / 2 + (window.innerWidth < 860 ? -60 : 40);
      window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
    };
    raf = requestAnimationFrame(find);
    return () => { cancelled = true; cancelAnimationFrame(raf); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, step]);

  // Follow the highlighted part while the page scrolls or updates.
  useEffect(() => {
    if (!open || !s.target) return;
    let raf = 0;
    const tick = () => {
      const el = document.querySelector('[data-tour="' + s.target + '"]');
      if (el) {
        const r = el.getBoundingClientRect();
        const next = { top: Math.round(r.top), left: Math.round(r.left), width: Math.round(r.width), height: Math.round(r.height) };
        setRect((p) => (p && p.top === next.top && p.left === next.left && p.width === next.width && p.height === next.height ? p : next));
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [open, step, s.target]);

  useLayoutEffect(() => {
    if (cardRef.current) {
      const w = cardRef.current.offsetWidth, h = cardRef.current.offsetHeight;
      setCardSize((p) => (p.w === w && p.h === h ? p : { w, h }));
    }
  });

  const next = () => setStep((i) => Math.min(steps.length - 1, i + 1));
  const back = () => setStep((i) => Math.max(0, i - 1));

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.target.closest('input, textarea')) return;
      if (e.key === 'ArrowRight') next();
      if (e.key === 'ArrowLeft') back();
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  if (!open) return null;

  const tourSteps = steps.filter((x) => !x.kind);
  const pos = tourSteps.findIndex((x) => x.id === s.id);
  const savedSoFar = steps.slice(0, step + 1).reduce((a, x) => a + (x.saved ? x.saved.hours : 0), 0);
  const savedTotal = steps.reduce((a, x) => a + (x.saved ? x.saved.hours : 0), 0);

  if (s.kind === 'intro') {
    return (
      <div className="tour-modal-wrap" role="dialog" aria-modal="true" aria-label="Guided tour">
        <div className="tour-scrim" onClick={onClose} />
        <div className="tour-modal nx-pop">
          <span className="tour-badge"><Icon name="spark" size={14} />Guided tour · 2 minutes</span>
          <h2 className="serif">{s.title}</h2>
          <p className="muted">{s.body}</p>
          <ul className="tour-preview">
            {tourSteps.map((x) => <li key={x.id}><Icon name="check" size={13} stroke={3} />{x.tag}</li>)}
          </ul>
          <div className="row-gap">
            <button type="button" className="btn btn-primary" onClick={next} autoFocus>Start the tour<Icon name="arrowRight" size={16} /></button>
            <button type="button" className="btn btn-ghost" onClick={onClose}>Explore on my own</button>
          </div>
          <span className="fine">Use the arrow keys to move through it. Press Esc to leave at any time.</span>
        </div>
      </div>
    );
  }

  if (s.kind === 'finish') {
    return (
      <Finish steps={tourSteps} picked={picked} setPicked={setPicked} savedTotal={savedTotal} settings={settings}
        onClose={onClose} onRestart={() => setStep(1)} onBack={back} openBlueprint={() => { onClose(); openBlueprint(); }} />
    );
  }

  const vw = window.innerWidth, vh = window.innerHeight;
  const mobile = vw < 760;
  const hole = rect && {
    top: Math.max(rect.top - PAD, 4), left: rect.left - PAD,
    width: rect.width + PAD * 2, height: Math.min(rect.height + PAD * 2, vh - Math.max(rect.top - PAD, 4) - 4)
  };
  const place = placeCard(hole, cardSize, vw, vh, mobile);

  return (
    <div className="tour-layer" aria-live="polite">
      {spot && hole ? <div className="tour-hole" style={hole} /> : <div className="tour-dim" />}
      <div ref={cardRef} className={'tour-card' + (mobile ? ' docked' : '')} style={mobile ? undefined : place} role="dialog" aria-label={'Tour step ' + (pos + 1) + ' of ' + tourSteps.length}>
        <div className="tour-progress" aria-hidden="true">
          {tourSteps.map((x, i) => <span key={x.id} className={i < pos ? 'done' : i === pos ? 'now' : ''} />)}
        </div>
        <div className="tour-top">
          <span className="tour-tag"><Icon name="spark" size={13} />{s.tag}</span>
          <button type="button" className="icon-btn sm" onClick={onClose} aria-label="Close the tour"><Icon name="x" size={15} /></button>
        </div>
        <div key={s.id} className="tour-body nx-in">
          <h3 className="serif">{s.title}</h3>
          <p>{s.body}</p>
          {s.saved && (
            <div className="tour-saved">
              <span className="tour-saved-num serif">+{fmt.num(s.saved.hours)} hrs</span>
              <span className="muted small">a day of team time, instead of {s.saved.what}</span>
            </div>
          )}
        </div>
        <div className="tour-tally">
          <span className="muted small">Team time freed so far today (illustrative)</span>
          <strong className="mono"><CountUp value={savedSoFar} format={(v) => fmt.num(v) + ' hrs'} duration={700} /></strong>
        </div>
        <div className="tour-foot">
          <button type="button" className={'tour-star' + (picked[s.id] ? ' on' : '')} onClick={() => setPicked((p) => ({ ...p, [s.id]: !p[s.id] }))} aria-pressed={!!picked[s.id]}>
            <Star on={picked[s.id]} />{picked[s.id] ? 'Relevant to us' : 'Mark as relevant'}
          </button>
          <span className="tour-nav">
            <span className="muted small mono">{pos + 1} / {tourSteps.length}</span>
            <button type="button" className="btn btn-ghost btn-sm" onClick={back}>Back</button>
            <button type="button" className="btn btn-primary btn-sm" onClick={next}>{pos === tourSteps.length - 1 ? 'See the summary' : 'Next'}</button>
          </span>
        </div>
      </div>
    </div>
  );
}

function Star({ on }) {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" aria-hidden="true" fill={on ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinejoin="round">
      <path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z" />
    </svg>
  );
}

function placeCard(hole, size, vw, vh, mobile) {
  if (mobile) return {};
  const m = 18, edge = 16, topMin = 84;
  const clampTop = (y) => Math.min(Math.max(y, topMin), vh - size.h - edge);
  const clampLeft = (x) => Math.min(Math.max(x, edge), vw - size.w - edge);
  if (!hole) return { left: vw - size.w - 28, top: vh - size.h - 28 };
  const right = hole.left + hole.width;
  const bottom = hole.top + hole.height;
  if (right + m + size.w < vw - edge) return { left: right + m, top: clampTop(hole.top) };
  if (hole.left - m - size.w > edge) return { left: hole.left - m - size.w, top: clampTop(hole.top) };
  if (bottom + m + size.h < vh - edge) return { left: clampLeft(hole.left + hole.width / 2 - size.w / 2), top: bottom + m };
  if (hole.top - m - size.h > topMin) return { left: clampLeft(hole.left + hole.width / 2 - size.w / 2), top: hole.top - m - size.h };
  return { left: vw - size.w - 28, top: vh - size.h - 28 };
}

function Finish({ steps, picked, setPicked, savedTotal, settings, onClose, onRestart, onBack, openBlueprint }) {
  const { prospect, contact } = settings;
  const people = Math.round(savedTotal / 8);
  const chosen = steps.filter((x) => picked[x.id]);
  const mail = contact
    ? 'mailto:' + contact +
      '?subject=' + encodeURIComponent('Collections blueprint for ' + prospect) +
      '&body=' + encodeURIComponent('Hi,\n\nI took the Nexus tour. ' + (chosen.length ? 'These looked most relevant for us:\n' + chosen.map((x) => '- ' + x.tag).join('\n') : 'I would like to talk it through.') + '\n\nThanks')
    : '';

  return (
    <div className="tour-modal-wrap" role="dialog" aria-modal="true" aria-label="Tour summary">
      <div className="tour-scrim" onClick={onClose} />
      <div className="tour-modal tour-finish nx-pop">
        <span className="tour-badge"><Icon name="check" size={14} stroke={3} />Tour complete</span>
        <h2 className="serif">What Nexus would do for {prospect}, every day</h2>

        <div className="finish-hero">
          <div>
            <span className="eyebrow">Illustrative estimate</span>
            <span className="finish-num serif"><CountUp value={savedTotal} format={(v) => Math.round(v).toLocaleString('en-US')} duration={1400} /> hrs</span>
            <span className="muted">of team time a day, about {people} people’s working day, moved from routine work to the cases that need a person.</span>
          </div>
        </div>

        <div className="finish-list">
          <span className="eyebrow">Tap the ones that matter to you</span>
          <ul>
            {steps.map((x) => (
              <li key={x.id}>
                <button type="button" className={'finish-item' + (picked[x.id] ? ' on' : '')} onClick={() => setPicked((p) => ({ ...p, [x.id]: !p[x.id] }))} aria-pressed={!!picked[x.id]}>
                  <Star on={picked[x.id]} />
                  <span><strong>{x.tag}</strong>{x.saved && <span className="muted small"> · {x.saved.hours.toLocaleString('en-US')} hrs a day</span>}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>

        <p className="fine">
          Illustrative estimate from this demo’s numbers, assuming {MINUTES.screen} min to screen an account, {MINUTES.draft} min to draft an action,
          {' '}{MINUTES.call} min per call and {MINUTES.log} min to log a decision. Your numbers will differ.
        </p>

        <div className="row-gap">
          {contact && <a className="btn btn-primary" href={mail}><Icon name="mail" size={16} />{chosen.length ? 'Send my shortlist to Kaara' : 'Talk to Kaara'}</a>}
          <button type="button" className={'btn ' + (contact ? 'btn-outline' : 'btn-primary')} onClick={openBlueprint}><Icon name="layers" size={16} />How Kaara builds this</button>
          <button type="button" className="btn btn-ghost" onClick={onClose}>Explore on my own</button>
        </div>
        <div className="row-gap">
          <button type="button" className="text-btn" onClick={onBack}>Back</button>
          <button type="button" className="text-btn" onClick={onRestart}>Restart the tour</button>
        </div>
      </div>
    </div>
  );
}
