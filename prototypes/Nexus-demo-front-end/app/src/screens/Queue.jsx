import { useState } from 'react';
import { Avatar, Icon, Pill } from '../components/ui.jsx';
import { TONE, riskColor } from '../data.js';
import { Src } from '../components/Sources.jsx';

export default function Queue({ D, fmt, settings, pending, bulk, approved, approveRow, bulkApprove, openCase }) {
  const { money, num } = fmt;
  const [filter, setFilter] = useState('all');
  const [sortDir, setSortDir] = useState('desc');
  const [working, setWorking] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const isNPA = (r) => r.bucket === 'NPA' || (r.dpd && (parseInt(r.dpd, 10) > 90 || r.dpd.includes('181') || r.dpd.includes('184') || r.dpd.includes('207') || r.dpd.includes('210')));
  const rows = D.rows.map((r, i) => {
    const npa = isNPA(r);
    const priorityScore = r.priorityScore || r.risk || 50;
    return {
      ...r,
      i,
      priorityScore,
      bucket: npa ? 'NPA' : r.bucket,
      human: npa ? true : r.human,
      action: npa ? 'NPA: legal / recovery track' : r.action,
      done: bulk || !!approved[i]
    };
  });
  const sma0 = rows.filter((r) => r.bucket === 'SMA-0').length;
  const sma1 = rows.filter((r) => r.bucket === 'SMA-1').length;
  const sma2 = rows.filter((r) => r.bucket === 'SMA-2').length;
  const npas = rows.filter((r) => isNPA(r) || r.bucket === 'NPA').length;
  const predue = rows.filter((r) => r.bucket === 'Pre-due' || r.bucket === 'Current').length;
  const humans = rows.filter((r) => r.human).length;
  const shown = rows.filter((r) => {
    if (filter === 'all') return true;
    if (filter === 'sma0') return r.bucket === 'SMA-0';
    if (filter === 'sma1') return r.bucket === 'SMA-1';
    if (filter === 'sma2') return r.bucket === 'SMA-2';
    if (filter === 'npa') return isNPA(r) || r.bucket === 'NPA';
    if (filter === 'predue') return r.bucket === 'Pre-due' || r.bucket === 'Current';
    if (filter === 'team') return r.human;
    return true;
  });
  const sorted = [...shown].sort((a, b) =>
    sortDir === 'asc' ? a.priorityScore - b.priorityScore : b.priorityScore - a.priorityScore
  );
  const pageCount = Math.max(1, Math.ceil(sorted.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const pagedRows = sorted.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const firstHuman = rows.find((r) => r.human).i;

  const doBulk = () => {
    setWorking(true);
    setTimeout(() => { bulkApprove(); setWorking(false); }, 1100);
  };

  return (
    <div className="stack">
      <section className="card queue-head nx-in" data-tour="queue-head">
        <div className="queue-head-text">
          {bulk ? (
            <>
              <strong className="serif queue-title">All set. Your team can focus on the hard cases.</strong>
              <span className="muted">{num(D.prepared)} actions scheduled inside contact hours, {D.contactHours}.</span>
            </>
          ) : (
            <>
              <strong className="serif queue-title"><span className="hl">{num(pending)}</span> actions ready for your approval</strong>
              <span className="muted">{num(D.hardship)} hardship and dispute cases are already with your team. Nexus never contacts them automatically.</span>
            </>
          )}
        </div>
        {bulk ? (
          <span className="done-badge nx-pop"><Icon name="check" size={16} stroke={3} />Approved and scheduled</span>
        ) : (
          <button type="button" className={'btn btn-primary btn-lg' + (working ? ' is-working' : '')} onClick={doBulk} disabled={working}>
            {working ? <>Scheduling {num(pending)} actions…</> : <>Approve all {num(pending)}</>}
          </button>
        )}
        {working && <div className="sweep" aria-hidden="true" />}
      </section>

      <div className="tabs" role="tablist" aria-label="Filter the queue">
        {[
          ['all', 'All Buckets', rows.length],
          ['sma0', 'SMA-0 (1 to 30 DPD)', sma0],
          ['sma1', 'SMA-1 (31 to 60 DPD)', sma1],
          ['sma2', 'SMA-2 (61 to 90 DPD)', sma2],
          ['npa', 'NPA (90+ DPD)', npas],
          ['predue', 'Pre-due (0 DPD)', predue],
          ['team', 'With your team', humans]
        ].map(([id, label, n]) => (
          <button key={id} type="button" role="tab" aria-selected={filter === id} className={'tab' + (filter === id ? ' active' : '')} onClick={() => { setFilter(id); setPage(1); }}>
            {label}<span className="tab-n">{n}</span>
          </button>
        ))}
        <Src ids={['nexus', 'lms', 'bank', 'consent']} />
        <span className="tabs-note muted small">Reporting buckets: SMA-0, SMA-1, SMA-2, NPA · Red for high risk, Green for low risk · Confidence shown in neutral tone.</span>
      </div>

      <section className="card table-card nx-in" data-tour="queue-table">
        <div className="table" role="table" aria-label="Work queue">
          <div className="tr th q-grid" role="row">
            <span role="columnheader">Borrower</span>
            <span role="columnheader">Product</span>
            <span role="columnheader">Bucket (SMA / NPA)</span>
            <span role="columnheader">Overdue amount</span>
            <button
              type="button"
              role="columnheader"
              className="th-sort-btn"
              onClick={() => { setSortDir((d) => (d === 'desc' ? 'asc' : 'desc')); setPage(1); }}
              title="Click to sort by Priority Score"
            >
              Priority Score <Icon name={sortDir === 'desc' ? 'arrowDown' : 'arrowUp'} size={12} />
            </button>
            <span role="columnheader">Signal</span>
            <span role="columnheader">Nexus suggests</span>
            <span role="columnheader">Status</span>
          </div>
          {pagedRows.map((r, k) => {
            const tone = TONE[r.tone];
            const change = approved[r.i];
            return (
              <div key={r.name} className={'tr q-grid row-in' + (r.done && !r.human ? ' is-done' : '')} role="row" style={{ animationDelay: k * 35 + 'ms' }}
                data-tour={r.human && r.i === firstHuman ? 'queue-human' : undefined}>
                <div className="cell-borrower" role="cell">
                  <Avatar name={r.name} tone={tone} />
                  <div>
                    <div className="row-gap tight" style={{ alignItems: 'center' }}>
                      {r.id && <span className="case-id-tag mono">{r.id}</span>}
                      <button type="button" className="link-name" onClick={() => openCase(r.i)}>{r.name}</button>
                    </div>
                    <span className="sub">{r.city} · {r.segment || 'Thin file'}</span>
                  </div>
                </div>
                <div className="cell-2" role="cell">
                  <strong>{r.product}</strong>
                  <span className="sub">EMI {money(r.emi)}</span>
                </div>
                <div className="cell-2" role="cell"><strong>{r.bucket}</strong><span className="sub">{r.dpd}</span></div>
                <div className="cell-2 q-amount-cell" role="cell">
                  <div className="q-overdue-row">
                    <strong className="mono q-overdue-val" style={{ color: r.overdue ? 'var(--bad)' : 'var(--good)' }}>
                      {r.overdue ? money(r.overdue) : 'None'}
                    </strong>
                    <span className="q-overdue-lbl">overdue</span>
                  </div>
                  <span className="sub mono q-bal-sub" title="Total loan outstanding (secondary)">Bal {money(r.outstanding)}</span>
                </div>
                <div className="risk" role="cell">
                  <span className="mono strong" style={{ color: riskColor(r.priorityScore) }}>{r.priorityScore}</span>
                  <span className="track thin"><span className="bar grow" style={{ width: r.priorityScore + '%', background: riskColor(r.priorityScore) }} /></span>
                </div>
                <span role="cell"><Pill tone={tone}>{r.intent}</Pill></span>
                <div className="cell-2" role="cell">
                  <span>{change && change.reason ? change.action : r.action}</span>
                  <div className="row-gap tight" style={{ alignItems: 'center', marginTop: '2px', flexWrap: 'wrap' }}>
                    <span className="confidence-tag mono">{r.confidence || 87}% confidence</span>
                    <span className="sub">{r.policyReason ? '94% soft-touch cure · High exposure' : r.channel + ' · ' + r.lang}</span>
                  </div>
                </div>
                <div role="cell">
                  {r.bucket === 'NPA' || isNPA(r) ? (
                    <Pill tone={TONE.bad} icon="shield">NPA: legal / recovery track</Pill>
                  ) : r.human ? (
                    <Pill tone={TONE.warn} icon="lock">With your team</Pill>
                  ) : r.done ? (
                    change && change.reason ? (
                      <span title="Officer chose a different action than the AI suggested">
                        <Pill tone={TONE.ok} icon="check" className="nx-pop">Overridden</Pill>
                      </span>
                    ) : (
                      <Pill tone={TONE.ok} icon="check" className="nx-pop">
                        {(change && change.action && change.action.toLowerCase().includes('escalat')) || r.action.toLowerCase().includes('escalat')
                          ? 'Escalated'
                          : 'Approved'}
                      </Pill>
                    )
                  ) : (
                    <button
                      type="button"
                      className={'btn btn-sm ' + (r.action.toLowerCase().includes('escalat') ? 'btn-primary' : 'btn-outline')}
                      onClick={() => approveRow(r.i, r.action.toLowerCase().includes('escalat') ? { action: 'Escalate to manager review' } : undefined)}
                      title={r.action.toLowerCase().includes('escalat') ? 'Escalate to manager review' : `Approve: ${r.action}`}
                    >
                      {r.action.toLowerCase().includes('escalat') ? 'Escalate' : 'Approve'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        <div className="queue-pagination" aria-label="Queue pagination">
          <span className="muted small">
            Showing {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, sorted.length)} of {sorted.length}
          </span>
          <div className="pager">
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1}>
              Previous
            </button>
            <span className="mono small">Page {currentPage} of {pageCount}</span>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setPage((p) => Math.min(pageCount, p + 1))} disabled={currentPage === pageCount}>
              Next
            </button>
          </div>
        </div>
      </section>
      <p className="footnote">Every action is checked against contact hours, consent and contact limits before it is scheduled. {settings.US ? 'Texts include STOP to opt out.' : 'Messages go out in the borrower’s preferred language.'}</p>
    </div>
  );
}
