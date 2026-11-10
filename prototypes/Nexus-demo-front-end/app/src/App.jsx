import { useCallback, useEffect, useMemo, useState } from 'react';
import { readSettings, initialsOf } from './settings.js';
import { marketData, formatters, clockAt } from './data.js';
import { ALL_SCREENS, NAV, ROLES, people, roleFor, sources } from './framework.js';
import { Icon, LiveDot } from './components/ui.jsx';
import { LensContext } from './components/Sources.jsx';
import Blueprint from './components/Blueprint.jsx';
import Tour from './components/Tour.jsx';
import Overview from './screens/Overview.jsx';
import Queue from './screens/Queue.jsx';
import CaseView from './screens/CaseView.jsx';
import Calls from './screens/Calls.jsx';
import Audit from './screens/Audit.jsx';
import MyDay from './screens/MyDay.jsx';
import Team from './screens/Team.jsx';
import DataSources from './screens/DataSources.jsx';
import Rules from './screens/Rules.jsx';
import Models from './screens/Models.jsx';
import Users from './screens/Users.jsx';
import LinkBuilder from './screens/LinkBuilder.jsx';

// Light by default. The sun/moon button switches it, and the choice is
// remembered on this device.
function useTheme(forced) {
  const [choice, setChoice] = useState(() => {
    if (forced) return forced;
    try { return localStorage.getItem('nx-theme') || 'light'; } catch { return 'light'; }
  });
  useEffect(() => { document.documentElement.setAttribute('data-theme', choice); }, [choice]);
  const dark = choice === 'dark';
  const toggle = () => {
    const next = dark ? 'light' : 'dark';
    setChoice(next);
    try { localStorage.setItem('nx-theme', next); } catch { /* storage blocked */ }
  };
  return { dark, toggle };
}

function screenFromHash() {
  const h = window.location.hash.replace('#', '');
  return ALL_SCREENS.includes(h) ? h : 'case';
}

export default function App() {
  const settings = useMemo(() => readSettings(), []);
  if (settings.builder) return <LinkBuilder />;
  return <CommandCentre settings={settings} />;
}

