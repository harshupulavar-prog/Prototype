import { CountUp, Icon } from '../components/ui.jsx';
import { timeLabel } from '../data.js';
import { Src } from '../components/Sources.jsx';

export default function Audit({ settings, D, fmt, log, pending, bulk }) {
  const { US } = settings;
  const { num } = fmt;
  const checks = US ? ['Hours', 'Consent', 'Limits', 'Opt-out'] : ['Hours', 'Consent', 'Limits'];

  const base = [];
  D.calls.forEach((k, i) => {
    base.push({ key: 'c' + i, sort: 8 * 60 + 28 - i, time: timeLabel(US, 8, 28 - i), name: k.name, decision: 'AI voice call in ' + k.lang, by: D.teamLead + ', team lead', model: 'voice-v2.1' });
    if (k.tone === 'bad') {
      base.push({ key: 'h' + i, sort: 8 * 60 + 41, time: timeLabel(US, 8, 41), name: k.name, decision: 'Dispute raised on the call. Handed to a person.', by: 'Nexus · stopped automated contact', model: 'voice-v2.1', flag: true });
    }
  });
  D.rows.forEach((r, i) => {
    if (r.human) base.push({ key: 'r' + i, sort: 6 * 60 + 5, time: timeLabel(US, 6, 5), name: r.name, decision: 'Sent to a person: ' + r.intent.toLowerCase(), by: 'Nexus · no automated contact', model: 'ews-v3.2', flag: true });
  });
  base.push({ key: 'b', sort: 3 * 60 + 10, time: timeLabel(US, 3, 10), name: num(D.flagged) + ' accounts', decision: 'Flagged early, before a missed payment', by: 'Nexus · for review', model: 'ews-v3.2' });
  base.sort((a, b) => b.sort - a.sort);

  // Every overnight proposal and routing decision is logged, approved or not.
  const decided = D.prepared + D.hardship + log.length;
  const rows = [...log.map((l) => ({ ...l, fresh: true })), ...base];

  return (
    <div className="stack">
      <section className="kpis kpis-3">
        <div className="card kpi nx-in">
          <span className="kpi-label">Decisions logged today</span>
          <span className="kpi-value serif"><CountUp value={decided} format={num} /></span>
          <span className="kpi-delta tone-muted">{bulk ? 'includes the overnight batch you approved' : num(pending) + ' still waiting for approval'}</span>
        </div>
        <div className="card kpi nx-in" style={{ animationDelay: '60ms' }}>
          <span className="kpi-label">Contacts approved by a person</span>
          <span className="kpi-value serif">100%</span>
          <span className="kpi-delta tone-muted">nothing reaches a borrower without sign-off</span>
        </div>
        <div className="card kpi nx-in" style={{ animationDelay: '120ms' }}>
          <span className="kpi-label">Contacts outside permitted hours</span>
          <span className="kpi-value serif tone-good">0</span>
          <span className="kpi-delta tone-muted">{D.contactHours}</span>
        </div>
      </section>

      <Src ids={['nexus', 'crm', 'consent']} />
      <section className="card table-card nx-in" data-tour="audit-table">
        <div className="table" role="table" aria-label="Audit trail">
          <div className="tr th a-grid" role="row">
            <span role="columnheader">Time</span><span role="columnheader">Case</span><span role="columnheader">Decision</span>
            <span role="columnheader">By</span><span role="columnheader">Model</span><span role="columnheader">Checks</span>
          </div>
          {rows.map((a, k) => (
            <div key={a.key} className={'tr a-grid row-in' + (a.fresh ? ' is-fresh' : '')} role="row" style={{ animationDelay: Math.min(k, 12) * 30 + 'ms' }}>
              <span className="mono muted" role="cell">{a.time}</span>
              <strong role="cell">{a.name}</strong>
              <span role="cell" className={a.flag ? 'tone-warn' : ''}>{a.decision}</span>
              <span role="cell" className={a.fresh ? 'strong' : 'muted-2'}>{a.by}{a.fresh && <span className="new-tag">new</span>}</span>
              <span className="mono muted" role="cell">{a.model}</span>
              <span className="checks" role="cell">
                {checks.map((c) => <span key={c} className="check"><Icon name="check" size={11} stroke={3} />{c}</span>)}
              </span>
            </div>
          ))}
        </div>
      </section>
      <p className="footnote">Approve or change a case in the work queue and it appears here instantly, with your name against it.</p>
    </div>
  );
}
