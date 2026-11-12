import React, { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import AppShell from '../components/AppShell';
import { hostingService } from '../services/hostingService';

export default function OpenInVSCode() {
  const { instance_id } = useParams();
  const started = useRef(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (started.current === instance_id) return;
    started.current = instance_id;

    hostingService.openInVSCodeDirectly(instance_id).catch((err) => {
      setError(err.response?.data?.detail || 'Could not open VS Code on this computer.');
    });
  }, [instance_id]);

  return (
    <AppShell>
      <main className="mx-auto max-w-xl px-6 py-16 text-center">
        <h1 className="text-xl font-semibold text-charcoal">Opening in VS Code</h1>
        <p className="mt-2 text-sm text-charcoal-500" role={error ? 'alert' : 'status'}>
          {error || 'Please wait while your workspace opens.'}
        </p>
        {error && (
          <Link className="mt-4 inline-block text-sm font-semibold text-kaara-600 underline" to={`/hosted/${instance_id}`}>
            View the workspace in your browser
          </Link>
        )}
      </main>
    </AppShell>
  );
}
