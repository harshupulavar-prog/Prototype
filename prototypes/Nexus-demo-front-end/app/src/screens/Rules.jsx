import { useState } from 'react';
import { Icon, Pill } from '../components/ui.jsx';
import { Src } from '../components/Sources.jsx';
import { TONE } from '../data.js';

function Toggle({ on, onChange, locked, label }) {
  return (
    <button type="button" role="switch" aria-checked={on} aria-label={label} disabled={locked}
      className={'switch' + (on ? ' on' : '') + (locked ? ' locked' : '')} onClick={() => !locked && onChange(!on)}>
      <span />
    </button>
  );
}

export default function Rules({ settings, D, P, logAction }) {
  const { US } = settings;
  const hourOpts = US ? ['8 am to 9 pm local', '9 am to 8 pm local'] : ['8 am to 7 pm', '9 am to 6 pm'];
  const langs = D.languages;
  const start = { hours: hourOpts[0], perWeek: 3, quietDays: true, bulk: true, leads: true, langs: langs.join('|') };
  const [saved, setSaved] = useState(start);
  const [v, setV] = useState(start);
  const set = (k, x) => setV((s) => ({ ...s, [k]: x }));
  const on = new Set(v.langs.split('|'));
  const toggleLang = (l) => { const n = new Set(on); n.has(l) ? n.delete(l) : n.add(l); if (n.size) set('langs', langs.filter((x) => n.has(x)).join('|')); };
  const changes = Object.keys(v).filter((k) => v[k] !== saved[k]);

  const save = () => {
    const words = { hours: 'Contact hours', perWeek: 'Contacts per week', quietDays: 'Quiet days', bulk: 'Bulk approval', leads: 'Team lead approval', langs: 'Languages' };
    changes.forEach((k) => logAction({ name: 'Rule change', decision: words[k] + ' set to ' + (typeof v[k] === 'boolean' ? (v[k] ? 'on' : 'off') : String(v[k]).split('|').join(', ')), by: P.admin.name + ' (admin)', model: 'rules' }));
    setSaved(v);
  };

  const always = ['Hardship', 'Disputes', 'Bereavement', 'Complaints', D.npaLabel];
  const ladder = D.ladder;

  return (
    <div className="stack">
      {changes.length > 0 && (
        <div className="savebar nx-pop">
          <span><strong>{changes.length} unsaved {changes.length === 1 ? 'change' : 'changes'}.</strong> Saved changes are logged in the audit trail with your name.</span>
          <span className="row-gap tight">
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setV(saved)}>Discard</button>
            <button type="button" className="btn btn-primary btn-sm" onClick={save}>Save changes</button>
          </span>
        </div>
      )}

      <div className="grid-2">
        <section className="card pad nx-in">
          <div className="card-head"><strong>When Nexus may contact borrowers</strong><Src ids={['consent']} /></div>
          <div className="setting">
            <span><strong>Contact hours</strong><span className="sub">{US ? 'In each borrower’s own time zone' : 'Every channel, every day it is allowed'}</span></span>
            <div className="seg">
              {hourOpts.map((h) => <button key={h} type="button" className={v.hours === h ? 'on' : ''} onClick={() => set('hours', h)}>{h}</button>)}
            </div>
          </div>
          <div className="setting">
            <span><strong>Most contacts per borrower, per week</strong><span className="sub">All channels together</span></span>
            <div className="stepper">
              <button type="button" className="icon-btn sm" onClick={() => set('perWeek', Math.max(1, v.perWeek - 1))} aria-label="Fewer">−</button>
              <strong className="mono">{v.perWeek}</strong>
              <button type="button" className="icon-btn sm" onClick={() => set('perWeek', Math.min(5, v.perWeek + 1))} aria-label="More">+</button>
            </div>
          </div>
          <div className="setting">
            <span><strong>No contact on Sundays and public holidays</strong></span>
            <Toggle on={v.quietDays} onChange={(x) => set('quietDays', x)} label="Quiet days" />
          </div>
          {US && (
            <div className="setting locked-row">
              <span><strong>STOP opt-out on every text, AI disclosure on every call</strong><span className="sub">Built in. Needs your compliance team’s review before go-live.</span></span>
              <Toggle on locked label="Opt-out and disclosure" />
            </div>
          )}
        </section>

        <section className="card pad nx-in">
          <div className="card-head"><strong>Who approves</strong></div>
          <div className="setting locked-row">
            <span><strong>A person approves every message and call</strong><span className="sub">Locked. Nexus never contacts a borrower on its own.</span></span>
            <Toggle on locked label="Human approval" />
          </div>
          <div className="setting">
            <span><strong>Allow approving a whole batch at once</strong><span className="sub">Hardship and disputes are never in a batch</span></span>
            <Toggle on={v.bulk} onChange={(x) => set('bulk', x)} label="Bulk approval" />
          </div>
          <div className="setting">
            <span><strong>Team leads can approve</strong><span className="sub">Otherwise only managers</span></span>
            <Toggle on={v.leads} onChange={(x) => set('leads', x)} label="Team lead approval" />
          </div>
        </section>
      </div>

      <section className="card pad nx-in">
        <div className="card-head"><strong className="row-gap tight"><Icon name="lock" size={15} />Always sent to a person</strong><span className="muted small">Locked. Nexus stops automated contact the moment it spots one of these.</span></div>
        <div className="row-gap">
          {always.map((a) => <Pill key={a} tone={TONE.warn} icon="lock">{a}</Pill>)}
        </div>
      </section>

      <div className="grid-2">
        <section className="card pad nx-in">
          <div className="card-head"><strong>Languages</strong><span className="muted small">{on.size} switched on</span></div>
          <div className="row-gap">
            {langs.map((l) => (
              <button key={l} type="button" className={'chip-choice' + (on.has(l) ? ' on' : '')} onClick={() => toggleLang(l)} aria-pressed={on.has(l)}>{on.has(l) && <Icon name="check" size={12} stroke={3} />} {l}</button>
            ))}
          </div>
          <span className="fine">Every template is checked by a native speaker before it is switched on.</span>
        </section>

        <section className="card pad nx-in">
          <div className="card-head"><strong>Channel order by stage</strong><span className="muted small">tried left to right</span></div>
          <div className="ladder">
            {ladder.map(([stage, steps]) => (
              <div key={stage} className="ladder-row">
                <strong>{stage}</strong>
                <span className="ladder-steps">
                  {steps.map((s, i) => <span key={s} className="ladder-step">{i > 0 && <Icon name="chevRight" size={12} />}<span className="pill">{s}</span></span>)}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
