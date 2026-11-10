import { useLayoutEffect, useRef, useState } from 'react';
import { Icon, LiveDot, Pill } from '../components/ui.jsx';
import { TONE } from '../data.js';
import { ENGINE, MODELS, outputs, sources } from '../framework.js';

// Masked sample fields, so a technical reviewer sees the shape of each feed.
const SAMPLE = {
  lms: [['loan_id', 'LN-••••4821'], ['product', 'personal_loan'], ['instalment', '14200.00'], ['next_due', '2026-10-23'], ['days_past_due', '0']],
  bank: [['account_ref', 'AA-••••7730'], ['salary_credit_day', '9 (usual 1 to 3)'], ['balance_30d_change', '-38%'], ['consent_expires', '2027-04-02']],
  bureau: [['report_date', '2026-10-12'], ['new_accounts_90d', '1'], ['enquiries_30d', '3'], ['other_overdue', 'none']],
  pay: [['event', 'mandate_bounce'], ['amount', '14200.00'], ['reason', 'insufficient_funds'], ['at', '2026-10-05T07:02']],
  crm: [['last_contact', '2026-10-01'], ['promise_date', '2026-10-08'], ['agent_note', '“salary late this month”'], ['write_back', 'enabled']],
  comms: [['channel', 'whatsapp'], ['status', 'read'], ['reply', 'HELP'], ['opt_out', 'false']],
  property: [['property_type', 'flat'], ['city', 'Surat'], ['valuation_date', '2025-11-04'], ['loan_to_value', '58%'], ['construction_stage', 'complete']],
  consent: [['contact_ok', 'true'], ['language', 'ta'], ['quiet_hours', '19:00 to 08:00'], ['dnd', 'false']]
};

const SAMPLE_HFC_LMS = [['loan_id', 'HL-••••3307'], ['product', 'home_loan_self_employed'], ['emi', '28400.00'], ['emi_mode', 'enach'], ['next_presentation', '2026-10-24'], ['days_past_due', '0']];
const SAMPLE_US_LMS = [['loan_id', 'LN-••••8214'], ['product', 'auto_loan'], ['instalment', '412.00'], ['next_due', '2026-10-23'], ['days_past_due', '0']];

function since(min, t) {
  const m = min + Math.floor(t / 60);
  if (min === 0) return 'live';
  if (m < 60) return m + ' min ago';
  if (m < 1440) return Math.round(m / 60) + ' h ago';
  return Math.round(m / 1440) + ' days ago';
}

export default function DataSources({ settings, D, t }) {
  const { US, prospect } = settings;
  const S = sources(US, D.hfc);
  const O = outputs(US);
  const [pick, setPick] = useState('bank');
  const s = S.find((x) => x.id === pick);
  const usedBy = pick === 'property' ? MODELS.filter((m) => m.id === 'ews' || m.id === 'nba') : MODELS.filter((m) => m.inputs.includes(pick));

  return (
    <div className="stack">
      <section className="card env nx-in">
        <span className="env-icon"><Icon name="shield" size={20} /></span>
        <div>
          <strong>Runs inside {prospect}’s cloud account, in a region you choose.</strong>
          <span className="muted">Borrower data never leaves your environment. Nexus reads from your systems, and writes back only to your collections platform. The connectors below are examples; the final list is agreed with your team in the first two weeks.</span>
        </div>
      </section>

      <section className="card pad nx-in" data-tour="data-flow">
        <div className="card-head">
          <strong>Works with what you already run</strong>
          <span className="legend-inline small"><span><i className="flow-key live" />real time</span><span><i className="flow-key" />scheduled</span></span>
        </div>
        <Flow S={S} O={O} pick={pick} setPick={setPick} />
      </section>

      <section className="card pad nx-in source-detail" key={pick}>
        <div className="card-head">
          <div>
            <span className="eyebrow">{s.kind}</span>
            <h3 className="serif detail-title">{s.name}</h3>
          </div>
          <Pill tone={s.ago === 0 ? TONE.ok : s.every === 'Weekly' ? TONE.info : TONE.ok}>{s.ago === 0 ? 'Streaming' : s.every === 'Weekly' ? 'Next file Sunday' : 'Healthy'}</Pill>
        </div>
        <div className="detail-grid">
          <dl className="kv">
            <div><dt>What Nexus uses</dt><dd>{s.feeds}</dd></div>
            <div><dt>Connection</dt><dd>{s.how}</dd></div>
            <div><dt>Refresh</dt><dd>{s.every}</dd></div>
            <div><dt>Last sync</dt><dd className="mono">{since(s.ago, t)}</dd></div>
            <div><dt>Records</dt><dd className="mono">{s.records}</dd></div>
            <div><dt>Used by</dt><dd>{usedBy.length ? usedBy.map((m) => m.name + ' (' + m.version + ')').join(', ') : 'Guardrails and reporting'}</dd></div>
          </dl>
          <div className="sample">
            <span className="eyebrow">Sample record, masked</span>
            <pre>{'{\n' + (pick === 'lms' ? (D.hfc ? SAMPLE_HFC_LMS : US ? SAMPLE_US_LMS : SAMPLE.lms) : SAMPLE[pick]).map(([k, v]) => '  "' + k + '": "' + v + '"').join(',\n') + '\n}'}</pre>
          </div>
        </div>
      </section>

      <section className="card table-card nx-in">
        <div className="table" role="table" aria-label="All data sources">
          <div className="tr th d-grid" role="row">
            <span role="columnheader">Source</span><span role="columnheader">What Nexus uses</span><span role="columnheader">Connection</span>
            <span role="columnheader">Refresh</span><span role="columnheader">Last sync</span><span role="columnheader">Status</span>
          </div>
          {S.map((x, k) => (
            <button type="button" key={x.id} className={'tr d-grid row-in row-btn' + (pick === x.id ? ' is-picked' : '')} style={{ animationDelay: k * 30 + 'ms' }} onClick={() => setPick(x.id)}>
              <span className="cell-2"><strong>{x.name}</strong><span className="sub">{x.kind}</span></span>
              <span>{x.feeds}</span>
              <span className="muted">{x.how}</span>
              <span className="muted">{x.every}</span>
              <span className="mono">{since(x.ago, t)}</span>
              <span>{x.ago === 0 ? <Pill tone={TONE.ok}><LiveDot size={6} />Streaming</Pill> : x.every === 'Weekly' ? <Pill tone={TONE.info}>Scheduled</Pill> : <Pill tone={TONE.ok} icon="check">Healthy</Pill>}</span>
            </button>
          ))}
        </div>
      </section>
      <p className="footnote">Every read and write is logged. Field-level masking applies to anyone without the data-sources permission.</p>
    </div>
  );
}

