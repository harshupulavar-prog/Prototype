import { useState } from 'react';
import { Avatar, CountUp, Icon, LiveDot, Pill } from '../components/ui.jsx';
import { Src } from '../components/Sources.jsx';
import { TONE } from '../data.js';

// What Nexus suggests the agent does, by the reason the case came to a person.
const GUIDE = {
  'Salary credit missed': { offer: 'Acknowledge the cash-flow crunch with empathy. Offer a structured 2-part split EMI and realign the schedule with verified salary receipt.', avoid: 'Do not threaten legal or recovery action on this call.' },
  'Late EMIs & missing salary': { offer: 'Acknowledge the cash-flow crunch with empathy. Offer a structured 2-part split EMI and realign the schedule with verified salary receipt.', avoid: 'Do not threaten legal or recovery action on this call.' },
  'Late EMIs & missing business inflows': { offer: 'Offer a 2-part split EMI and align next debit date with business receivables cycle.', avoid: 'Do not raise SARFAESI or legal action.' },
  'Late EMIs & missing paycheck': { offer: 'Offer a split payment plan aligned with next pay deposit.', avoid: 'Do not demand full balance immediately.' },
  'Commercial turnover dip (42%)': { offer: 'Ask how they are managing business cash flow. Take down dispute details on interest / charges and offer hardship relief or restructured tenure.', avoid: 'No pressure for immediate lump-sum payment; adhere to MSME hardship protocols.' },
  'Hardship & dispute flagged': { offer: 'Ask how they are managing. Take down dispute details on interest / charges and offer hardship relief.', avoid: 'No pressure for immediate payment; adhere to hardship protocols.' },
  'Commercial cash-flow contraction (42%)': { offer: 'Conduct comprehensive hardship assessment and note dispute items for underwriting review.', avoid: 'Do not demand immediate payment on disputed items.' },
  'Hardship signs & dispute': { offer: 'Conduct comprehensive hardship assessment and note dispute items for underwriting review.', avoid: 'Do not demand immediate payment on disputed items.' },
  'eNACH presentation pending': { offer: 'Provide 1-tap instant payment link or confirm balance for mandate presentation.', avoid: 'Keep communication brief and respectful.' },
  'eNACH mandate retry pending': { offer: 'Provide 1-tap instant payment link or confirm balance for mandate re-presentation.', avoid: 'Keep communication brief and respectful.' },
  'ACH debit retry pending': { offer: 'Provide 1-tap instant payment link or confirm ACH debit retry date.', avoid: 'Keep communication brief and respectful.' },
  'Routine oversight': { offer: 'Provide 1-tap instant payment link and confirm receipt while on call.', avoid: 'Keep communication brief and respectful.' },
  'Payroll deposit shifted': { offer: 'Confirm the updated salary date and reschedule the presentation date to 2 days after payday.', avoid: 'Do not apply bounce or late fees for communicated pay shifts.' },
  'Payday shifted later': { offer: 'Confirm the updated salary date and reschedule the presentation date to 2 days after payday.', avoid: 'Do not apply bounce or late fees for communicated pay shifts.' },
  'Paycheck date shifted': { offer: 'Move due date 5 days forward to align with borrower payroll deposit.', avoid: 'Do not treat as intentional default.' },
  'Salary date delayed': { offer: 'Offer to reschedule eNACH auto-debit to 2 days after revised salary deposit.', avoid: 'Do not apply penalty charges.' },
  'Interest reset dispute': { offer: 'Do not ask for immediate payment. Take down borrower’s dispute points on interest reset and route to operations for review.', avoid: 'Do not discuss the overdue amount as settled fact.' },
  'Dispute raised': { offer: 'Do not ask for payment. Take down what the borrower says is wrong and send it to review.', avoid: 'Do not discuss the overdue amount as settled fact.' },
  'Medical hardship declaration': { offer: 'Express empathy and initiate medical hardship documentation. Offer payment pause or 3-month reduced EMI relief.', avoid: 'No aggressive recovery pressure while hardship claim is active.' },
  'Hardship signs': { offer: 'Ask how they are managing. Offer a payment pause or a smaller instalment for three months.', avoid: 'No pressure for payment on this call.' },
  'GST filing lapse': { offer: 'Align revised repayment date with pending GST input credit / filing cycle.', avoid: 'Do not treat this as intentional default yet.' },
  'Tax filing lapse': { offer: 'Align revised repayment date with pending tax return filing date.', avoid: 'Do not treat this as intentional default yet.' },
  'GST filing late': { offer: 'Move this month’s due date to after their filing date.', avoid: 'Do not treat this as a missed payment yet.' },
  'Business inflows down': { offer: 'Ask when their buyers usually pay. Offer to move the EMI date to just after that, for the next three months.', avoid: 'Do not raise the property or legal action on a first call.' },
  'Multiple bureau inquiries': { offer: 'Review overall debt burden. Inquire on liquidity needs and offer structured top-up or loan consolidation if eligible.', avoid: 'Do not disclose other institutional bureau inquiries directly.' },
  'New loan elsewhere': { offer: 'Check the EMI still fits alongside the new loan. Offer a top-up review only if your policy allows it.', avoid: 'Do not discuss their other lender.' },
  'Mandate bounce (insufficient funds)': { offer: 'Confirm funds availability and agree on an immediate eNACH re-presentment date or instant UPI link.', avoid: 'Do not add penal bounce charges without checking supervisor waiver policy.' },
  'ACH return (insufficient funds)': { offer: 'Confirm account balance and set an agreed ACH retry date or debit card payment.', avoid: 'Do not add returned-item fees if borrower confirms date.' },
  'eNACH bounce, one-off': { offer: 'Confirm funds are back and agree a retry date. Mention the UPI link as a backup.', avoid: 'Do not add bounce charges on this call without a team lead.' },
  'Partial UPI repayment': { offer: 'Acknowledge partial amount received. Set a firm promise-to-pay date for the remainder without late fee escalation.', avoid: 'Do not dismiss partial effort made by borrower.' },
  'Partial card repayment': { offer: 'Acknowledge partial credit received. Set an agreed payment plan for remaining balance.', avoid: 'Do not dismiss partial effort made by borrower.' },
  'Willing to pay': { offer: 'Confirm the payment method (UPI / debit) and send payment link while on the line.', avoid: 'Keep call prompt and supportive.' },
  'Unreachable (3 call cycles)': { offer: 'Verify secondary contact numbers and employer alternate phone. Try localized digital channels.', avoid: 'Do not log skipped call without attempting all verified numbers.' },
  'SARFAESI 13(2) notice issued': { offer: 'Direct borrower to regional recovery officer or advocate. Explain 60-day statutory response window under SARFAESI.', avoid: 'Do not accept partial settlements without recovery committee sign-off.' },
  'Commercial collateral recall': { offer: 'Direct account to secured assets legal unit for formal resolution / OTS.', avoid: 'Do not offer unauthorized uncollateralized waivers.' },
  'Charge-off legal recall (200+ DPD)': { offer: 'Route borrower to specialized recoveries. Outline formal settlement options.', avoid: 'Adhere strictly to Fair Debt Collection Practices Act.' },
  'Collateral repossession notice (180+ DPD)': { offer: 'Refer borrower to asset liquidation / legal team for formal cure opportunity.', avoid: 'Strict adherence to statutory repossession guidelines.' },
  'Payment returned': { offer: 'Offer to retry the payment on a new date or switch to a debit card.', avoid: 'Do not add fees on this call without a team lead.' }
};
const DEFAULT_GUIDE = { offer: 'Confirm the amount, then offer a date that fits their pay cycle.', avoid: 'Keep to the approved script.' };

