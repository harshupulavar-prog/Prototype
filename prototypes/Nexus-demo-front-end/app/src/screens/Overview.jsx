import { useMemo, useState } from 'react';
import { CountUp, Donut, Icon, LiveDot, Sparkline } from '../components/ui.jsx';
import { timeLabel } from '../data.js';
import { Src } from '../components/Sources.jsx';

const CHART_VALS = [42, 48, 45, 52, 55, 51, 58, 62, 60, 66, 69, 67, 73, 78];

export default function Overview({ settings, D, fmt, t, go, bulk, pending, openBlueprint }) {
  const { US } = settings;
  const { money, num } = fmt;
  const collected = D.collectedBase + t * D.collectedPerSec + (bulk ? D.bulkBoost : 0);

  const night = [
    { time: timeLabel(US, 2, 0), text: 'Overnight data in', sub: 'bank, bureau and payment signals', icon: 'moon' },
    { time: timeLabel(US, 3, 10), text: num(D.flagged) + ' flagged early', sub: 'before a payment is missed', icon: 'spark' },
    { time: timeLabel(US, 6, 40), text: num(D.hardship) + ' sent to your team', sub: 'hardship and disputes', icon: 'users' },
    { time: timeLabel(US, 7, 58), text: num(D.prepared) + ' actions ready', sub: 'waiting for your approval', icon: 'check' }
  ];

  const kpis = [
    { src: ['lms'], label: 'Due this cycle', value: D.due, fmt: money, delta: num(D.accounts) + ' accounts', tone: 'muted', spark: [5, 6, 6, 7, 6, 7, 8, 8, 9], color: 'var(--faint)' },
    { src: ['nexus'], label: 'Flagged early', value: D.flagged, fmt: num, delta: money(D.atRisk) + ' at risk', tone: 'warn', spark: [3, 4, 3, 5, 6, 5, 7, 8, 9], color: 'var(--warn)' },
    { src: ['pay'], label: 'Collected today', value: collected, fmt: money, delta: 'Ahead of target', up: true, tone: 'good', spark: [2, 3, 3, 4, 5, 6, 6, 8, 9 + (t % 3) * 0.4], color: 'var(--good)', hero: true },
    { src: ['lms', 'pay'], label: 'Cure rate this month', value: D.cure, fmt: (v) => Math.round(v) + '%', delta: D.cureDelta + ' pts vs last month', up: true, tone: 'good', spark: [4, 4, 5, 5, 6, 6, 7, 8, 9], color: 'var(--accent-line)' }
  ];

  return (
    <div className="stack">
      {settings.profile && (
        <div className="profile-strip nx-in">
          <span className="tag">Built for {settings.prospect}</span>
          <span>Shaped from public information: a home loan and LAP book, mostly self-employed borrowers, eNACH repayments and WhatsApp servicing. All figures below are illustrative.</span>
          <button type="button" className="text-btn" onClick={openBlueprint}>See what we used</button>
        </div>
      )}
      <section className="card hero nx-in" data-tour="hero">
        <div className="hero-main">
          <span className="eyebrow eyebrow-amber"><Icon name="sun" size={14} />This morning</span>
          <p className="hero-line serif">
            While your team slept, Nexus flagged <span className="hl">{num(D.flagged)}</span> {D.hfc ? 'home loan and LAP accounts' : 'accounts'} and prepared <span className="hl">{num(D.prepared)}</span> actions.
          </p>
          <p className="hero-sub">
            <strong className="amber">{num(D.hardship)}</strong> were sent to your team for hardship review. Nothing goes to a borrower until a person approves it.
          </p>
          <div className="hero-actions">
            <button type="button" className="btn btn-primary" onClick={() => go('queue')}>
              {bulk ? 'View the queue' : 'Review and approve'}
              {!bulk && <span className="btn-count">{num(pending)}</span>}
              <Icon name="arrowRight" size={16} />
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => go('calls')}>
              <LiveDot color="var(--bad)" />Listen to live calls
            </button>
          </div>
          <div className="hero-proof-inline">
            <span className="chip chip-amber"><Icon name="spark" size={12} />Illustrative</span>
            <span>Flags <strong>7 in 10</strong> future defaulters <strong>30 to 60 days</strong> before the first missed EMI</span>
          </div>
          <Src ids={['lms', 'bank', 'bureau', 'pay']} />
        </div>
        <ol className="night" aria-label="What happened overnight">
          {night.map((n, i) => (
            <li key={n.time} className="night-step" style={{ animationDelay: 150 + i * 120 + 'ms' }}>
              <span className="night-icon"><Icon name={n.icon} size={15} /></span>
              <span className="night-time mono">{n.time}</span>
              <strong>{n.text}</strong>
              <span>{n.sub}</span>
            </li>
          ))}
        </ol>
      </section>

      <div className="hero-proof-bar card nx-in" data-tour="hero-proof">
        <div className="hero-proof-content">
          <span className="hero-proof-tag"><Icon name="spark" size={13} /> Illustrative</span>
          <p className="hero-proof-text">
            Flags <strong>7 in 10</strong> future defaulters <strong>30 to 60 days</strong> before the first missed EMI
          </p>
        </div>
        <Src ids={['bureau', 'bank', 'nexus']} />
      </div>

      <div className="pillars-strip nx-in">
        <div className="pillar-item">
          <span className="pillar-outcome-tag"><Icon name="spark" size={13} /> Fewer roll-forwards</span>
          <span className="pillar-copy">Pre-due early warning flags distress 30 to 60 days before missed EMI</span>
        </div>
        <div className="pillar-item">
          <span className="pillar-outcome-tag"><Icon name="users" size={13} /> Fewer field visits</span>
          <span className="pillar-copy">Automated digital-first resolution cures accounts before deploying feet-on-street</span>
        </div>
        <div className="pillar-item">
          <span className="pillar-outcome-tag"><Icon name="check" size={13} stroke={3} /> Higher cure rate</span>
          <span className="pillar-copy">Personalized plans and portfolio memory maximize promise-to-pay conversion</span>
        </div>
      </div>

      <section className="kpis" data-tour="kpis">
        {kpis.map((k, i) => (
          <div key={k.label} className={'card kpi nx-in' + (k.hero ? ' kpi-hero' : '')} style={{ animationDelay: 60 * i + 'ms' }}>
            <div className="kpi-head">
              <span className="kpi-label">{k.label}</span>
              {k.hero && <span className="kpi-live"><LiveDot />live</span>}
            </div>
            <span className="kpi-value serif" style={k.hero ? { color: 'var(--good)' } : undefined}>
              <CountUp value={k.value} format={k.fmt} />
            </span>
            <div className="kpi-foot">
              <span className={'kpi-delta tone-' + k.tone}>{k.up && '▲ '}{k.delta}</span>
              <Sparkline data={k.spark} color={k.color} id={'sp' + i} width={96} />
            </div>
            <Src ids={k.src} />
          </div>
        ))}
      </section>

      <section className="grid-2-1">
        <TrendChart D={D} money={money} US={US} />
        <Feed D={D} t={t} money={money} num={num} US={US} />
      </section>

      <section className="grid-3">
        <div className="card pad nx-in">
          <div className="card-head">
            <strong>Your book by reporting bucket</strong>
            <span className="muted small">SMA-0, SMA-1, SMA-2, NPA · amount · accounts</span>
          </div>
          <div className="stages">
            {D.buckets.map((b, i) => {
              const max = Math.max(...D.buckets.map((x) => x.amt));
              return (
                <div key={b.label} className="stage">
                  <div className="stage-label">
                    <strong>{b.label}</strong>
                    <span>{b.sub}</span>
                  </div>
                  <div className="track"><div className="bar grow" style={{ width: (b.amt / max) * 100 + '%', background: 'var(--accent-line)', opacity: 0.35 + i * 0.16, animationDelay: i * 90 + 'ms' }} /></div>
                  <div className="stage-num mono"><strong>{money(b.amt)}</strong><span> · {num(b.n)}</span></div>
                </div>
              );
            })}
          </div>
          <Src ids={['lms']} />
        </div>

        <div className="card pad nx-in">
          <div className="card-head"><strong>Cure rate by region</strong><span className="muted small">this month</span></div>
          <div className="regions">
            {D.regions.map((r, i) => (
              <div key={r[0]} className="region">
                <div className="region-row"><span>{r[0]}</span><span className="mono">{r[1]}%</span></div>
                <div className="track thin"><div className="bar grow" style={{ width: r[1] + '%', background: 'var(--good)', animationDelay: i * 90 + 'ms' }} /></div>
              </div>
            ))}
          </div>
          <Src ids={['lms', 'pay']} />
        </div>

        <ChannelMix D={D} />
      </section>
    </div>
  );
}

