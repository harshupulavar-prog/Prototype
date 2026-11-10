import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Upload, Trash2, CheckCircle2, Copy, Check, Code2, ArrowRight } from 'lucide-react';
import { Button, ErrorNotice } from './ui';
import { hostingService } from '../services/hostingService';

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

function instanceFolderName(path = '') {
  return path.split(/[\\/]/).filter(Boolean).pop() || '';
}

export default function HostModal({ prototype, onClose }) {
  const navigate = useNavigate();
  const fileRef = useRef(null);

  const fields = prototype.branding_fields || ['app_name', 'logo', 'primary_color', 'secondary_color'];
  const has = (f) => fields.includes(f);

  const [appName, setAppName] = useState('');
  const [primary, setPrimary] = useState(DEFAULT_PRIMARY);
  const [secondary, setSecondary] = useState(DEFAULT_SECONDARY);
  const [logo, setLogo] = useState(null);
  const [logoName, setLogoName] = useState('');
  const [error, setError] = useState('');

  const [phase, setPhase] = useState('form'); // form | hosting | done
  const [instance, setInstance] = useState(null);
  const [copied, setCopied] = useState(false);
  const [opening, setOpening] = useState(false);
  const [notice, setNotice] = useState('');

  const colorsValid = (!has('primary_color') || HEX.test(primary)) && (!has('secondary_color') || HEX.test(secondary));
  const previewName = appName.trim() || prototype.name;
  const safePrimary = HEX.test(primary) ? primary : DEFAULT_PRIMARY;
  const safeSecondary = HEX.test(secondary) ? secondary : DEFAULT_SECONDARY;

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
    try {
      const created = await hostingService.createHostedInstance(prototype.prototype_id, {
        app_name: appName.trim(),
        primary_color: has('primary_color') ? primary.toUpperCase() : null,
        secondary_color: has('secondary_color') ? secondary.toUpperCase() : null,
        logo,
      });
      setInstance(created);
      setPhase('done');
    } catch (err) {
      setError(err.response?.data?.detail || 'We could not host this prototype. Please try again.');
      setPhase('form');
    }
  };

  const instanceUrl = instance ? `${window.location.origin}/hosted/${instance.instance_id}` : '';

  const copyUrl = async () => {
    try {
      await navigator.clipboard.writeText(instanceUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setNotice('Copy is blocked by the browser. Select the link and copy it manually.');
    }
  };

  const openInVSCode = async () => {
    setOpening(true);
    setNotice('');
    try {
      await hostingService.openInVSCodeDirectly(instance.instance_id);
      setNotice('Opening in VS Code…');
    } catch {
      if (instance.vscode_open_folder_url) window.location.href = instance.vscode_open_folder_url;
    } finally {
      setOpening(false);
    }
  };

  const busy = phase === 'hosting';

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
              {phase === 'done' ? 'Your instance is ready' : `Host ${prototype.name}`}
            </h2>
            <p className="mt-0.5 text-sm text-charcoal-500">
              {phase === 'done'
                ? 'It is a private copy that belongs to you.'
                : 'Make it yours. You can see the result before you host.'}
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

        {/* Form */}
        {phase !== 'done' && (
          <form onSubmit={handleSubmit}>
            <div className="grid gap-8 px-6 py-6 md:grid-cols-2">
              <div className="space-y-5">
                {has('app_name') && (
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-charcoal" htmlFor="app-name">
                      App name
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

                {has('logo') && (
                  <div>
                    <span className="mb-1.5 block text-sm font-medium text-charcoal">Logo</span>
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
                    <p className="mt-1.5 text-xs text-charcoal-400">PNG, JPEG or WebP, up to 1 MB. Optional.</p>
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
                <span className="mb-1.5 block text-sm font-medium text-charcoal">Preview</span>
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

            {busy && (
              <div className="px-6 pb-5" role="status" aria-live="polite">
                <div className="h-1.5 overflow-hidden rounded-full bg-line">
                  <div className="h-full w-1/3 animate-[slide_1.4s_ease-in-out_infinite] rounded-full bg-kaara-500" />
                </div>
                <p className="mt-2 text-sm text-charcoal-500">
                  Setting up your private copy and applying your branding. This usually takes a few seconds.
                </p>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 border-t border-line bg-surface/60 px-6 py-4">
              <Button type="button" variant="secondary" onClick={onClose} disabled={busy}>
                Cancel
              </Button>
              <Button type="submit" loading={busy} disabled={!colorsValid}>
                {busy ? 'Hosting…' : 'Host prototype'}
              </Button>
            </div>
          </form>
        )}

        {/* Success */}
        {phase === 'done' && instance && (
          <div className="px-6 py-6">
            <div className="flex items-start gap-3 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3">
              <CheckCircle2 className="mt-0.5 h-5 w-5 flex-none text-emerald-600" />
              <div className="min-w-0">
                <div className="text-sm font-semibold text-emerald-900">{instance.prototype_name} is hosted</div>
                <div className="truncate text-sm text-emerald-800">
                  Project folder: <span className="font-medium">{instanceFolderName(instance.instance_path)}</span>
                </div>
              </div>
            </div>

            <label className="mb-1.5 mt-5 block text-sm font-medium text-charcoal">Instance link</label>
            <div className="flex items-center gap-2">
              <input readOnly value={instanceUrl} onFocus={(e) => e.target.select()} className="field font-mono text-xs" />
              <Button variant="secondary" onClick={copyUrl} aria-label="Copy link">
                {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                {copied ? 'Copied' : 'Copy'}
              </Button>
            </div>

            {notice && <p className="mt-3 text-sm text-charcoal-500">{notice}</p>}

            <div className="mt-6 flex flex-wrap items-center justify-end gap-3">
              <Button variant="secondary" onClick={() => navigate(`/hosted/${instance.instance_id}`)}>
                View instance
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button onClick={openInVSCode} loading={opening}>
                <Code2 className="h-4 w-4" />
                Open in VS Code
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
