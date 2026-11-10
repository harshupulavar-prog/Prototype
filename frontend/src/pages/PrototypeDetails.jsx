import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Check } from 'lucide-react';
import AppShell from '../components/AppShell';
import HostModal from '../components/HostModal';
import { Button, Tag, PageBody, ErrorNotice, LoadingBlock, categoryIcon } from '../components/ui';
import { prototypeService } from '../services/prototypeService';

export default function PrototypeDetails() {
  const { id } = useParams();
  const [prototype, setPrototype] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showHost, setShowHost] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    prototypeService
      .getPrototypeById(id)
      .then((data) => !cancelled && setPrototype(data))
      .catch(() => !cancelled && setError('This prototype could not be found.'))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [id]);

  const Icon = categoryIcon(prototype?.category);

  return (
    <AppShell>
      <PageBody>
        <Link
          to="/"
          className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-charcoal-500 hover:text-charcoal"
        >
          <ArrowLeft className="h-4 w-4" />
          All prototypes
        </Link>

        {loading && <LoadingBlock label="Loading prototype…" />}
        <ErrorNotice>{error}</ErrorNotice>

        {prototype && (
          <div className="fade-up">
            <div className="flex flex-wrap items-start justify-between gap-6">
              <div className="flex min-w-0 items-start gap-4">
                <div className="flex h-14 w-14 flex-none items-center justify-center rounded-2xl bg-kaara-50 text-kaara-600">
                  <Icon className="h-7 w-7" />
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Tag tone="brand">{prototype.category}</Tag>
                    <span className="text-xs text-charcoal-400">Version {prototype.version}</span>
                  </div>
                  <h1 className="mt-2 text-3xl font-bold tracking-tight text-charcoal">{prototype.name}</h1>
                </div>
              </div>
              <Button size="lg" onClick={() => setShowHost(true)}>
                Host this prototype
              </Button>
            </div>

            <p className="mt-6 max-w-3xl text-base leading-relaxed text-charcoal-500">{prototype.description}</p>

            <div className="mt-10 grid gap-6 lg:grid-cols-3">
              <section className="rounded-2xl border border-line bg-white p-6 shadow-card lg:col-span-2">
                <h2 className="text-base font-semibold text-charcoal">What is included</h2>
                {prototype.features?.length > 0 ? (
                  <ul className="mt-4 grid gap-x-8 gap-y-3 sm:grid-cols-2">
                    {prototype.features.map((f) => (
                      <li key={f} className="flex gap-3 text-sm text-charcoal-700">
                        <span className="mt-0.5 flex h-5 w-5 flex-none items-center justify-center rounded-full bg-kaara-50 text-kaara-600">
                          <Check className="h-3 w-3" strokeWidth={3} />
                        </span>
                        {f}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-3 text-sm text-charcoal-500">A complete, ready-to-run prototype.</p>
                )}
              </section>

              <div className="space-y-6">
                <section className="rounded-2xl border border-line bg-white p-6 shadow-card">
                  <h2 className="text-base font-semibold text-charcoal">Works with what you already run</h2>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {(prototype.technologies || [])
                      .filter((t) => !/pgvector|opensearch|neo4j/i.test(t))
                      .map((t) => (
                        <Tag key={t}>{t}</Tag>
                      ))}
                  </div>
                </section>

                <section className="rounded-2xl border border-line bg-surface p-6">
                  <h2 className="text-base font-semibold text-charcoal">How hosting works</h2>
                  <ol className="mt-4 space-y-3 text-sm text-charcoal-500">
                    <li className="flex gap-3"><span className="font-semibold text-kaara-600">1</span>Choose your name, logo and colors.</li>
                    <li className="flex gap-3"><span className="font-semibold text-kaara-600">2</span>We create a private copy for you.</li>
                    <li className="flex gap-3"><span className="font-semibold text-kaara-600">3</span>Open it in VS Code. It starts itself.</li>
                  </ol>
                </section>
              </div>
            </div>
          </div>
        )}
      </PageBody>

      {showHost && prototype && <HostModal prototype={prototype} onClose={() => setShowHost(false)} />}
    </AppShell>
  );
}