function ChannelMix({ D }) {
  const colors = ['var(--accent-line)', 'var(--info)', 'var(--good)', 'var(--warn)', 'var(--faint)'];
  return (
    <div className="card pad nx-in">
      <div className="card-head"><strong>Channel mix</strong><span className="muted small">payments by channel</span></div>
      <div className="mix">
        <Donut items={D.channels} colors={colors}
          center={<text x="50%" y="50%" textAnchor="middle" dominantBaseline="central" className="donut-center">{D.channels.length} channels</text>} />
        <ul className="legend">
          {D.channels.map((c, i) => (
            <li key={c[0]}><span className="legend-dot" style={{ background: colors[i] }} />{c[0]}<strong className="mono">{c[1]}%</strong></li>
          ))}
        </ul>
      </div>
      <Src ids={['comms', 'pay']} />
    </div>
  );
}

function TrendChart({ D, money, US }) {
  const [hover, setHover] = useState(null);
  const W = 640, H = 220, L = 8, R = 8, T = 16, B = 28;
  const days = useMemo(() => {
    const out = [];
    const today = new Date();
    for (let i = 14; i >= 1; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      out.push(d.toLocaleDateString(US ? 'en-US' : 'en-IN', { day: 'numeric', month: 'short' }));
    }
    return out;
  }, [US]);
  const amounts = CHART_VALS.map((v) => (v / 60) * D.dailyTarget);
  const max = (90 / 60) * D.dailyTarget;
  const X = (i) => L + (i * (W - L - R)) / 13;
  const Y = (v) => T + (1 - v / max) * (H - T - B);
  const line = amounts.map((v, i) => X(i).toFixed(1) + ',' + Y(v).toFixed(1)).join(' ');
  const area = `${X(0)},${H - B} ${line} ${X(13)},${H - B}`;
  const ty = Y(D.dailyTarget);
  const h = hover;

  return (
    <div className="card pad nx-in">
      <div className="card-head">
        <strong>Collected vs target · last 14 days</strong>
        <span className="legend-inline small">
          <span><i className="key-line" />collected</span>
          <span><i className="key-dash" />daily target {money(D.dailyTarget)}</span>
        </span>
      </div>
      <div className="chart-wrap" onMouseLeave={() => setHover(null)}>
        <svg viewBox={`0 0 ${W} ${H}`} className="chart" role="img" aria-label="Daily collections rising above target over the last 14 days">
          <defs>
            <linearGradient id="areaFill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" stopColor="var(--accent-line)" style={{ stopOpacity: 'var(--area-op)' }} />
              <stop offset="1" stopColor="var(--accent-line)" stopOpacity="0" />
            </linearGradient>
          </defs>
          {[0.25, 0.5, 0.75].map((f) => (
            <line key={f} x1={L} x2={W - R} y1={T + f * (H - T - B)} y2={T + f * (H - T - B)} stroke="var(--grid)" />
          ))}
          <line x1={L} x2={W - R} y1={ty} y2={ty} stroke="var(--faint)" strokeWidth="1.5" strokeDasharray="5 6" />
          <polygon points={area} fill="url(#areaFill)" className="nx-fade" />
          <polyline points={line} fill="none" stroke="var(--accent-line)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="nx-draw-long" />
          {days.map((d, i) => (i % 2 === 1 || i === 13) && (
            <text key={d} x={X(i)} y={H - 8} textAnchor={i === 13 ? 'end' : 'middle'} className="axis">{d}</text>
          ))}
          {h !== null && (
            <g>
              <line x1={X(h)} x2={X(h)} y1={T} y2={H - B} stroke="var(--line-strong)" />
              <circle cx={X(h)} cy={Y(amounts[h])} r="6" fill="var(--bg)" stroke="var(--accent-line)" strokeWidth="3" />
            </g>
          )}
          <circle cx={X(13)} cy={Y(amounts[13])} r="5" fill="var(--accent-line)" className="pulse-ring" />
          {amounts.map((_, i) => (
            <rect key={i} x={X(i) - (W - L - R) / 26} y={0} width={(W - L - R) / 13} height={H} fill="transparent" onMouseEnter={() => setHover(i)} />
          ))}
        </svg>
        {h !== null && (
          <div className="tooltip" style={{ left: (X(h) / W) * 100 + '%', top: (Y(amounts[h]) / H) * 100 + '%' }}>
            <span className="muted small">{days[h]}</span>
            <strong className="mono">{money(amounts[h])}</strong>
            <span className={amounts[h] >= D.dailyTarget ? 'tone-good small' : 'tone-warn small'}>
              {amounts[h] >= D.dailyTarget ? 'Above' : 'Below'} target by {money(Math.abs(amounts[h] - D.dailyTarget))}
            </span>
          </div>
        )}
      </div>
      <Src ids={['pay']} />
    </div>
  );
}

