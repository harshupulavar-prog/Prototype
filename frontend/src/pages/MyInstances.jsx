import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Boxes, Code2, Copy, Check, ChevronRight } from 'lucide-react';
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

  useEffect(() => {
    let cancelled = false;
    hostingService
      .getMyInstances()
      .then((d) => !cancelled && setInstances(d))
      .catch(() => !cancelled && setError('We could not load your instances. Please try again.'))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
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
      await navigator.clipboard.writeText(`${window.location.origin}/hosted/${inst.instance_id}`);
      setCopiedId(inst.instance_id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      setError('Copy is blocked by the browser.');
    }
  };

  return (
    <AppShell>
      <PageHeader title="My Instances" subtitle="Your hosted copies. Open one in VS Code or share its link." />
      <PageBody>
        <ErrorNotice onClose={() => setError('')}>{error}</ErrorNotice>

        {loading ? (
          <LoadingBlock label="Loading your instances…" />
        ) : instances.length === 0 ? (
          <EmptyState
            icon={Boxes}
            title="Nothing hosted yet"
            text="Host a prototype from the catalog and it will appear here."
            action={<Button onClick={() => navigate('/')}>Browse prototypes</Button>}
          />
        ) : (
          <ul className="space-y-4">
            {instances.map((inst) => {
              const Icon = categoryIcon(inst.prototype_name);
              const folder = (inst.instance_path || '').split(/[\\/]/).filter(Boolean).pop();
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
                        {inst.prototype_name}
                      </Link>
                      <Tag tone="success">Active</Tag>
                    </div>
                    <div className="mt-0.5 truncate text-sm text-charcoal-500">
                      {folder} · Hosted {formatDate(inst.created_at)}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Button variant="secondary" size="sm" onClick={() => copyLink(inst)}>
                      {copiedId === inst.instance_id ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                      {copiedId === inst.instance_id ? 'Copied' : 'Copy link'}
                    </Button>
                    <Button size="sm" onClick={() => openInVSCode(inst)} loading={openingId === inst.instance_id}>
                      <Code2 className="h-4 w-4" />
                      Open in VS Code
                    </Button>
                    <Link
                      to={`/hosted/${inst.instance_id}`}
                      aria-label="View instance"
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
