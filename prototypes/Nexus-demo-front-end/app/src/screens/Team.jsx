import { Avatar, Pill } from '../components/ui.jsx';
import { Src } from '../components/Sources.jsx';
import { TONE } from '../data.js';
import { team } from '../framework.js';

const STATUS = { 'On a call': TONE.info, Available: TONE.ok, 'Wrap-up': TONE.warn, 'On a break': null };

export default function Team({ settings, D, fmt }) {
  const { num } = fmt;
  const T = team(settings.US);
  const tot = T.reduce((a, x) => ({ cases: a.cases + x.cases, calls: a.calls + x.calls, ptp: a.ptp + x.ptp, hardship: a.hardship + x.hardship }), { cases: 0, calls: 0, ptp: 0, hardship: 0 });
  const aiShare = Math.round((D.prepared / (D.prepared + tot.cases)) * 100);

  return (
    <div className="stack">
      <section className="kpis">
        {[
          ['Cases with people today', num(tot.cases), 'the ones that need judgement'],
          ['Handled by Nexus', aiShare + '%', num(D.prepared) + ' routine actions, all approved'],
          ['Calls by your team', num(tot.calls), 'so far today'],
          ['Hardship cases owned', num(tot.hardship), 'each with a named owner']
        ].map(([l, v, s], i) => (
          <div key={l} className="card kpi nx-in" style={{ animationDelay: i * 50 + 'ms' }}>
            <span className="kpi-label">{l}</span>
            <span className="kpi-value serif">{v}</span>
            <span className="kpi-delta tone-muted">{s}</span>
          </div>
        ))}
      </section>

      <section className="card pad nx-in">
        <div className="card-head"><strong>Who is doing what</strong><span className="muted small">Nexus takes the routine work, so the team spends its time on the hard calls</span></div>
        <div className="split-bar" aria-label={'Nexus ' + aiShare + '%, your team ' + (100 - aiShare) + '%'}>
          <span style={{ width: aiShare + '%' }} className="grow"><strong>Nexus</strong> {aiShare}%</span>
          <span style={{ width: 100 - aiShare + '%' }}><strong>Your team</strong> {100 - aiShare}%</span>
        </div>
        <Src ids={['nexus', 'crm']} />
      </section>

      <section className="card table-card nx-in">
        <div className="table" role="table" aria-label="Team">
          <div className="tr th t-grid" role="row">
            <span role="columnheader">Team member</span><span role="columnheader">Cases today</span><span role="columnheader">Calls</span>
            <span role="columnheader">Promises</span><span role="columnheader">Promises kept, 30 days</span><span role="columnheader">Hardship owned</span><span role="columnheader">Now</span>
          </div>
          {T.map((m, k) => (
            <div key={m.name} className="tr t-grid row-in" role="row" style={{ animationDelay: k * 35 + 'ms' }}>
              <div className="cell-borrower" role="cell"><Avatar name={m.name} /><strong>{m.name}</strong></div>
              <span className="mono" role="cell">{m.cases}</span>
              <span className="mono" role="cell">{m.calls}</span>
              <span className="mono" role="cell">{m.ptp}</span>
              <div className="risk" role="cell">
                <span className="mono strong">{m.kept}%</span>
                <span className="track thin"><span className="bar grow" style={{ width: m.kept + '%', background: 'var(--good)' }} /></span>
              </div>
              <span className="mono" role="cell">{m.hardship}</span>
              <span role="cell"><Pill tone={STATUS[m.status]}>{m.status}</Pill></span>
            </div>
          ))}
        </div>
      </section>
      <div className="row-gap"><Src ids={['crm', 'pay']} /></div>
    </div>
  );
}
