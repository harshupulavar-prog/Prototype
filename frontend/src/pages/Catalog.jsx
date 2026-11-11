import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ChevronRight, LayoutGrid, Layers, PlayCircle, Tags } from 'lucide-react';
import AppShell from '../components/AppShell';
import HostModal from '../components/HostModal';
import { Button, Tag, PageHeader, PageBody, EmptyState, ErrorNotice, LoadingBlock, categoryIcon } from '../components/ui';
import { prototypeService } from '../services/prototypeService';
import { hostingService } from '../services/hostingService';

function Stat({ icon: Icon, value, label }) {
  return (
    <div className="flex items-center gap-3.5 px-6 first:pl-5">
      <span className="flex h-11 w-11 flex-none items-center justify-center rounded-xl bg-kaara-50 text-kaara-600">
        <Icon className="h-5 w-5" />
      </span>
      <div>
        <div className="text-xl font-bold leading-none tracking-tight text-charcoal">{value}</div>
        <div className="mt-1 text-[13px] text-charcoal-500">{label}</div>
      </div>
    </div>
  );
}

function PrototypeCard({ proto, onHost, onOpen }) {
  const Icon = categoryIcon(proto.category);
  return (
    <article className="fade-up group flex flex-col rounded-2xl border border-line bg-white p-5 shadow-card transition-all hover:-translate-y-0.5 hover:shadow-lift">
      <div className="flex items-start justify-between gap-3">
        <Tag tone="brand">{proto.category}</Tag>
        <div className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-kaara-50 text-kaara-600">
          <Icon className="h-5 w-5" />
        </div>
      </div>

      <h3 className="mt-3 text-[17px] font-semibold tracking-tight text-charcoal">{proto.name}</h3>
      <p className="mt-1 line-clamp-2 text-[13px] leading-relaxed text-charcoal-500">{proto.description}</p>

      {proto.technologies?.length > 0 && (
        <div className="mb-5 mt-3 flex flex-wrap gap-1.5">
          {proto.technologies.slice(0, 3).map((t) => (
            <Tag key={t}>{t}</Tag>
          ))}
        </div>
      )}

      <div className="mt-auto flex items-center justify-between border-t border-line pt-4">
        <button
          onClick={onOpen}
          className="inline-flex items-center gap-1 text-[13px] font-medium text-charcoal hover:text-kaara-600"
        >
          View details
          <ChevronRight className="h-4 w-4" />
        </button>
        <Button size="sm" onClick={onHost}>
          Host
        </Button>
      </div>
    </article>
  );
}

export default function Catalog() {
  const navigate = useNavigate();
  const [all, setAll] = useState([]);
  const [instances, setInstances] = useState(null);
  const [category, setCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [hostTarget, setHostTarget] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [protos, mine] = await Promise.all([
          prototypeService.getPrototypes(),
          hostingService.getMyInstances().catch(() => null),
        ]);
        if (cancelled) return;
        setAll(Array.isArray(protos) ? protos : []);
        setInstances(Array.isArray(mine) ? mine : null);
      } catch {
        if (!cancelled) setError('We could not load the prototypes. Make sure the backend is running and try again.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const categories = useMemo(() => {
    const list = Array.isArray(all) ? all : [];
    return ['All', ...new Set(list.map((p) => p.category).filter(Boolean))];
  }, [all]);

  const visible = useMemo(() => {
    const list = Array.isArray(all) ? all : [];
    const q = search.trim().toLowerCase();
    return list.filter((p) => {
      if (category !== 'All' && p.category !== category) return false;
      if (!q) return true;
      return [p.name, p.description, p.category, ...(p.technologies || [])].some((v) => (v || '').toLowerCase().includes(q));
    });
  }, [all, category, search]);

  return (
    <AppShell>
      <PageHeader
        title="Prototype Catalog"
        subtitle="Explore ready-made prototypes, customize them with your brand, and host your own copy."
      />
      <PageBody>
        {!loading && !error && (
          <div className="mb-6 inline-flex max-w-full flex-wrap items-center divide-x divide-line rounded-2xl border border-line bg-white py-4 shadow-card">
            <Stat icon={Layers} value={Array.isArray(all) ? all.length : 0} label="Prototypes" />
            <Stat icon={Tags} value={Math.max(0, categories.length - 1)} label="Categories" />
            {Array.isArray(instances) && <Stat icon={PlayCircle} value={instances.length} label="Your instances" />}
          </div>
        )}

        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2" role="tablist" aria-label="Filter by category">
            {categories.map((c) => (
              <button
                key={c}
                role="tab"
                aria-selected={category === c}
                onClick={() => setCategory(c)}
                className={`rounded-full border px-3.5 py-1.5 text-[13px] font-medium transition-colors ${
                  category === c
                    ? 'border-kaara-700 bg-kaara-700 text-white'
                    : 'border-line bg-white text-charcoal-700 hover:border-[#D3D6DE] hover:bg-surface'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-charcoal-400" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search prototypes…"
              aria-label="Search prototypes"
              className="field pl-10"
            />
          </div>
        </div>

        <ErrorNotice>{error}</ErrorNotice>

        {loading ? (
          <LoadingBlock label="Loading prototypes…" />
        ) : visible.length === 0 && !error ? (
          <EmptyState
            icon={LayoutGrid}
            title="No prototypes found"
            text="Try a different search or category."
            action={
              <Button
                variant="secondary"
                onClick={() => {
                  setCategory('All');
                  setSearch('');
                }}
              >
                Clear filters
              </Button>
            }
          />
        ) : (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {visible.map((p) => (
              <PrototypeCard
                key={p.prototype_id}
                proto={p}
                onHost={() => setHostTarget(p)}
                onOpen={() => navigate(`/prototypes/${p.prototype_id}`)}
              />
            ))}
          </div>
        )}
      </PageBody>

      {hostTarget && <HostModal prototype={hostTarget} onClose={() => setHostTarget(null)} />}
    </AppShell>
  );
}
