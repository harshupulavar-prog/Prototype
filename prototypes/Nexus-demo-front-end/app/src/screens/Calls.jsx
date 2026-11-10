import { CountUp, Icon, LiveDot, Pill } from '../components/ui.jsx';
import { TONE, pad, timeLabel } from '../data.js';
import { Src } from '../components/Sources.jsx';

const BARS = 28;

export default function Calls({ settings, D, fmt, t, live }) {
  const { US } = settings;
  const { money, num } = fmt;

  const stats = [
    { label: 'Live right now', value: live, fmt: (v) => Math.round(v), color: 'var(--bad)', live: true },
    { label: 'Calls completed today', value: D.callsDone + t * 3, fmt: num },
    { label: 'Paid during the call', value: D.paidOnCalls + t * D.paidOnCallsPerSec, fmt: money, color: 'var(--good)' },
    { label: 'Handed to your team', value: D.handedOff + Math.floor(t / 20), fmt: num, color: 'var(--warn)' }
  ];

  return (
    <div className="stack">
      <section className="kpis">
        {stats.map((s, i) => (
          <div key={s.label} className="card kpi nx-in" style={{ animationDelay: i * 60 + 'ms' }}>
            <div className="kpi-head">
              <span className="kpi-label">{s.label}</span>
              {s.live && <LiveDot color="var(--bad)" />}
            </div>
            <span className="kpi-value serif" style={s.color ? { color: s.color } : undefined}><CountUp value={s.value} format={s.fmt} duration={600} /></span>
          </div>
        ))}
      </section>

      <div className="calls-note">
        <Icon name="shield" size={16} />
        <span>
          Showing 6 of {live} live calls from the {timeLabel(US, 8, 30)} batch, approved by {D.teamLead}. Every call opens by saying it is an automated assistant
          {US ? ' and confirms identity before any account details.' : '.'} Disputes and hardship go straight to a person.
        </span>
      </div>

      <Src ids={['comms', 'pay', 'lms', 'consent']} />
      <section className="calls-grid" data-tour="calls-grid">
        {D.calls.map((k, i) => <CallCard key={k.name} k={k} i={i} t={t} />)}
      </section>
    </div>
  );
}

function CallCard({ k, i, t }) {
  const L = k.lines.length;
  const cycle = L * 2 + 6;
  const ph = (t + i * 3) % cycle;
  const done = ph >= L * 2 + 1;
  const n = Math.min(L, Math.floor(ph / 2) + 1);
  const start = Math.max(0, n - 2);
  const shown = k.lines.slice(start, n).map((text, j) => ({ text, ai: (start + j) % 2 === 0, idx: start + j }));
  const speakingAi = !done && (n - 1) % 2 === 0;
  const secs = 14 + ph * 9;
  const tone = TONE[k.tone];

  return (
    <article className={'card call nx-in' + (done ? ' call-done tone-border-' + k.tone : '')} style={{ animationDelay: i * 70 + 'ms' }}>
      <header className="call-head">
        <div>
          <strong>{k.name}</strong>
          <span className="sub">{k.city} · {k.lang} · English subtitles</span>
        </div>
        <span className="call-timer mono">
          {done ? <span className="ended-dot" /> : <LiveDot color="var(--bad)" size={7} />}
          {Math.floor(secs / 60)}:{pad(secs % 60)}
        </span>
      </header>

      <div className={'wave' + (done ? ' wave-done' : '') + (speakingAi ? ' wave-ai' : ' wave-borrower')} aria-hidden="true">
        {Array.from({ length: BARS }).map((_, b) => (
          <span key={b} style={{ animationDelay: ((b * 137) % 900) / 1000 + 's', animationDuration: 0.7 + ((b * 53) % 50) / 100 + 's', '--h': 0.35 + (((b * 71) % 65) / 100) }} />
        ))}
      </div>
      <div className="speaker small muted">{done ? 'Call ended' : speakingAi ? 'Nexus speaking' : 'Borrower speaking'}</div>

      <div className="subs">
        {shown.map((l) => (
          <div key={l.idx} className={'sub-line ' + (l.ai ? 'from-ai' : 'from-borrower')}>
            <span>{l.text}</span>
          </div>
        ))}
      </div>

      <footer className="call-foot">
        {done ? <Pill tone={tone} className="nx-pop">{k.outcome}</Pill> : <Pill>In progress</Pill>}
      </footer>
    </article>
  );
}
