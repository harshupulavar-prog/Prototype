import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Boxes, Code2, Copy, Check, ChevronRight, ExternalLink, Download, RefreshCw, Trash2 } from 'lucide-react';
import AppShell from '../components/AppShell';
import { Button, Tag, PageHeader, PageBody, EmptyState, ErrorNotice, LoadingBlock, categoryIcon, formatDate } from '../components/ui';
import { hostingService } from '../services/hostingService';

export default function MyInstances() {
  const navigate = useNavigate();
  const [instances, setInstances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openingId, setOpeningId] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [downloadingId, setDownloadingId] = useState(null);

  const loadInstances = () => {
    let cancelled = false;
    hostingService
      .getMyInstances()
      .then((d) => !cancelled && setInstances(Array.isArray(d) ? d : []))
      .catch(() => !cancelled && setError('We could not load your instances. Please try again.'))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  };

  useEffect(() => {
    return loadInstances();
  }, []);

  const openInVSCode = async (inst) => {
    setOpeningId(inst.instance_id);
    setError('');
    try {
      await hostingService.openInVSCodeDirectly(inst.instance_id);
    } catch {
      if (inst.vscode_open_folder_url) window.location.href = inst.vscode_open_folder_url;
      else setError('VS Code could not be opened. Open the instance page for other options.');
    } finally {
      setOpeningId(null);
    }
  };

  const copyLink = async (inst) => {
    try {
      const url = inst.live_url || `${window.location.origin}/hosted/${inst.instance_id}`;
      await navigator.clipboard.writeText(url);
      setCopiedId(inst.instance_id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      setError('Copy is blocked by the browser.');
    }
  };

  const downloadSource = async (inst) => {
    setDownloadingId(inst.instance_id);
    try {
      const blob = await hostingService.downloadInstanceSource(inst.instance_id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${inst.instance_id}_source.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch {
      setError('Failed to download source code archive.');
    } finally {
      setDownloadingId(null);
    }
  };

  const handleDelete = async (instanceId) => {
    if (!window.confirm(`Are you sure you want to delete instance ${instanceId}?`)) return;
    try {
      await hostingService.deleteInstance(instanceId);
      setInstances((prev) => prev.filter((i) => i.instance_id !== instanceId));
    } catch (err) {
      setError('Failed to delete instance.');
    }
  };

  return (
    <AppShell>
      <PageHeader
        title="My Instances"
        subtitle="Manage your customized prototypes, live deployments, and source exports."
      />
      <PageBody>
        <ErrorNotice onClose={() => setError('')}>{error}</ErrorNotice>

        {loading ? (
          <LoadingBlock label="Loading your instances…" />
        ) : instances.length === 0 ? (
          <EmptyState
            icon={Boxes}
            title="Nothing hosted yet"
            text="Customize and host a prototype from the catalog and it will appear here."
            action={<Button onClick={() => navigate('/')}>Browse prototypes</Button>}
          />
        ) : (
          <ul className="space-y-4">
            {instances.map((inst) => {
              const Icon = categoryIcon(inst.prototype_name);
              const folder = (inst.instance_path || '').split(/[\\/]/).filter(Boolean).pop();
              const isReady = inst.deployment_status === 'READY';
              const isDeploying = ['PENDING', 'BUILDING', 'UPLOADING', 'DEPLOYING'].includes(inst.deployment_status);
              const isFailed = inst.deployment_status === 'FAILED';
              const liveUrl = inst.live_url || `${window.location.origin}/hosted/${inst.instance_id}`;

              return (
                <li
                  key={inst.instance_id}
                  className="fade-up flex flex-wrap items-center gap-4 rounded-2xl border border-line bg-white p-5 shadow-card transition-shadow hover:shadow-lift"
                >
                  <div className="flex h-11 w-11 flex-none items-center justify-center rounded-xl bg-kaara-50 text-kaara-600">
                    <Icon className="h-5 w-5" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        to={`/hosted/${inst.instance_id}`}
                        className="truncate text-base font-semibold text-charcoal hover:text-kaara-600"
                      >
                        {inst.app_name || inst.prototype_name}
                      </Link>

                      {isReady && <Tag tone="success">Live</Tag>}
                      {isDeploying && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700 border border-amber-200">
                          <RefreshCw className="h-3 w-3 animate-spin" />
                          {inst.deployment_status}...
                        </span>
                      )}
                      {isFailed && <Tag tone="danger">Build Failed</Tag>}
                      {!isReady && !isDeploying && !isFailed && <Tag tone="neutral">Draft</Tag>}
                    </div>

                    <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-charcoal-500">
                      <span>Template: {inst.prototype_name}</span>
                      <span>·</span>
                      <span className="font-mono">{inst.instance_id}</span>
                      <span>·</span>
                      <span>Hosted {formatDate(inst.created_at)}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap items-center gap-2">
                    {isReady && (
                      <a
                        href={liveUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 rounded-lg bg-kaara-50 px-3 py-1.5 text-xs font-semibold text-kaara-700 hover:bg-kaara-100 transition"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        Live App
                      </a>
                    )}

                    <Button variant="secondary" size="sm" onClick={() => copyLink(inst)}>
                      {copiedId === inst.instance_id ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                      {copiedId === inst.instance_id ? 'Copied' : 'Copy link'}
                    </Button>

                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => downloadSource(inst)}
                      loading={downloadingId === inst.instance_id}
                      aria-label="Download source ZIP"
                    >
                      <Download className="h-4 w-4" />
                      ZIP
                    </Button>

                    <Button size="sm" onClick={() => openInVSCode(inst)} loading={openingId === inst.instance_id}>
                      <Code2 className="h-4 w-4" />
                      VS Code
                    </Button>

                    <Link
                      to={`/hosted/${inst.instance_id}`}
                      aria-label="View instance details"
                      className="rounded-md p-2 text-charcoal-400 hover:bg-surface hover:text-charcoal"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </Link>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </PageBody>
    </AppShell>
  );
}
