import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Code2, Copy, Check, Download, ChevronDown } from 'lucide-react';
import AppShell from '../components/AppShell';
import { Button, Tag, PageBody, ErrorNotice, LoadingBlock, formatDate } from '../components/ui';
import { hostingService } from '../services/hostingService';
import api from '../services/api';

function CopyRow({ label, value }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked; the value is selectable */
    }
  };
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-charcoal">{label}</label>
      <div className="flex items-center gap-2">
        <input readOnly value={value} onFocus={(e) => e.target.select()} className="field font-mono text-xs" />
        <Button variant="secondary" onClick={copy} aria-label={`Copy ${label}`}>
          {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
          {copied ? 'Copied' : 'Copy'}
        </Button>
      </div>
    </div>
  );
}

export default function HostedPrototype() {
  const { instance_id } = useParams();
  const [instance, setInstance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [opening, setOpening] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [notice, setNotice] = useState('');
  const [showTech, setShowTech] = useState(false);

  useEffect(() => {
    let cancelled = false;
    hostingService
      .getInstanceDetails(instance_id)
      .then((d) => !cancelled && setInstance(d))
      .catch((err) => !cancelled && setError(err.response?.data?.detail || 'This instance was not found.'))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [instance_id]);

  const openInVSCode = async () => {
    setOpening(true);
    setNotice('');
    setError('');
    try {
      await hostingService.openInVSCodeDirectly(instance_id);
      setNotice('Opening in VS Code…');
    } catch {
      if (instance?.vscode_open_folder_url) window.location.href = instance.vscode_open_folder_url;
      else setError('VS Code could not be opened.');
    } finally {
      setOpening(false);
    }
  };

  const cloneInVSCode = () => {
    if (instance?.vscode_clone_url) window.location.href = instance.vscode_clone_url;
  };

  const download = async () => {
    setExporting(true);
    setError('');
    try {
      const exp = await hostingService.exportInstance(instance_id);
      const base = (api.defaults.baseURL || '').replace(/\/api$/, '');
      const a = document.createElement('a');
      a.href = `${base}${exp.export_url}`;
      a.download = `${instance_id}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch {
      setError('The download could not be prepared. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  const folder = (instance?.instance_path || '').split(/[\\/]/).filter(Boolean).pop();

  return (
    <AppShell>
      <PageBody>
        <Link
          to="/my-instances"
          className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-charcoal-500 hover:text-charcoal"
        >
          <ArrowLeft className="h-4 w-4" />
          My instances
        </Link>

        {loading && <LoadingBlock label="Loading instance…" />}
        <ErrorNotice onClose={() => setError('')}>{error}</ErrorNotice>

        {instance && (
          <div className="fade-up max-w-3xl">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight text-charcoal">{instance.prototype_name}</h1>
              <Tag tone="success">Active</Tag>
            </div>
            <p className="mt-2 text-base text-charcoal-500">
              {folder} · Hosted {formatDate(instance.created_at)}
            </p>

            <section className="mt-8 rounded-2xl border border-line bg-white p-6 shadow-card">
              <h2 className="text-base font-semibold text-charcoal">Open your copy</h2>
              <p className="mt-1 text-sm text-charcoal-500">
                Open the project in VS Code. When VS Code asks, choose Allow, and the app installs and starts by itself.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Button size="lg" onClick={openInVSCode} loading={opening}>
                  <Code2 className="h-4 w-4" />
                  Open in VS Code
                </Button>
                <Button size="lg" variant="secondary" onClick={download} loading={exporting}>
                  <Download className="h-4 w-4" />
                  Download .zip
                </Button>
              </div>
              {notice && <p className="mt-3 text-sm text-charcoal-500">{notice}</p>}
            </section>

            <section className="mt-6 rounded-2xl border border-line bg-white p-6 shadow-card">
              <CopyRow label="Instance link" value={window.location.href} />
            </section>

            <div className="mt-6">
              <button
                onClick={() => setShowTech((v) => !v)}
                aria-expanded={showTech}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-charcoal-500 hover:text-charcoal"
              >
                <ChevronDown className={`h-4 w-4 transition-transform ${showTech ? 'rotate-180' : ''}`} />
                Developer details
              </button>
              {showTech && (
                <section className="fade-up mt-3 space-y-4 rounded-2xl border border-line bg-surface p-6">
                  <CopyRow label="Git clone command" value={instance.git_clone_command} />
                  <CopyRow label="Repository" value={instance.repository_url} />
                  <Button variant="secondary" size="sm" onClick={cloneInVSCode}>
                    Clone with VS Code
                  </Button>
                </section>
              )}
            </div>
          </div>
        )}
      </PageBody>
    </AppShell>
  );
}