const OUTCOMES = [
  ['ptp', 'Promise to pay', TONE.info],
  ['paid', 'Paid', TONE.ok],
  ['follow', 'Call back later', TONE.warn],
  ['review', 'Sent to review', TONE.warn]
];

export default function MyDay({ settings, D, fmt, t, P, openCase, logAction }) {
  const { US } = settings;
  const { money, num } = fmt;
  const me = P.agent;
  const mine = D.rows.map((r, i) => ({ ...r, i })).filter((r) => r.human || /Your (caller|agent)/.test(r.channel));
  const [sel, setSel] = useState(mine[0].i);
  const [done, setDone] = useState({});
  const r = D.rows[sel];
  const g = GUIDE[r.intent] || DEFAULT_GUIDE;
  const handoff = D.calls.find((c) => c.tone === 'bad');
  const ptps = D.feedPool.filter((p) => p.ptp).slice(0, 3);
  const doneCount = Object.keys(done).length;

  const logOutcome = (id, label) => {
    setDone((d) => ({ ...d, [sel]: label }));
    logAction({ name: r.name, decision: 'Call outcome: ' + label.toLowerCase(), by: me.name + ' (Collections Officer)', model: 'manual' });
    const next = mine.find((m) => m.i !== sel && !done[m.i]);
    if (next) setTimeout(() => setSel(next.i), 600);
  };

  const overdueInQueue = Math.max(0, mine.filter((m) => !done[m.i]).reduce((s, m) => s + (m.overdue || m.emi || 0), 0));
  const collectedToday = (US ? 2140 : 96000) + doneCount * (US ? 180 : 8200);
  const collectedThisWeek = (US ? 14800 : 642000) + doneCount * (US ? 180 : 8200);

  const tiles = [
    {
      label: 'Overdue in my queue',
      value: overdueInQueue,
      fmt: money,
      sub: `${US ? '$' : '₹'}${overdueInQueue.toLocaleString(US ? 'en-US' : 'en-IN')} total · ${Math.max(0, mine.length - doneCount)} cases`,
      src: ['lms', 'crm']
    },
    {
      label: 'Collected today / this week',
      value: collectedToday,
      display: `${money(collectedToday)} / ${money(collectedThisWeek)}`,
      sub: `${money(collectedToday)} today · ${money(collectedThisWeek)} this week`,
      good: true,
      src: ['pay']
    },
    {
      label: 'Critical cases with you',
      value: Math.max(0, 16 - doneCount),
      fmt: num,
      sub: 'Top 6 prioritized below',
      src: ['crm']
    },
    {
      label: 'Calls made',
      value: 7 + doneCount + Math.floor(t / 90),
      fmt: num,
      sub: `${doneCount} outcomes logged`,
      src: ['crm']
    }
  ];

  return (
    <div className="stack">
      <section className="card welcome nx-in">
        <div>
          <span className="eyebrow">Good morning, {me.name.split(' ')[0]}</span>
          <p className="welcome-line serif">Nexus handled the routine work overnight. Your cases are lined up with call notes, starting with the <span className="hl">Top 6 critical cases</span> (of 16 assigned today).</p>
        </div>
        <div className="tiles">
          {tiles.map((k) => (
            <div key={k.label} className="tile">
              <span className="kpi-label">{k.label}</span>
              <strong className="serif tile-num" style={k.good ? { color: 'var(--good)' } : undefined}>
                {k.display ? (
                  <span style={{ fontSize: '24px', letterSpacing: '-0.02em' }}>{k.display}</span>
                ) : (
                  <CountUp value={k.value} format={k.fmt} duration={600} />
                )}
              </strong>
              {k.sub && <span className="sub muted" style={{ fontSize: '11px', lineHeight: 1.3 }}>{k.sub}</span>}
              <Src ids={k.src} />
            </div>
          ))}
        </div>
      </section>

      <div className="split">
        <section className="card pad nx-in" data-tour="agent-list">
          <div className="card-head">
            <strong>Top 6 critical cases</strong>
            <span className="muted small">Showing Top 6 of 16 assigned · ordered by priority</span>
          </div>
          <ul className="next-list">
            {mine.map((m) => (
              <li key={m.i}>
                <button type="button" className={'next-item' + (sel === m.i ? ' on' : '') + (done[m.i] ? ' done' : '')} onClick={() => setSel(m.i)} aria-pressed={sel === m.i}>
                  <Avatar name={m.name} tone={TONE[m.tone]} />
                  <span className="next-main">
                    <strong>{m.name}</strong>
                    <span className="sub">{m.product} · {m.city} · {m.overdue ? money(m.overdue) + ' overdue' : 'due soon'}</span>
                  </span>
                  {done[m.i] ? <Pill tone={TONE.ok} icon="check">{done[m.i]}</Pill> : <Pill tone={TONE[m.tone]}>{m.intent}</Pill>}
                </button>
              </li>
            ))}
          </ul>
          <Src ids={['nexus', 'crm']} />
        </section>

        <section className="card pad prep nx-in" key={sel}>
          <div className="card-head">
            <strong className="row-gap tight"><Icon name="spark" size={16} />Call notes from Nexus</strong>
            <span className="muted small">{r.lang} · {D.contactWindow}</span>
          </div>
          <div className="prep-who">
            <h2 className="serif">{r.name}</h2>
            <span className="muted">{r.product} · {r.bucket}, {r.dpd} · {r.overdue ? money(r.overdue) + ' overdue' : money(r.emi) + ' due'}</span>
          </div>

          <div className="prep-block">
            <span className="eyebrow">Why this is with you</span>
            <p>{r.intent}. {r.human ? 'Nexus will not contact this borrower automatically.' : 'The amount and history make this one for a person.'}</p>
          </div>
          <div className="prep-block">
            <span className="eyebrow">Suggested approach</span>
            <p>{g.offer}</p>
          </div>
          <div className="prep-block">
            <span className="eyebrow">Avoid</span>
            <p className="muted">{g.avoid}</p>
          </div>
          <div className="prep-block">
            <span className="eyebrow">What Nexus noticed</span>
            <ul className="prep-signals">
              {D.factors.map((f) => <li key={f}>{f}</li>)}
            </ul>
            <Src ids={['bank', 'pay', 'bureau']} />
          </div>

          {done[sel] ? (
            <div className="callout callout-good nx-pop"><Icon name="check" size={16} stroke={3} />Logged as “{done[sel]}”. It is in the audit trail and synced back to your collections platform.</div>
          ) : (
            <div className="col-gap">
              <span className="small muted">After the call, log what happened:</span>
              <div className="row-gap">
                {OUTCOMES.map(([id, label]) => (
                  <button key={id} type="button" className="btn btn-outline btn-sm" onClick={() => logOutcome(id, label)}>{label}</button>
                ))}
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => openCase(sel)}>Open full case<Icon name="arrowRight" size={14} /></button>
              </div>
            </div>
          )}
        </section>
      </div>

      <div className="grid-2">
        <section className="card pad nx-in">
          <div className="card-head"><strong className="row-gap tight"><LiveDot color="var(--warn)" />Handed to you by an AI call</strong><span className="muted small">{fmt.num(1)} this morning</span></div>
          <div className="handoff">
            <Avatar name={handoff.name} tone={TONE.bad} />
            <div>
              <strong>{handoff.name}</strong>
              <span className="sub">{handoff.city} · {handoff.lang}</span>
              <p className="small">“{handoff.lines[handoff.lines.length - 3]}” The AI agent stopped and passed this to the team with the full transcript.</p>
            </div>
          </div>
          <Src ids={['comms', 'crm']} />
        </section>

        <section className="card pad nx-in">
          <div className="card-head"><strong>Promises due today</strong><span className="muted small">Nexus will remind them first</span></div>
          <ul className="mini-list">
            {ptps.map((p, i) => (
              <li key={p.name}><span>{p.name}<span className="sub">{p.city}</span></span><span className="muted small">{['11:00', '14:30', '17:00'][i]}</span></li>
            ))}
          </ul>
          <Src ids={['crm']} />
        </section>
      </div>
    </div>
  );
}