function Feed({ D, t, money, num, US }) {
  const base = Math.floor(t / 3);
  const pool = D.feedPool;
  const items = [];
  for (let k = 0; k < 6; k++) {
    const i = base - k;
    if (i < 0) break;
    const p = pool[i % pool.length];
    items.push({ key: i, p, when: k === 0 ? 'just now' : k + ' min ago' });
  }
  const seed = [
    { key: 's1', text: num(D.prepared) + ' actions prepared overnight', dot: 'var(--accent-line)', when: timeShort(US, 7, 58) },
    { key: 's2', text: num(D.hardship) + ' hardship cases sent to your team', dot: 'var(--warn)', when: timeShort(US, 6, 40) },
    { key: 's3', text: num(D.flagged) + ' accounts flagged early', dot: 'var(--warn)', when: timeShort(US, 3, 10) }
  ];
  return (
    <div className="card pad feed nx-in">
      <div className="card-head">
        <strong>Live activity</strong>
        <span className="streaming"><LiveDot />streaming</span>
      </div>
      <ul className="feed-list">
        {items.map(({ key, p, when }) => (
          <li key={key} className="feed-item">
            <span className="feed-dot" style={{ background: p.ptp ? 'var(--info)' : 'var(--good)' }} />
            <span className="feed-text">
              {p.ptp ? (
                <>Promise to pay logged <span className="muted">· {p.name}</span></>
              ) : (
                <><strong className="tone-good">{money(p.amt)}</strong> paid <span className="muted">· {p.name}, {p.city}</span></>
              )}
            </span>
            <span className="feed-when">{when}</span>
          </li>
        ))}
        {items.length < 6 && seed.slice(0, 6 - items.length).map((s) => (
          <li key={s.key} className="feed-item">
            <span className="feed-dot" style={{ background: s.dot }} />
            <span className="feed-text">{s.text}</span>
            <span className="feed-when mono">{s.when}</span>
          </li>
        ))}
      </ul>
      <Src ids={['pay', 'crm']} />
    </div>
  );
}

function timeShort(US, h, m) {
  return timeLabel(US, h, m);
}
