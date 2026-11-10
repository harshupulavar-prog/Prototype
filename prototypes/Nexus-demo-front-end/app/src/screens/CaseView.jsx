import { useState } from 'react';
import { Avatar, Icon, Pill, RiskRing } from '../components/ui.jsx';
import { TONE, getCaseMemoryExamples, riskColor, timeLabel } from '../data.js';
import { Src } from '../components/Sources.jsx';

const MESSAGE_CHANNELS = ['WhatsApp', 'SMS', 'Text', 'Email'];
const REASONS = ['Borrower asked for a call', 'Recent complaint on file', 'Relationship account'];
const ALTERNATIVE_CHANNELS = ['WhatsApp', 'SMS', 'AI voice', 'Email'];
const ALTERNATIVE_SCRIPTS = ['Softer payment reminder', 'Offer a payment plan', 'Ask for a preferred date'];

export default function CaseView({ settings, D, fmt, sel, setSel, go, mode, setMode, changedTo, setChangedTo, approved, bulk, approveRow }) {
  const { US, prospect } = settings;
  const { money } = fmt;
  const r = D.rows[sel] || D.rows[0];
  const tone = TONE[r.tone];
  const first = r.name.split(' ')[0];
  const amt = money(r.overdue || r.emi);
  const [english, setEnglish] = useState(false);
  const [reason, setReason] = useState('');
  const [alternativeChannel, setAlternativeChannel] = useState('');
  const [alternativeScript, setAlternativeScript] = useState('');

  const entry = approved[sel];
  const isApproved = !r.human && (bulk || !!entry);
  const w1 = Math.round(r.risk * 0.42), w2 = Math.round(r.risk * 0.33), w3 = r.risk - w1 - w2;
  const factors = r.factors || [[D.factors[0], w1], [D.factors[1], w2], [D.factors[2], w3]];
  const maxFactor = Math.max(...factors.map(([, p]) => p), 1);
  const likely = Math.max(10, 100 - Math.round(r.risk * 0.85));

  const isEscalate = r.action.toLowerCase().includes('escalat');
  const primaryBtnLabel = isEscalate ? 'Escalate to manager review' : `Approve: ${r.action}`;

  const heroCases = D.rows.map((row, i) => ({ ...row, i })).filter((row) => row.hero);
  const memoryExamples = r.memoryExamples || getCaseMemoryExamples(r, D.hfc, US);

  const isMsgChannel = MESSAGE_CHANNELS.includes(r.channel);
  const isFieldVisit = /^field\b/i.test(r.channel || '');
  const msgChannel = isMsgChannel ? r.channel : US ? 'Text' : r.code === 'en' ? 'SMS' : 'WhatsApp';
  const msg = (english ? D.messageEn(r.code) : D.message(r.code)).replace('{n}', first).replace('{a}', amt);

  const timeline = [
    { text: 'Flagged at ' + r.risk + '% risk', when: (r.flaggedAt || timeLabel(US, 3, 12)) + ' · model ews-v3.2', tone: 'warn' },
    {
      text: r.policyReason
        ? 'Simulation: 94% cure with soft-touch · Policy rule: Escalate to manager review'
        : r.human
        ? 'Sent to your team: ' + r.intent.toLowerCase()
        : 'Plan proposed: ' + r.action.toLowerCase(),
      when: (r.decisionAt || timeLabel(US, 6, 5)) + ' · Nexus NBA',
      tone: r.human || r.policyReason ? 'warn' : 'muted'
    }
  ];
  if (isApproved) {
    const isEsc = (entry && entry.action ? entry.action : r.action).toLowerCase().includes('escalat');
    const action = entry && entry.reason ? entry.action : r.action;
    timeline.push({
      text: entry && entry.reason
        ? 'Changed by you to ' + action.toLowerCase()
        : isEsc
        ? 'Escalation confirmed: Case forwarded to manager review'
        : 'Approved by you: ' + action,
      when: isEsc && r.escalationAt
        ? r.escalationAt + ' · policy guardrail'
        : (entry && entry.at) || (bulk ? 'with the overnight batch' : 'today'),
      tone: 'accent',
      fresh: true
    });
    if (!isEsc) {
      timeline.push({ text: 'Scheduled by ' + (entry && entry.reason ? 'your team' : r.channel) + ' in ' + r.lang, when: 'inside contact hours', tone: 'good', fresh: true });
    } else {
      timeline.push({ text: 'In manager review queue · automated contact paused', when: 'inside contact hours', tone: 'warn', fresh: true });
    }
  } else if (!r.human) {
    timeline.push({
      text: isEscalate ? 'AI recommends Escalate to manager review' : 'Waiting for your approval',
      when: 'now',
      tone: 'accent',
      pulse: true
    });
  }

  const step = (d) => {
    const n = (sel + d + D.rows.length) % D.rows.length;
    setSel(n);
    setEnglish(false);
    setReason('');
    setAlternativeChannel('');
    setAlternativeScript('');
  };

  const confirmChange = () => {
    if (!reason.trim()) return;
    approveRow(sel, { action: changedTo, reason: reason.trim() });
    setMode('idle');
  };

  const confirmReject = () => {
    if (!alternativeChannel || !alternativeScript || !reason.trim()) return;
    approveRow(sel, {
      action: `${alternativeChannel}: ${alternativeScript}`,
      reason: reason.trim()
    });
    setMode('idle');
  };

  return (
    <div className="stack">
      <div className="case-bar">
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => go('queue')}><Icon name="arrowLeft" size={15} />Back to queue</button>
        <div className="pager">
          <button type="button" className="icon-btn" onClick={() => step(-1)} aria-label="Previous case"><Icon name="chevLeft" size={16} /></button>
          <span className="muted small mono">Case {sel + 1} of {D.rows.length}</span>
          <button type="button" className="icon-btn" onClick={() => step(1)} aria-label="Next case"><Icon name="chevRight" size={16} /></button>
        </div>
      </div>

      {heroCases.length > 0 && (
        <div className="hero-selector-bar card pad-sm nx-in">
          <div className="hero-bar-label">
            <span className="tag-hero"><Icon name="spark" size={13} /> Hero cases</span>
            <span className="muted small">Consistent signals, risk scores & AI treatments:</span>
          </div>
          <div className="hero-pills">
            {heroCases.map((hc) => (
              <button
                key={hc.id}
                type="button"
                className={'hero-pill' + (sel === hc.i ? ' on' : '')}
                onClick={() => { setSel(hc.i); setMode('idle'); setChangedTo(''); }}
              >
                <span className="mono strong">{hc.id}</span>
                <span className="hero-pill-risk" style={{ color: riskColor(hc.risk) }}>{hc.risk}%</span>
                <span className="hero-pill-desc">{hc.name.split(' ')[0]} · {hc.bucket}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="case-grid" key={sel}>
        <div className="stack">
          <section className="card case-hero nx-in">
            <div className="case-hero-main">
              <div className="case-id">
                <Avatar name={r.name} tone={tone} />
                <div>
                  <div className="row-gap tight" style={{ alignItems: 'center' }}>
                    {r.id && <span className="case-badge-pill mono">{r.id}</span>}
                    <h2 className="serif case-name">{r.name}</h2>
                  </div>
                  <span className="muted">{r.product} · {r.city} · {r.bucket}, {r.dpd}</span>
                  <div className="chips">
                    <Pill tone={r.segment === 'Thin file' ? TONE.warn : TONE.info}>
                      {r.segment === 'Thin file' ? 'Thin file · No / limited bureau history' : `${r.segment || 'Salaried'} · ${r.bureauScore || 'Bureau on file'}`}
                    </Pill>
                    <Pill tone={tone}>{r.intent}</Pill>
                    <Pill>prefers {r.channel} in {r.lang}</Pill>
                    {r.bucket === 'NPA' ? (
                      <Pill tone={TONE.bad} icon="shield">NPA: legal / recovery track</Pill>
                    ) : r.human ? (
                      <Pill tone={TONE.warn} icon="lock">With your team</Pill>
                    ) : null}
                    {r.hero && <Pill tone={TONE.info}>Hero case</Pill>}
                  </div>
                </div>
              </div>
              <RiskRing value={r.risk} color={riskColor(r.risk)} />
            </div>

            <div className="case-amounts-header" data-tour="case-amounts">
              <div className="case-amount-item is-primary">
                <span className="amount-caption">Overdue amount (chased)</span>
                <span className="amount-num mono" style={{ color: r.overdue ? 'var(--bad)' : 'var(--good)' }}>
                  {r.overdue ? money(r.overdue) : 'None'}
                </span>
                <span className="amount-sub muted">
                  {r.overdue ? `${Math.max(1, Math.round(r.overdue / r.emi))} missed ${Math.round(r.overdue / r.emi) === 1 ? 'EMI' : 'EMIs'}` : 'Up to date · 0 DPD'}
                </span>
              </div>
              <div className="case-amount-item is-primary">
                <span className="amount-caption">{US ? 'Monthly payment' : 'Monthly EMI'}</span>
                <span className="amount-num mono">{money(r.emi)}</span>
                <span className="amount-sub muted">Regular instalment</span>
              </div>
              <div className="case-amount-item is-secondary">
                <div className="row-gap tight" style={{ alignItems: 'center' }}>
                  <span className="amount-caption">Total loan outstanding</span>
                  <span className="badge-secondary-pill">Secondary</span>
                </div>
                <span className="amount-num mono muted-2">{money(r.outstanding)}</span>
                <span className="amount-sub muted">Secondary exposure balance</span>
              </div>
            </div>
          </section>

          <div className="hero-proof-bar card nx-in" style={{ marginTop: '-4px' }}>
            <div className="hero-proof-content">
              <span className="hero-proof-tag"><Icon name="spark" size={13} /> Illustrative</span>
              <p className="hero-proof-text">
                Flags <strong>7 in 10</strong> future defaulters <strong>30 to 60 days</strong> before the first missed EMI
              </p>
            </div>
            <Src ids={['bureau', 'bank', 'nexus']} />
          </div>

          {r.story && (
            <section className="card pad hero-story nx-in" style={{ animationDelay: '30ms' }}>
              <div className="card-head">
                <strong className="row-gap tight"><Icon name="spark" size={16} />AI Recommendation & Story</strong>
                <span className="badge-consistent"><Icon name="check" size={13} stroke={3} /> Consistent Story</span>
              </div>
              <p className="hero-story-text">{r.story}</p>
            </section>
          )}

          <section className="card pad nx-in" style={{ animationDelay: '60ms' }} data-tour="case-why">
            <div className="card-head"><strong>Why Nexus flagged this</strong><span className="muted small">contribution to risk</span></div>
            <div className="factors">
              {factors.map(([text, p], i) => (
                <div key={text} className="factor">
                  <span>{text}</span>
                  <span className="track"><span className="bar grow" style={{ width: Math.min(100, Math.round((p / maxFactor) * 100)) + '%', background: riskColor(r.risk), animationDelay: i * 120 + 'ms' }} /></span>
                  <span className="mono strong" style={{ color: riskColor(r.risk) }}>+{p}%</span>
                </div>
              ))}
            </div>
            <Src ids={['bank', 'pay', 'bureau']} />
            {r.segment === 'Thin file' && (
              <span className="fine" style={{ display: 'block', marginTop: '6px', color: 'var(--warn)' }}>
                Thin-file borrower: Bureau depth is limited; risk signals are derived from Account Aggregator bank cash flows and payment mandate bounces.
              </span>
            )}
            <span className="fine">Model ews-v3.2 · trained only on {prospect} data, inside your environment</span>
          </section>

          <section className="card pad plan nx-in" style={{ animationDelay: '120ms' }}>
            <div className="card-head">
              <strong>Recommended plan</strong>
              <div className="row-gap tight" style={{ alignItems: 'center' }}>
                <span className="confidence-badge mono">
                  <Icon name="spark" size={11} /> {r.confidence || 87}% model confidence
                </span>
                <span className="muted small">
                  {r.policyReason ? '94% predicted cure · Policy Escalate' : r.human ? 'Handled by your team' : likely + '% likely to work'}
                </span>
              </div>
            </div>
            <p className="plan-line">
              {r.action}, by {r.channel} in {r.lang}.
              {isFieldVisit && <span className="sub"> Field visit plan applies to this case.</span>}
            </p>
            {r.secondaryAction && (
              <p className="muted small" style={{ margin: '4px 0 0' }}>Staged plan: {r.secondaryAction}</p>
            )}

            {r.policyReason && (
              <div className="policy-override-card">
                <div className="policy-header">
                  <span className="policy-pill"><Icon name="shield" size={13} /> Policy Guardrail Override</span>
                  <strong>{r.policyReason.title}</strong>
                </div>
                <div className="policy-stated-reason">
                  <strong>Stated reason on screen: </strong>
                  <span>{r.policyReason.statedReason}</span>
                </div>
                <p className="policy-detail">{r.policyReason.detail}</p>
                {r.policyReason.cureComparison && (
                  <div className="cure-comparison-grid">
                    <div className="cure-option highlight">
                      <span className="cure-option-title">Candidate: Soft-Touch Call</span>
                      <span className="cure-option-stat mono" style={{ color: 'var(--good)' }}>{r.policyReason.cureComparison.softTouch}% predicted cure</span>
                      <span className="cure-option-note">Optimal model responsiveness if approved</span>
                    </div>
                    <div className="cure-option mandated">
                      <span className="cure-option-title">AI Recommendation</span>
                      <span className="cure-option-stat mono" style={{ color: 'var(--accent-text)' }}>Escalate to Manager</span>
                      <span className="cure-option-note">Mandatory threshold override</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {r.bucket === 'NPA' ? (
              <div className="callout callout-bad">
                <Icon name="shield" size={16} />
                <span><strong>NPA: Legal / recovery track (90+ DPD).</strong> In India, accounts past 90 DPD are classified as NPA. Autonomous soft-treatment is paused; managed exclusively under SARFAESI / legal recovery track.</span>
              </div>
            ) : r.human ? (
              <div className="callout callout-warn"><Icon name="lock" size={16} />This case is with your team. Nexus will not contact this borrower automatically.</div>
            ) : null}

            {!r.human && !isApproved && mode === 'idle' && (
              <div className="action-buttons-wrap" style={{ marginTop: '16px' }}>
                <div className="ai-action-lead">
                  <span className="eyebrow ai-action-eyebrow">
                    <Icon name="spark" size={13} /> AI Recommended Action
                  </span>
                </div>
                <div className="row-gap action-buttons-row">
                  <button
                    type="button"
                    className={'btn btn-primary btn-action-highlight ' + (isEscalate ? 'btn-escalate' : '')}
                    onClick={() => approveRow(sel, isEscalate ? { action: 'Escalate to manager review' } : undefined)}
                  >
                    <Icon name={isEscalate ? 'shield' : 'check'} size={16} stroke={2.5} />
                    <span>{primaryBtnLabel}</span>
                  </button>

                  <button type="button" className="btn btn-outline" onClick={() => setMode('changing')}>
                    Change plan
                  </button>
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => { setReason(''); setMode('rejecting'); }}>
                    Reject AI recommendation
                  </button>

                  {r.policyReason && (
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      onClick={() => {
                        setChangedTo(r.secondaryAction || 'Soft-touch AI call with split EMI');
                        setReason('');
                        setMode('changed');
                      }}
                      title="Override manager escalation and release soft-touch call directly"
                    >
                      Override & release soft-touch call (94% cure)
                    </button>
                  )}
                </div>
              </div>
            )}

            {!r.human && !isApproved && mode === 'changing' && (
              <div className="nx-in col-gap">
                <span className="muted">Pick another action. Your reason goes into the audit trail.</span>
                <div className="row-gap">
                  {D.altActions.map((a) => (
                    <button key={a} type="button" className="btn btn-outline btn-sm" onClick={() => { setChangedTo(a); setMode('changed'); }}>{a}</button>
                  ))}
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => setMode('idle')}>Cancel</button>
                </div>
              </div>
            )}

            {!r.human && !isApproved && mode === 'rejecting' && (
              <div className="callout nx-in col-gap">
                <span><strong>Choose an alternative.</strong> The AI recommendation will be rejected and your channel and script will be scheduled instead.</span>
                <div className="col-gap">
                  <span className="eyebrow">Channel</span>
                  <div className="row-gap">
                    {ALTERNATIVE_CHANNELS.map((channel) => (
                      <button key={channel} type="button" className={'chip-choice' + (alternativeChannel === channel ? ' on' : '')} onClick={() => setAlternativeChannel(channel)}>
                        {channel}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="col-gap">
                  <span className="eyebrow">Script</span>
                  <div className="row-gap">
                    {ALTERNATIVE_SCRIPTS.map((script) => (
                      <button key={script} type="button" className={'chip-choice' + (alternativeScript === script ? ' on' : '')} onClick={() => setAlternativeScript(script)}>
                        {script}
                      </button>
                    ))}
                  </div>
                </div>
                <label className="field">
                  <span className="eyebrow">Decision note <span className="required-mark">*</span></span>
                  <input
                    className="input"
                    placeholder="Explain why you chose this alternative"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && confirmReject()}
                    aria-label="Mandatory decision note"
                    required
                  />
                </label>
                <div className="row-gap">
                  <button type="button" className="btn btn-primary btn-sm" disabled={!alternativeChannel || !alternativeScript || !reason.trim()} onClick={confirmReject}>
                    Reject and schedule alternative
                  </button>
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => setMode('idle')}>Cancel</button>
                </div>
              </div>
            )}

            {!r.human && !isApproved && mode === 'changed' && (
              <div className="callout nx-in col-gap">
                <span>Changed to <strong>{changedTo}</strong>. Add a reason before it is scheduled.</span>
                <div className="row-gap">
                  {REASONS.map((x) => (
                    <button key={x} type="button" className={'chip-choice' + (reason === x ? ' on' : '')} onClick={() => setReason(x)}>{x}</button>
                  ))}
                </div>
                <div className="row-gap">
                  <input className="input" placeholder="Or type a reason" value={REASONS.includes(reason) ? '' : reason} onChange={(e) => setReason(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && confirmChange()} aria-label="Reason for change" />
                  <button type="button" className="btn btn-primary btn-sm" disabled={!reason.trim()} onClick={confirmChange}>Confirm change</button>
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => setMode('changing')}>Back</button>
                </div>
              </div>
            )}

            {isApproved && (
              <div className="callout callout-good nx-pop">
                <Icon name="check" size={16} stroke={3} />
                {entry && entry.reason ? (
                  <span>Changed to <strong>{entry.action}</strong>. Reason logged: {entry.reason}.</span>
                ) : (entry && entry.action && entry.action.toLowerCase().includes('escalat')) || isEscalate ? (
                  <span>
                    <strong>Escalated to manager review.</strong> Case forwarded to manager queue with comprehensive distress dossier. Autonomous borrower contact paused pending review.
                  </span>
                ) : (
                  <span>Approved by you ({r.action}). Scheduled inside contact hours, {D.contactHours}.</span>
                )}
              </div>
            )}
          </section>

          <section className="card pad nx-in" style={{ animationDelay: '180ms' }} data-tour="case-message">
            <div className="card-head">
              <strong>{isMsgChannel ? 'Message Nexus drafted' : 'Follow-up message Nexus drafted'}</strong>
              {r.code !== 'en' && (
                <button type="button" className="toggle" onClick={() => setEnglish((e) => !e)} aria-pressed={english}>
                  <span className={!english ? 'on' : ''}>{r.lang}</span><span className={english ? 'on' : ''}>English</span>
                </button>
              )}
            </div>
            <div className="phone">
              <div className="phone-top">
                <span className="phone-avatar">{prospect.slice(0, 1).toUpperCase()}</span>
                <span><strong>{prospect}</strong><span className="muted small">{msgChannel}</span></span>
              </div>
              <div className="bubble" key={english ? 'en' : 'native'}>
                <p className="msg nx-in" lang={english ? 'en' : r.code}>{msg}</p>
                <span className="bubble-meta">{msgChannel} · {english ? 'English' : r.lang}{isApproved ? ' · scheduled' : ' · draft'}</span>
              </div>
            </div>
          </section>
        </div>

        <div className="stack">
          <section className="card pad nx-in" style={{ animationDelay: '90ms' }}>
            <div className="facts">
              {[
                ['Overdue amount (chased)', r.overdue ? money(r.overdue) : 'None yet'],
                [US ? 'Monthly payment' : 'Monthly EMI', money(r.emi)],
                ['Total loan outstanding', money(r.outstanding) + ' (secondary)'],
                ['Stage', r.bucket + ', ' + r.dpd],
                ['Borrower segment', r.segment || 'Thin file'],
                ['Bureau score', r.bureauScore || 'No / limited bureau history'],
                ['Preferred channel', r.channel + ' · ' + r.lang],
                ['Promise to pay', r.promiseToPay],
                ['Last contact attempt', r.lastContactAttempt],
                ['Last contact outcome', r.lastContactOutcome],
                ['Contactability', r.contactability],
                ['Preferred language', r.preferredLanguage],
                ['Consent status', r.consentStatus],
                ['Permitted call window', r.bucket === 'NPA' ? 'No automated calls · manager review' : D.contactWindow],
                ['Do-not-contact flags', r.doNotContactFlags],
                ...(r.property ? [['Property', r.property], ['Loan-to-value', r.ltv + '%']] : [])
              ].map(([k, v]) => (
                <div key={k} className="fact">
                  <span className="muted">{k}</span>
                  <strong style={k === 'Bureau score' && String(v).includes('No / limited') ? { color: 'var(--warn)', fontWeight: 600 } : k === 'Overdue amount (chased)' && r.overdue ? { color: 'var(--bad)' } : undefined}>
                    {v}
                  </strong>
                </div>
              ))}
            </div>
            <Src ids={r.property ? ['lms', 'property', 'consent', 'crm'] : ['lms', 'consent', 'crm']} />
          </section>

          <section className="card pad nx-in" style={{ animationDelay: '150ms' }}>
            <div className="card-head"><strong>Timeline</strong></div>
            <ol className="timeline">
              {timeline.map((e, i) => (
                <li key={e.text + i} className={'tl-item' + (e.fresh ? ' nx-in' : '')}>
                  <span className={'tl-dot tl-' + e.tone + (e.pulse ? ' tl-pulse' : '')} />
                  <span className="tl-text">{e.text}</span>
                  <span className="tl-when">{e.when}</span>
                </li>
              ))}
            </ol>
          </section>

          <section data-tour="case-credit" className="card pad credit nx-in" style={{ animationDelay: '210ms' }}>
            <div className="card-head">
              <strong className="row-gap tight"><Icon name="credit" size={16} />What credit learns & portfolio memory</strong>
              <span className="memory-badge">
                <Icon name="spark" size={11} /> Matched to {r.city.split(',')[0]} · {r.product.split(',')[0]}
              </span>
            </div>
            <p className="credit-story-lead">
              {r.creditStory || `This pattern (${(r.factors ? r.factors[0][0] : D.factors[0]).toLowerCase()}, ${r.product.toLowerCase()}, ${r.city.split(',')[0]}) goes into the weekly early-warning review your credit team sees, so collections learnings can shape future lending decisions.`}
            </p>

            <div className="memory-subhead">
              <span className="eyebrow memory-eyebrow">
                Similar historical cases in {r.city.split(',')[0]} ({r.product.split(',')[0]})
              </span>
              <span className="muted fine">Portfolio memory · 2 matching cases</span>
            </div>

            <div className="memory-examples-list">
              {memoryExamples.map((ex) => (
                <div key={ex.id} className="memory-example-card">
                  <div className="memory-example-header">
                    <div className="row-gap tight" style={{ alignItems: 'center' }}>
                      <span className="mono strong memory-case-id">{ex.id}</span>
                      <span className="memory-location-tag">{ex.title}</span>
                    </div>
                    <span className="memory-match-score mono">{ex.match}% match</span>
                  </div>
                  <div className="memory-product-line">
                    <span className="memory-product-badge">{ex.product}</span>
                    <span className="memory-signal-text">{ex.matchReason}</span>
                  </div>
                  <div className="memory-action-box">
                    <div className="memory-box-row">
                      <span className="memory-box-lbl">Action applied:</span>
                      <span className="memory-box-val">{ex.action}</span>
                    </div>
                    <div className="memory-box-row">
                      <span className="memory-box-lbl">Resolution:</span>
                      <span className="memory-box-val" style={{ color: ex.statusTone === 'warn' ? 'var(--warn)' : 'var(--good)', fontWeight: 600 }}>
                        <Icon name="check" size={12} stroke={3} /> {ex.outcome}
                      </span>
                    </div>
                  </div>
                  <div className="memory-credit-takeaway">
                    <span className="takeaway-label">Credit takeaway:</span>
                    <span className="takeaway-text">{ex.creditLearning}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