function Flow({ S, O, pick, setPick }) {
  const wrap = useRef(null);
  const [lines, setLines] = useState({ w: 0, h: 0, a: [], b: [] });

  useLayoutEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const calc = () => {
      const box = el.getBoundingClientRect();
      const hub = el.querySelector('[data-node="hub"]').getBoundingClientRect();
      const srcs = [...el.querySelectorAll('[data-node="src"]')].map((n) => n.getBoundingClientRect());
      const outs = [...el.querySelectorAll('[data-node="out"]')].map((n) => n.getBoundingClientRect());
      // Stacked on small screens: no connectors.
      if (srcs.length && srcs[0].right > hub.left) { setLines({ w: 0, h: 0, a: [], b: [] }); return; }
      const curve = (x1, y1, x2, y2) => { const mx = (x1 + x2) / 2; return `M${x1},${y1} C${mx},${y1} ${mx},${y2} ${x2},${y2}`; };
      const a = srcs.map((r, i) => curve(r.right - box.left, r.top + r.height / 2 - box.top, hub.left - box.left, hub.top - box.top + ((i + 1) * hub.height) / (srcs.length + 1)));
      const b = outs.map((r, i) => curve(hub.right - box.left, hub.top - box.top + ((i + 1) * hub.height) / (outs.length + 1), r.left - box.left, r.top + r.height / 2 - box.top));
      setLines({ w: box.width, h: box.height, a, b });
    };
    calc();
    const ro = new ResizeObserver(calc);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div className="flow" ref={wrap}>
      {lines.w > 0 && (
        <svg className="flow-lines" width={lines.w} height={lines.h} aria-hidden="true">
          {lines.a.map((d, i) => (
            <path key={'a' + i} d={d} className={'flow-path' + (S[i].ago === 0 ? ' live' : '') + (S[i].id === pick ? ' on' : '')} />
          ))}
          {lines.b.map((d, i) => <path key={'b' + i} d={d} className="flow-path out" />)}
        </svg>
      )}
      <div className="flow-col">
        <span className="flow-head eyebrow">Your systems</span>
        {S.map((s) => (
          <button key={s.id} type="button" data-node="src" className={'flow-node' + (pick === s.id ? ' on' : '')} onClick={() => setPick(s.id)} aria-pressed={pick === s.id}>
            {s.ago === 0 ? <LiveDot size={7} /> : <span className="dot-static" />}
            <span><strong>{s.name}</strong><span className="sub">{s.every}</span></span>
          </button>
        ))}
      </div>
      <div className="flow-col flow-mid">
        <span className="flow-head eyebrow">Nexus, in your cloud</span>
        <div className="hub" data-node="hub">
          {ENGINE.map((e) => (
            <div key={e.id} className="hub-item"><Icon name={e.id === 'guard' ? 'shield' : 'cpu'} size={15} /><span><strong>{e.label}</strong><span className="sub">{e.sub}</span></span></div>
          ))}
        </div>
      </div>
      <div className="flow-col">
        <span className="flow-head eyebrow">Where it goes</span>
        {O.map((o) => (
          <div key={o.id} data-node="out" className="flow-node out"><span><strong>{o.label}</strong><span className="sub">{o.sub}</span></span></div>
        ))}
      </div>
    </div>
  );
}
