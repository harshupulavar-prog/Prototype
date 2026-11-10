import { useState } from 'react';
import { Icon } from '../components/ui.jsx';
import { ROLES } from '../framework.js';
import { initialsOf } from '../settings.js';

export default function Login({ settings, P, onLogin }) {
  const { prospect, logo } = settings;
  const [selectedRole, setSelectedRole] = useState('manager');
  const [email, setEmail] = useState(() => `${P.manager?.short?.toLowerCase().replace(/[^a-z]/g, '') || 'manager'}@kaara.ai`);
  const [password, setPassword] = useState('••••••••••••');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSelectRole = (roleId) => {
    setSelectedRole(roleId);
    const person = P[roleId] || P.manager;
    const handle = person?.short?.toLowerCase().replace(/[^a-z]/g, '') || roleId;
    setEmail(`${handle}@kaara.ai`);
    setPassword('••••••••••••');
  };

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      onLogin(selectedRole);
    }, 350);
  };

  const handleSso = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      onLogin('manager');
    }, 400);
  };

  return (
    <div className="login-screen">
      <div className="login-glow" aria-hidden="true" />
      <div className="login-card card nx-in">
        <div className="login-brand">
          <div className="login-logo-wrap">
            {logo ? (
              <img src={logo} alt={prospect + ' logo'} className="login-custom-logo" />
            ) : (
              <span className="brand-mark">{initialsOf(prospect || 'Nexus')}</span>
            )}
          </div>
          <div>
            <h1 className="login-title serif">Nexus Collections</h1>
            <span className="login-subtitle">Command Centre · Kaara Technologies</span>
          </div>
        </div>

        {prospect && (
          <div className="login-prospect-banner">
            <Icon name="shield" size={14} />
            <span>Dedicated enterprise environment for <strong>{prospect}</strong></span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="login-field">
            <label htmlFor="login-email">Work Email</label>
            <div className="login-input-wrap">
              <Icon name="mail" size={15} />
              <input
                id="login-email"
                type="email"
                className="input login-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                required
              />
            </div>
          </div>

          <div className="login-field">
            <div className="login-field-row">
              <label htmlFor="login-password">Password</label>
              <button
                type="button"
                className="login-toggle-pw"
                onClick={() => setShowPassword((s) => !s)}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
            <div className="login-input-wrap">
              <Icon name="lock" size={15} />
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                className="input login-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                required
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary login-submit-btn" disabled={loading}>
            {loading ? 'Authenticating...' : 'Sign in to Command Centre'}
            {!loading && <Icon name="arrowRight" size={16} />}
          </button>
        </form>

        <div className="login-divider">
          <span>or sign in as a demo role</span>
        </div>

        <div className="login-quick-roles">
          {ROLES.map((r) => {
            const person = P[r.id] || P.manager;
            const isSelected = selectedRole === r.id;
            return (
              <button
                key={r.id}
                type="button"
                className={'login-role-pill' + (isSelected ? ' is-active' : '')}
                onClick={() => handleSelectRole(r.id)}
                title={r.desc}
              >
                <span className="login-role-avatar">{person?.initials || r.label.slice(0, 2)}</span>
                <span className="login-role-info">
                  <strong>{r.label}</strong>
                  <span className="muted">{person?.name}</span>
                </span>
                {isSelected && <Icon name="check" size={13} stroke={3} />}
              </button>
            );
          })}
        </div>

        <button type="button" className="btn btn-outline login-sso-btn" onClick={handleSso} disabled={loading}>
          <Icon name="layers" size={15} />
          Sign in with Company SSO (SAML 2.0 / OIDC)
        </button>

        <p className="login-footer-note muted">
          Single Sign-On and Role-Based Access Control enforced. Every sign-in and action is recorded to the immutable audit trail.
        </p>
      </div>
    </div>
  );
}

