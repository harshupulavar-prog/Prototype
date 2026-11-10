import { Avatar, Icon } from '../components/ui.jsx';
import { PERMS, ROLES, users } from '../framework.js';

export default function Users({ settings, P }) {
  const U = users(settings.US, P);
  return (
    <div className="stack" style={{ gap: '22px' }}>
      <div className="row-gap" style={{ justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
        <p className="lead muted" style={{ margin: 0 }}>Everyone sees only what their role needs. Sign-in uses your existing company login.</p>
        <a
          href={`mailto:${settings.contact || 'contact@demo.kaara.ai'}?subject=${encodeURIComponent('Talk to Kaara, Enterprise SSO & Access')}`}
          className="btn btn-outline btn-sm"
        >
          <Icon name="mail" size={14} /> Talk to Kaara
        </a>
      </div>

      {/* Roles & What They See */}
      <section className="card nx-in" style={{ padding: '20px 24px' }}>
        <div style={{ marginBottom: '14px' }}>
          <h3 style={{ margin: '0 0 4px', fontSize: '15.5px', fontWeight: 700 }}>Roles & Visibility</h3>
          <p className="sub muted" style={{ margin: 0 }}>Tailored collections views across operational, leadership, compliance, and administration tiers</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '12px' }}>
          {ROLES.map((r) => (
            <div key={r.id} style={{ padding: '14px 16px', borderRadius: '12px', background: 'var(--sunken)', border: '1px solid var(--line)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span className="badge" style={{ fontWeight: 700, fontSize: '12px', padding: '3px 8px' }}>{r.label}</span>
              </div>
              <p style={{ margin: 0, fontSize: '12.5px', lineHeight: 1.45, color: 'var(--text-2)' }}>
                {r.sees}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Active Users and Permissions Table */}
      <section className="card table-card nx-in">
        <div style={{ padding: '16px 20px 12px', borderBottom: '1px solid var(--line)' }}>
          <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700 }}>Active Users & Permissions</h3>
        </div>
        <div className="table perm-table" role="table" aria-label="Users and permissions">
          <div className="tr th u-grid" role="row">
            <span role="columnheader">Person & Role</span>
            {PERMS.map(([id, label]) => <span key={id} role="columnheader" className="perm-h">{label}</span>)}
          </div>
          {U.map((u, k) => (
            <div key={u.name} className="tr u-grid row-in" role="row" style={{ animationDelay: k * 35 + 'ms' }}>
              <div className="cell-borrower" role="cell">
                <Avatar name={u.name} />
                <span className="cell-2" style={{ minWidth: 0 }}>
                  <strong>{u.name}</strong>
                  <span className="sub"><strong style={{ color: 'var(--text)' }}>{u.role}</strong> · {u.team}</span>
                  <span className="muted" style={{ fontSize: '11.5px', marginTop: '2px', lineHeight: 1.35, display: 'block' }}>
                    <strong>Sees:</strong> {u.sees}
                  </span>
                </span>
              </div>
              {PERMS.map(([id, label]) => (
                <span key={id} role="cell" className="perm-cell" aria-label={label + (u.perms.includes(id) ? ': yes' : ': no')}>
                  {u.perms.includes(id) ? <span className="perm-yes"><Icon name="check" size={13} stroke={3} /></span> : <span className="perm-no" />}
                </span>
              ))}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
