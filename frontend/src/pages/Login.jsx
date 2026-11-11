import React, { useState } from 'react';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import Logo from '../components/Logo';
import { Button, ErrorNotice } from '../components/ui';
import { authService } from '../services/authService';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (authService.isAuthenticated()) return <Navigate to="/" replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Enter your email and password.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await authService.login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.response?.data?.detail || 'We could not sign you in. Check your details and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid min-h-screen bg-white lg:grid-cols-2">
      <div className="flex flex-col px-6 py-8 sm:px-12 lg:px-16">
        <Logo className="h-8 w-32 object-contain object-left" />

        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-12">
          <h1 className="text-3xl font-bold tracking-tight text-charcoal">Welcome back</h1>
          <p className="mt-2 text-base text-charcoal-500">Sign in to browse and host prototypes.</p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5" noValidate>
            <ErrorNotice>{error}</ErrorNotice>

            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-charcoal">
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="field"
              />
            </div>

            <div>
              <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-charcoal">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="field pr-11"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-charcoal-400 hover:text-charcoal"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button type="submit" size="lg" loading={loading} className="flex-1">
                {loading ? 'Signing in…' : 'Sign in'}
              </Button>
              <a
                href="mailto:contact@demo.kaara.ai?subject=Talk%20to%20Kaara"
                className="inline-flex items-center justify-center rounded-xl border border-line bg-white px-5 py-3 text-sm font-semibold text-charcoal shadow-sm transition hover:border-charcoal-400 hover:bg-surface"
              >
                Talk to Kaara
              </a>
            </div>
          </form>

          <p className="mt-6 text-sm text-charcoal-400">
            Demo account:{' '}
            <button
              type="button"
              onClick={() => {
                setEmail('demo@prototypehub.io');
                setPassword('password123');
              }}
              className="font-medium text-charcoal-700 underline decoration-line underline-offset-4 hover:text-kaara-600"
            >
              fill in details
            </button>
          </p>
        </div>

        <p className="text-xs text-charcoal-400">© Kaara Technologies</p>
      </div>

      <div className="page-sweep relative hidden overflow-hidden border-l border-line bg-surface lg:flex lg:items-center lg:justify-center">
        <div className="max-w-md px-10">
          <h2 className="text-3xl font-bold leading-tight tracking-tight text-charcoal">
            Pick a prototype.
            <br />
            Make it yours.
            <br />
            <span className="text-kaara-500">Host it in minutes.</span>
          </h2>
          <ul className="mt-8 space-y-4 text-base text-charcoal-500">
            <li className="flex gap-3"><span className="mt-2.5 h-1.5 w-1.5 flex-none rounded-full bg-kaara-500" />Browse approved, ready-to-run prototypes</li>
            <li className="flex gap-3"><span className="mt-2.5 h-1.5 w-1.5 flex-none rounded-full bg-kaara-500" />Add your name, logo and colors</li>
            <li className="flex gap-3"><span className="mt-2.5 h-1.5 w-1.5 flex-none rounded-full bg-kaara-500" />Open your own copy straight in VS Code</li>
          </ul>

          <div className="mt-10 rounded-2xl border border-line bg-white p-6 shadow-sm">
            <h3 className="text-base font-semibold text-charcoal">Want a custom demo for your team?</h3>
            <p className="mt-1.5 text-sm text-charcoal-500">
              Kaara builds AI prototypes shaped around your platforms, models, and workflows.
            </p>
            <a
              href="mailto:contact@demo.kaara.ai?subject=Talk%20to%20Kaara%20-%20Prototype%20Demo"
              className="mt-4 inline-flex items-center justify-center rounded-xl bg-kaara-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-kaara-700"
            >
              Talk to Kaara
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
