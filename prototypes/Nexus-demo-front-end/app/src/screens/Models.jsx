import { useState } from 'react';
import { Icon, Pill } from '../components/ui.jsx';
import { Src } from '../components/Sources.jsx';
import { TONE } from '../data.js';
import { MODELS } from '../framework.js';

export default function Models({ settings, P, logAction }) {
  const { prospect } = settings;
  const [promoted, setPromoted] = useState(false);

  const promote = () => {
    setPromoted(true);
    logAction({ name: 'Early-warning model', decision: 'Promoted ews-v3.3 to live after review', by: P.admin.name + ' (admin)', model: 'ews-v3.3' });
  };

  return (
    <div className="stack">
      <section className="card env nx-in">
        <span className="env-icon"><Icon name="code" size={20} /></span>
        <div>
          <strong>{prospect} owns these models and the code around them.</strong>
          <span className="muted">Trained only on your data, inside your environment. A new version goes live only after a person in your team reviews and promotes it.</span>
        </div>
      </section>

      <section className="models">
        {MODELS.map((m, i) => (
          <article key={m.id} className="card pad model nx-in" style={{ animationDelay: i * 50 + 'ms' }}>
            <div className="card-head">
              <div>
                <strong className="model-name">{m.name}</strong>
                <span className="sub mono">{m.id === 'ews' && promoted ? 'ews-v3.3' : m.version} · live</span>
              </div>
              <div className="row-gap tight" style={{ alignItems: 'center' }}>
                {m.outcome && <span className="pillar-badge"><Icon name="check" size={12} stroke={3} /> {m.outcome}</span>}
                <Pill tone={TONE.ok} icon="check">Monitoring normal</Pill>
              </div>
            </div>
            <p className="muted small model-job">{m.job}</p>
            <dl className="kv compact">
              <div><dt>Last retrained</dt><dd>{m.retrained}</dd></div>
              <div><dt>Next retrain</dt><dd>{m.next}</dd></div>
              <div><dt>Explains each decision</dt><dd>Yes</dd></div>
              <div><dt>Fairness checks</dt><dd>Passed on last run</dd></div>
            </dl>
            <Src ids={m.inputs} />
            {m.candidate && (
              promoted ? (
                <div className="callout callout-good nx-pop"><Icon name="check" size={16} stroke={3} />{m.candidate} is live. The previous version is kept for one-click rollback.</div>
              ) : (
                <div className="candidate">
                  <span><strong>{m.candidate} is ready for review</strong><span className="sub">Trained on data up to 30 Sep. Side-by-side comparison attached.</span></span>
                  <button type="button" className="btn btn-primary btn-sm" onClick={promote}>Promote to live</button>
                </div>
              )
            )}
          </article>
        ))}
      </section>
    </div>
  );
}
