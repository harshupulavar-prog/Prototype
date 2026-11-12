import React, { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Upload, Trash2, CheckCircle2, Copy, Check, ArrowRight, ExternalLink, Download, AlertCircle, RefreshCw, Mail } from 'lucide-react';
import { Button, ErrorNotice } from './ui';
import { hostingService } from '../services/hostingService';
import { authService } from '../services/authService';

const MAX_LOGO_BYTES = 1024 * 1024; // 1 MB, matches backend
const ACCEPTED = ['image/png', 'image/jpeg', 'image/webp'];
const HEX = /^#[0-9a-fA-F]{6}$/;

const DEFAULT_PRIMARY = '#E91D2B';
const DEFAULT_SECONDARY = '#171A24';

function ColorField({ label, value, onChange }) {
  const valid = HEX.test(value);
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-charcoal">{label}</label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={valid ? value : '#000000'}
          onChange={(e) => onChange(e.target.value.toUpperCase())}
          className="h-10 w-12 cursor-pointer rounded-lg border border-line bg-white p-1"
          aria-label={`${label} picker`}
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          maxLength={7}
          spellCheck={false}
          className={`field font-mono uppercase ${valid ? '' : 'border-kaara-500'}`}
        />
      </div>
    </div>
  );
}

/** Small mock of an app window so the user sees their branding as they type. */
function BrandPreview({ name, logo, primary, secondary, hasSecondary }) {
  const rail = hasSecondary ? secondary : primary;
  return (
    <div className="overflow-hidden rounded-xl border border-line bg-white shadow-card">
      <div className="flex h-56">
        <div className="flex w-14 flex-none flex-col items-center gap-3 py-4" style={{ backgroundColor: rail }}>
          {logo ? (
            <img src={logo} alt="" className="h-8 w-8 rounded-md bg-white/95 object-contain p-1" />
          ) : (
            <div className="h-8 w-8 rounded-md bg-white/25" />
          )}
          <div className="h-1.5 w-6 rounded-full bg-white/40" />
          <div className="h-1.5 w-6 rounded-full bg-white/25" />
          <div className="h-1.5 w-6 rounded-full bg-white/25" />
        </div>
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <span className="truncate text-sm font-semibold text-charcoal">{name}</span>
            <span className="h-6 w-6 rounded-full bg-surface" />
          </div>
          <div className="flex-1 space-y-3 p-4">
            <div className="h-2.5 w-2/5 rounded-full bg-line" />
            <div className="grid grid-cols-2 gap-2">
              <div className="h-12 rounded-lg border border-line" />
              <div className="h-12 rounded-lg border border-line" />
            </div>
            <span
              className="inline-block rounded-md px-3 py-1.5 text-xs font-semibold text-white"
              style={{ backgroundColor: primary }}
            >
              Primary action
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

const DEPLOYMENT_STEPS = {
  DRAFT: { label: 'Saving instance configuration...', progress: 15 },
  PENDING: { label: 'Initializing isolated build worker...', progress: 30 },
  BUILDING: { label: 'Compiling production bundle with npm & Vite...', progress: 65 },
  UPLOADING: { label: 'Uploading assets to Cloudflare R2 & Vercel...', progress: 85 },
  DEPLOYING: { label: 'Finalizing deployment & verifying live URL...', progress: 95 },
  READY: { label: 'Deployment successful! Application is live.', progress: 100 },
  FAILED: { label: 'Build or deployment failed', progress: 100 },
};

export default function HostModal({ prototype, onClose }) {
  const navigate = useNavigate();
  const fileRef = useRef(null);

  const fields = prototype.branding_fields || ['app_name', 'logo', 'primary_color', 'secondary_color'];
  const has = (f) => fields.includes(f);

  const [appName, setAppName] = useState('');
  const [notificationEmail, setNotificationEmail] = useState(() => authService.getCurrentUser()?.email || '');
  const [primary, setPrimary] = useState(DEFAULT_PRIMARY);
  const [secondary, setSecondary] = useState(DEFAULT_SECONDARY);
  const [logo, setLogo] = useState(null);
  const [logoName, setLogoName] = useState('');
  const [error, setError] = useState('');

  const [phase, setPhase] = useState('form'); // form | hosting | done | failed
  const [deployStep, setDeployStep] = useState('DRAFT');
  const [instance, setInstance] = useState(null);
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [notice, setNotice] = useState('');

  const colorsValid = (!has('primary_color') || HEX.test(primary)) && (!has('secondary_color') || HEX.test(secondary));
  const previewName = appName.trim() || prototype.name;
  const safePrimary = HEX.test(primary) ? primary : DEFAULT_PRIMARY;
  const safeSecondary = HEX.test(secondary) ? secondary : DEFAULT_SECONDARY;

  // Poll deployment status
  useEffect(() => {
    let timer = null;
    let attempts = 0;
    const maxAttempts = 60; // 2 minutes

    if (phase === 'hosting' && instance?.instance_id) {
      const poll = async () => {
        try {
          attempts += 1;
          const statusData = await hostingService.getDeploymentStatus(instance.instance_id);
          const currentStatus = statusData.deployment_status || 'PENDING';
          setDeployStep(currentStatus);

          if (currentStatus === 'READY') {
            setInstance((prev) => ({
              ...prev,
              ...statusData,
              live_url: statusData.live_url || prev.live_url,
            }));
            setPhase('done');
            return;
          }

          if (currentStatus === 'FAILED') {
            setError(statusData.build_error || 'Automated build failed. Please check your configuration.');
            setPhase('failed');
            return;
          }

          if (attempts >= maxAttempts) {
            // If timed out, show done with available URL or fallback
            setPhase('done');
            return;
          }

          timer = setTimeout(poll, 2000);
        } catch (err) {
          console.warn('Status poll error:', err);
          timer = setTimeout(poll, 3000);
        }
      };

      timer = setTimeout(poll, 1500);
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [phase, instance?.instance_id]);

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!ACCEPTED.includes(file.type)) return setError('Logo must be a PNG, JPEG or WebP image.');
    if (file.size > MAX_LOGO_BYTES) return setError('Logo must be 1 MB or smaller.');
    const reader = new FileReader();
    reader.onload = () => {
      setError('');
      setLogo(reader.result);
      setLogoName(file.name);
    };
    reader.onerror = () => setError('Could not read that file.');
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!colorsValid) return setError('Colors must be hex values like #E91D2B.');
    setError('');
    setPhase('hosting');
    setDeployStep('DRAFT');

    try {
      // 1. Create Instance record in DB and upload logo to Cloudflare R2
      const created = await hostingService.createHostedInstance(prototype.prototype_id, {
        app_name: appName.trim(),
        notification_email: notificationEmail.trim() || undefined,
        primary_color: has('primary_color') ? primary.toUpperCase() : null,
        secondary_color: has('secondary_color') ? secondary.toUpperCase() : null,
        logo,
      });
      setInstance(created);

      // 2. Start automated build & deployment in isolated worker
      setDeployStep('PENDING');
      await hostingService.hostInstance(created.instance_id);
    } catch (err) {
      setError(err.response?.data?.detail || 'We could not host this prototype. Please try again.');
      setPhase('form');
    }
  };

  const liveUrl = instance?.live_url || `${window.location.origin}/hosted/${instance?.instance_id}`;

  const copyUrl = async () => {
    try {
      await navigator.clipboard.writeText(liveUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setNotice('Copy is blocked by the browser. Select the link and copy it manually.');
    }
  };

  const downloadSource = async () => {
    if (!instance?.instance_id) return;
    setDownloading(true);
    setNotice('');
    try {
      const blob = await hostingService.downloadInstanceSource(instance.instance_id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${instance.instance_id}_customized_source.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      setNotice('Source code ZIP downloaded successfully.');
    } catch (err) {
      setNotice('Download failed. You can also view and export from your instances dashboard.');
    } finally {
      setDownloading(false);
    }
  };

  const busy = phase === 'hosting';
  const stepInfo = DEPLOYMENT_STEPS[deployStep] || DEPLOYMENT_STEPS.PENDING;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-charcoal/45 p-0 sm:items-center sm:p-6"
      onClick={() => !busy && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Host ${prototype.name}`}
        onClick={(e) => e.stopPropagation()}
        className="fade-up max-h-[94vh] w-full max-w-4xl overflow-y-auto rounded-t-2xl bg-white shadow-modal sm:rounded-2xl"
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-line px-6 py-5">
          <div>
            <h2 className="text-lg font-semibold text-charcoal">
              {phase === 'done' ? 'Your live instance is ready' : `Host ${prototype.name}`}
            </h2>
            <p className="mt-0.5 text-sm text-charcoal-500">
              {phase === 'done'
                ? 'Your prototype has been customized, built, and deployed independently.'
                : 'Customize your branding. Preview updates live before hosting.'}
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={busy}
            aria-label="Close"
            className="rounded-md p-2 text-charcoal-400 transition-colors hover:bg-surface hover:text-charcoal disabled:opacity-40"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form View */}
        {(phase === 'form' || phase === 'failed') && (
          <form onSubmit={handleSubmit}>
            <div className="grid gap-8 px-6 py-6 md:grid-cols-2">
              <div className="space-y-5">
                {has('app_name') && (
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-charcoal" htmlFor="app-name">
                      Application Name
                    </label>
                    <input
                      id="app-name"
                      type="text"
                      value={appName}
                      onChange={(e) => setAppName(e.target.value)}
                      maxLength={60}
                      placeholder={prototype.name}
                      disabled={busy}
                      className="field"
                    />
                  </div>
                )}

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-charcoal" htmlFor="notify-email">
                    Email Address for Deployment Link
                  </label>
                  <div className="relative">
                    <input
                      id="notify-email"
                      type="email"
                      value={notificationEmail}
                      onChange={(e) => setNotificationEmail(e.target.value)}
                      placeholder="developer@company.com"
                      disabled={busy}
                      className="field pl-9"
                    />
                    <Mail className="absolute left-3 top-2.5 h-4 w-4 text-charcoal-400" />
                  </div>
                  <p className="mt-1 text-xs text-charcoal-400">
                    We will send the live deployment URL and interactive code workspace link directly to this email.
                  </p>
                </div>

                {has('logo') && (
                  <div>
                    <span className="mb-1.5 block text-sm font-medium text-charcoal">Brand Logo (Cloudflare R2)</span>
                    <div className="flex items-center gap-2">
                      <Button type="button" variant="secondary" size="sm" onClick={() => fileRef.current?.click()} disabled={busy}>
                        <Upload className="h-4 w-4" />
                        {logo ? 'Replace logo' : 'Upload logo'}
                      </Button>
                      {logo && (
                        <>
                          <span className="min-w-0 flex-1 truncate text-sm text-charcoal-500">{logoName}</span>
                          <button
                            type="button"
                            onClick={() => {
                              setLogo(null);
                              setLogoName('');
                            }}
                            aria-label="Remove logo"
                            className="rounded-md p-2 text-charcoal-400 hover:bg-surface hover:text-charcoal"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </>
                      )}
                      <input ref={fileRef} type="file" accept={ACCEPTED.join(',')} onChange={handleFile} className="hidden" />
                    </div>
                    <p className="mt-1.5 text-xs text-charcoal-400">PNG, JPEG or WebP, up to 1 MB. Stored securely in R2.</p>
                  </div>
                )}

                {(has('primary_color') || has('secondary_color')) && (
                  <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-1 lg:grid-cols-2">
                    {has('primary_color') && (
                      <ColorField
                        label={has('secondary_color') ? 'Primary color' : 'Brand color'}
                        value={primary}
                        onChange={setPrimary}
                      />
                    )}
                    {has('secondary_color') && <ColorField label="Secondary color" value={secondary} onChange={setSecondary} />}
                  </div>
                )}
              </div>

              <div>
                <span className="mb-1.5 block text-sm font-medium text-charcoal">Live Theme Preview</span>
                <BrandPreview
                  name={previewName}
                  logo={logo}
                  primary={safePrimary}
                  secondary={safeSecondary}
                  hasSecondary={has('secondary_color')}
                />
              </div>
            </div>

            {error && (
              <div className="px-6 pb-4">
                <ErrorNotice>{error}</ErrorNotice>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 border-t border-line bg-surface/60 px-6 py-4">
              <Button type="button" variant="secondary" onClick={onClose} disabled={busy}>
                Cancel
              </Button>
              <Button type="submit" loading={busy} disabled={!colorsValid}>
                {phase === 'failed' ? 'Retry Host & Deploy' : 'Host Prototype'}
              </Button>
            </div>
          </form>
        )}

        {/* Progress View */}
        {phase === 'hosting' && (
          <div className="px-6 py-10" role="status" aria-live="polite">
            <div className="mx-auto max-w-lg text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-kaara-50 text-kaara-600">
                <RefreshCw className="h-7 w-7 animate-spin" />
              </div>
              <h3 className="text-lg font-semibold text-charcoal">{stepInfo.label}</h3>
              <p className="mt-1.5 text-sm text-charcoal-500">
                Building an isolated temporary container and provisioning your live application deployment on Vercel.
              </p>

              <div className="mt-6">
                <div className="flex items-center justify-between text-xs text-charcoal-400 mb-1.5 font-medium">
                  <span>Step: {deployStep}</span>
                  <span>{stepInfo.progress}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-line">
                  <div
                    className="h-full rounded-full bg-kaara-500 transition-all duration-500"
                    style={{ width: `${stepInfo.progress}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Done / Success View */}
        {phase === 'done' && instance && (
          <div className="px-6 py-6">
            <div className="flex items-start gap-3 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3">
              <CheckCircle2 className="mt-0.5 h-5 w-5 flex-none text-emerald-600" />
              <div className="min-w-0">
                <div className="text-sm font-semibold text-emerald-900">
                  {instance.app_name || instance.prototype_name} is successfully deployed!
                </div>
                <div className="truncate text-sm text-emerald-800">
                  Unique instance ID: <span className="font-mono font-medium">{instance.instance_id}</span>
                </div>
              </div>
            </div>

            {(notificationEmail || instance.notification_email) && (
              <div className="mt-3 flex items-center gap-2 rounded-xl border border-blue-100 bg-blue-50 px-4 py-2.5 text-xs text-blue-900">
                <Mail className="h-4 w-4 flex-none text-blue-600" />
                <span>
                  Deployment access link dispatched to <strong className="font-semibold">{notificationEmail || instance.notification_email}</strong>
                </span>
              </div>
            )}

            {/* Live URL Card */}
            <div className="mt-6 rounded-2xl border border-line bg-surface/50 p-5">
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-charcoal-500">
                Live Deployment URL
              </label>
              <div className="flex flex-wrap items-center gap-2">
                <input
                  readOnly
                  value={liveUrl}
                  onFocus={(e) => e.target.select()}
                  className="field flex-1 font-mono text-sm bg-white"
                />
                <Button variant="secondary" onClick={copyUrl} aria-label="Copy live link">
                  {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                  {copied ? 'Copied' : 'Copy'}
                </Button>
                <a
                  href={liveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-kaara-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-kaara-700 transition"
                >
                  <ExternalLink className="h-4 w-4" />
                  Open Live App
                </a>
              </div>
            </div>

            {notice && <p className="mt-3 text-sm text-charcoal-500">{notice}</p>}

            <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-5">
              <div className="flex items-center gap-2">
                <Button variant="secondary" size="sm" onClick={downloadSource} loading={downloading}>
                  <Download className="h-4 w-4" />
                  Download Source ZIP
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="secondary" onClick={onClose}>
                  Close
                </Button>
                <Button onClick={() => navigate(`/hosted/${instance.instance_id}`)}>
                  View Instance Dashboard
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