function CommandCentre({ settings }) {
  const { US, prospect, accent, onAccent, logo } = settings;
  const D = useMemo(() => marketData(US, prospect, settings.profile), [US, prospect, settings.profile]);
  const fmt = useMemo(() => formatters(US), [US]);
  const P = useMemo(() => people(US), [US]);
  const S = useMemo(() => sources(US, D.hfc), [US, D.hfc]);

  const [t, setT] = useState(0);
  const [screen, setScreen] = useState(screenFromHash);
  const [role, setRole] = useState(() => roleFor(screenFromHash(), 'manager'));
  const [lens, setLens] = useState(settings.lens);
  const [sel, setSel] = useState(0);
  const [approved, setApproved] = useState({});
  const [bulk, setBulk] = useState(false);
  const [mode, setMode] = useState('idle');
  const [changedTo, setChangedTo] = useState('');
  const [log, setLog] = useState([]);
  const [blueprintOpen, setBlueprintOpen] = useState(settings.panel === 'blueprint');
  const [logoOk, setLogoOk] = useState(true);
  const [tourOpen, setTourOpen] = useState(settings.tour);

  useEffect(() => {
    document.title = `${prospect}, AI Collections Command Centre`;
    const desc = `AI early-warning signals, automated omnichannel treatments, and predictive borrower resolution for ${prospect}. Measurable outcomes: fewer roll-forwards, fewer field visits, higher cure rate.`;
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute('content', desc);
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.setAttribute('content', `${prospect}, AI Collections Command Centre`);
    const ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogDesc) ogDesc.setAttribute('content', desc);
  }, [prospect]);

  useEffect(() => {
    const id = setInterval(() => setT((x) => x + 1), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    document.title = prospect + ' · Collections command centre';
  }, [prospect]);

  // The prospect's colour, set on the page root so both themes can use it.
  useEffect(() => {
    const root = document.documentElement.style;
    root.setProperty('--accent', accent);
    root.setProperty('--on-accent', onAccent);
    root.setProperty('--accent-line-d', settings.accentLineDark);
    root.setProperty('--accent-text-d', settings.accentTextDark);
    root.setProperty('--accent-line-l', settings.accentLineLight);
    root.setProperty('--accent-text-l', settings.accentTextLight);
  }, [settings, accent, onAccent]);

  const theme = useTheme(settings.theme);

  const go = useCallback((s) => {
    setScreen(s);
    setRole((r) => roleFor(s, r));
    if (window.location.hash !== '#' + s) history.replaceState(null, '', '#' + s);
    window.scrollTo({ top: 0 });
  }, []);

  const switchRole = (r) => {
    setRole(r);
    const targetNav = NAV[r] || NAV.manager;
    if (!targetNav.some((n) => n.id === screen)) go(targetNav[0].id);
  };

  const startTour = () => { setBlueprintOpen(false); setRole('manager'); setTourOpen(true); };

  const nav = NAV[role] || NAV.manager;

  useEffect(() => {
    const onHash = () => { const s = screenFromHash(); setScreen(s); setRole((r) => roleFor(s, r)); window.scrollTo({ top: 0 }); };
    const onKey = (e) => {
      if (e.target.closest('input, textarea, select') || e.metaKey || e.ctrlKey || e.altKey) return;
      if (document.querySelector('.tour-layer, .tour-modal-wrap')) return;
      const i = Number(e.key) - 1;
      if (i >= 0 && i < nav.length) go(nav[i].id);
      if (e.key === 'Escape') setBlueprintOpen(false);
    };
    window.addEventListener('hashchange', onHash);
    window.addEventListener('keydown', onKey);
    return () => { window.removeEventListener('hashchange', onHash); window.removeEventListener('keydown', onKey); };
  }, [go, nav]);

  const now = clockAt(US, t);
  const me = P[role] || P.manager || Object.values(P)[0];
  const you = 'You (' + P.manager.name + ')';

  const addLog = (entry) => setLog((l) => [{ checks: ['Hours', 'Consent', 'Limits'], ...entry, time: clockAt(US, t).short, key: Date.now() + Math.random() }, ...l]);

  const approveRow = (i, change) => {
    if (approved[i] || bulk) return;
    const r = D.rows[i];
    const isEscalation = (change ? change.action : r.action).toLowerCase().includes('escalat');
    setApproved((a) => ({ ...a, [i]: { ...(change || { action: r.action }), at: clockAt(US, t).short } }));
    addLog({
      name: r.name,
      decision: change && change.reason
        ? 'Changed to ' + change.action.toLowerCase() + '. Reason: ' + change.reason
        : isEscalation
        ? 'Escalated to manager review · AI recommendation confirmed'
        : r.action + ', ' + r.channel + ' in ' + r.lang,
      by: you,
      model: change && change.reason ? 'manual override' : 'ews-v3.2'
    });
  };

  const bulkApprove = () => {
    if (bulk) return;
    setBulk(true);
    addLog({ name: fmt.num(pendingCount()) + ' accounts', decision: 'Approved the overnight batch. Scheduled inside contact hours.', by: you, model: 'ews-v3.2' });
  };

  const approvedCount = Object.keys(approved).length;
  function pendingCount() { return bulk ? 0 : Math.max(0, D.prepared - approvedCount); }
  const pending = pendingCount();

  const openCase = (i) => {
    setSel(i);
    setMode('idle');
    setChangedTo('');
    go('case');
  };

  // Concurrent calls: changes every few seconds, not every tick, so it reads calmly.
  const live = 31 + ((Math.floor(t / 4) * 7) % 9);

  const badges = { queue: pending ? { text: fmt.num(pending), strong: true } : null, calls: { text: String(live), live: true } };

  const row = D.rows[sel] || D.rows[0];
  const titles = {
    today: ['My day', 'Your cases for today'],
    overview: ['Overview', 'Good morning. Here is your book.'],
    queue: ['Work queue', 'Ready for your approval'],
    case: ['Case view', row.name],
    calls: ['Live calls', 'Nexus on the phone right now'],
    team: ['Team', 'How the day is going for your team'],
    audit: ['Audit trail', 'Every decision, with a name against it'],
    data: ['Works with what you already run', 'Where every number comes from'],
    rules: ['Rules & guardrails', 'What Nexus may and may not do'],
    models: ['Models', 'Versions, monitoring and releases'],
    users: ['Users & roles', 'Who can see and do what']
  };

  const ctx = { settings, D, fmt, t, now, go, pending, bulk, approved, approveRow, bulkApprove, openCase, live, log, you, P, logAction: addLog, role, openBlueprint: () => setBlueprintOpen(true) };

  return (
    <LensContext.Provider value={{ on: lens, sources: S }}>
      <div className={'shell' + (lens ? ' lens-on' : '')}>
        <aside className="sidebar">
          <div className="brand">
            {logo && logoOk ? (
              <span className="brand-logo"><img src={logo} alt={prospect + ' logo'} onError={() => setLogoOk(false)} /></span>
            ) : (
              <span className="brand-mark">{initialsOf(prospect)}</span>
            )}
            <span className="brand-text">
              <strong>{prospect}</strong>
              <span className="brand-subtitle">{settings.subtitle || 'AI Collections Command Centre'}</span>
            </span>
          </div>

          <div className="role-switch" role="radiogroup" aria-label="View as" data-tour="roles">
            <div className="row-gap" style={{ justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span className="eyebrow role-label">View as</span>
              <span className="sub muted" style={{ fontSize: '11px', fontWeight: 600 }}>{ROLES.find((r) => r.id === role)?.label}</span>
            </div>
            <div className="role-seg">
              {ROLES.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  role="radio"
                  aria-checked={role === r.id}
                  className={role === r.id ? 'on' : ''}
                  onClick={() => switchRole(r.id)}
                  title={r.long}
                >
                  {r.short || r.label}
                </button>
              ))}
            </div>
            <div className="role-sees-caption">
              <span className="sub muted" style={{ fontSize: '11px', lineHeight: 1.35, display: 'block' }}>
                <strong style={{ color: 'var(--text)' }}>Sees: </strong>{ROLES.find((r) => r.id === role)?.sees}
              </span>
            </div>
          </div>

          <nav aria-label="Screens" className="nav" key={role}>
            {nav.map((n, i) => {
              const b = badges[n.id];
              return (
                <button key={n.id} type="button" className={'nav-item nx-in' + (screen === n.id ? ' active' : '')} style={{ animationDelay: i * 30 + 'ms' }}
                  onClick={() => go(n.id)} aria-current={screen === n.id ? 'page' : undefined} title={'Shortcut: ' + (i + 1)}>
                  <Icon name={n.icon} />
                  <span className="nav-label">{n.label}</span>
                  {b && (
                    <span className={'nav-badge' + (b.strong ? ' strong' : '')}>
                      {b.live && <LiveDot color="var(--bad)" size={6} />}
                      {b.text}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          <div className="side-foot">
            <button type="button" className="side-blueprint" onClick={() => setBlueprintOpen(true)}>
              <Icon name="layers" size={16} />
              <span>
                <strong>How Kaara builds this</strong>
                <span>for {prospect}</span>
              </span>
              <Icon name="chevRight" size={16} />
            </button>
            <div className="demo-note">
              <span className="demo-note-head"><Icon name="spark" size={13} /> Built by Kaara Technologies</span>
              <span>All borrowers and figures are illustrative.</span>
              <a href={`mailto:${settings.contact || 'contact@demo.kaara.ai'}`} className="demo-note-link">{settings.contact || 'contact@demo.kaara.ai'}</a>
            </div>
          </div>
        </aside>

        <main className="main">
          <div className="main-glow" aria-hidden="true" />
          <header className="topbar">
            <div className="topbar-title">
              <span className="eyebrow">{titles[screen][0]}</span>
              <h1 key={screen + sel} className="serif nx-in">{titles[screen][1]}</h1>
            </div>
            <div className="topbar-right">
              <span className="chip mono hide-sm"><LiveDot />Live · {now.full}</span>
              <span className="chip chip-amber">Illustrative data</span>
              <button type="button" className={'chip chip-btn chip-lens' + (lens ? ' on' : '')} onClick={() => setLens((x) => !x)} aria-pressed={lens} data-tour="lens"
                title="Show where every number comes from">
                <Icon name="database" size={14} />Data sources
              </button>
              <button type="button" className="icon-btn theme-btn" onClick={theme.toggle}
                aria-label={theme.dark ? 'Switch to light mode' : 'Switch to dark mode'} title={theme.dark ? 'Light mode' : 'Dark mode'}>
                <Icon name={theme.dark ? 'sun' : 'moon'} size={16} />
              </button>
              <button type="button" className="chip chip-tour" onClick={startTour}>
                <Icon name="spark" size={14} />Guided tour
              </button>
              <a
                href={`mailto:${settings.contact || 'contact@demo.kaara.ai'}?subject=${encodeURIComponent('Talk to Kaara, Collections Command Centre')}`}
                className="chip chip-btn chip-talk"
                title="Talk to Kaara Technologies"
              >
                <Icon name="mail" size={14} />Talk to Kaara
              </a>
              <span className="user">
                <span className="user-text hide-sm">
                  <strong>{me.name}</strong>
                  <span>{me.title}</span>
                </span>
                <span className="user-avatar">{me.initials}</span>
              </span>
            </div>
          </header>

          {lens && (
            <div className="lens-bar nx-in">
              <Icon name="database" size={15} />
              <span>Showing where each number comes from. Every source runs inside your environment.</span>
              <button type="button" className="text-btn" onClick={() => go('data')}>See all data sources</button>
            </div>
          )}

          <div className="content" key={screen}>
            {screen === 'today' && <MyDay {...ctx} />}
            {screen === 'overview' && <Overview {...ctx} />}
            {screen === 'queue' && <Queue {...ctx} />}
            {screen === 'case' && (
              <CaseView {...ctx} sel={sel} setSel={(i) => { setSel(i); setMode('idle'); setChangedTo(''); }} mode={mode} setMode={setMode} changedTo={changedTo} setChangedTo={setChangedTo} />
            )}
            {screen === 'calls' && <Calls {...ctx} />}
            {screen === 'team' && <Team {...ctx} />}
            {screen === 'audit' && <Audit {...ctx} />}
            {screen === 'data' && <DataSources {...ctx} />}
            {screen === 'rules' && <Rules {...ctx} />}
            {screen === 'models' && <Models {...ctx} />}
            {screen === 'users' && <Users {...ctx} />}
          </div>

          <footer className="page-footer">
            <div className="page-footer-inner">
              <div className="footer-brand">
                <span className="footer-strong">Built by Kaara Technologies</span>
                <span className="footer-sub">Enterprise AI collections & early warning platform</span>
              </div>
              <div className="footer-actions">
                <a
                  href={`mailto:${settings.contact || 'contact@demo.kaara.ai'}?subject=${encodeURIComponent('Talk to Kaara, Collections Command Centre')}`}
                  className="btn btn-primary btn-sm footer-cta"
                >
                  <Icon name="mail" size={14} /> Talk to Kaara
                </a>
              </div>
              <div className="footer-links">
                <a href={`mailto:${settings.contact || 'contact@demo.kaara.ai'}`} className="footer-link">
                  <Icon name="mail" size={14} /> {settings.contact || 'contact@demo.kaara.ai'}
                </a>
                <a href="https://demo.kaara.ai" target="_blank" rel="noopener noreferrer" className="footer-link">
                  demo.kaara.ai <Icon name="arrowRight" size={12} />
                </a>
              </div>
            </div>
          </footer>
        </main>

        <Tour open={tourOpen} onClose={() => setTourOpen(false)} D={D} fmt={fmt} settings={settings} live={live}
          screen={screen} sel={sel} go={go} openCase={openCase} openBlueprint={() => setBlueprintOpen(true)}
          setRole={setRole} setLens={setLens} startStep={settings.tourStep} />

        <Blueprint open={blueprintOpen} onClose={() => setBlueprintOpen(false)} settings={settings} D={D} />
      </div>
    </LensContext.Provider>
  );
}
