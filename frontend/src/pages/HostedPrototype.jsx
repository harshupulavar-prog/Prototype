import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Code2,
  Copy,
  Check,
  Download,
  ExternalLink,
  RefreshCw,
  Terminal,
  Monitor,
  Smartphone,
  Tablet,
  FileCode,
  Sparkles,
  Play,
  RotateCcw,
  Sliders,
  CheckCircle2,
  Layers,
  ChevronRight
} from 'lucide-react';
import AppShell from '../components/AppShell';
import { Button, Tag, LoadingBlock, formatDate } from '../components/ui';
import { hostingService } from '../services/hostingService';

function slugify(name = '') {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'app';
}

export default function HostedPrototype() {
  const { instance_id } = useParams();
  const [instance, setInstance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState('split'); // 'split' | 'ui' | 'code'
  const [deviceSize, setDeviceSize] = useState('desktop'); // 'desktop' | 'tablet' | 'mobile'

  // Code Viewer State
  const [files, setFiles] = useState([]);
  const [activeFile, setActiveFile] = useState(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);

  // Terminal State
  const [terminalLines, setTerminalLines] = useState([]);
  const [terminalRunning, setTerminalRunning] = useState(false);
  const [terminalKey, setTerminalKey] = useState(0);
  const terminalEndRef = useRef(null);

  // Quick Action States
  const [openingCode, setOpeningCode] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [redeploying, setRedeploying] = useState(false);
  const [notice, setNotice] = useState('');

  // 1. Fetch Instance details
  const fetchInstance = async () => {
    try {
      const d = await hostingService.getInstanceDetails(instance_id);
      setInstance(d);
      return d;
    } catch (err) {
      setError(err.response?.data?.detail || 'This instance was not found.');
      return null;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInstance();
  }, [instance_id]);

  // 2. Fetch Code Files for the Code Viewer
  useEffect(() => {
    if (!instance_id) return;
    hostingService
      .getInstanceFiles(instance_id)
      .then((data) => {
        if (data?.files && data.files.length > 0) {
          setFiles(data.files);
          // Default to branding.json first so user immediately sees user requirements
          const defaultFile = data.files.find((f) => f.name === 'branding.json') || data.files[0];
          setActiveFile(defaultFile);
        }
      })
      .catch((err) => {
        console.warn('Could not fetch source files from backend:', err);
      });
  }, [instance_id]);

  // Fallback files if not yet loaded from backend
  useEffect(() => {
    if (instance && files.length === 0) {
      const appName = instance.app_name || instance.prototype_name;
      const primaryColor = instance.primary_color || '#E91D2B';
      const secondaryColor = instance.secondary_color || '#171A24';

      const fallbackFiles = [
        {
          name: 'branding.json',
          path: 'src/branding.json',
          language: 'json',
          content: JSON.stringify(
            {
              appName: appName,
              companyName: appName,
              primaryColor: primaryColor,
              secondaryColor: secondaryColor,
              logo: instance.logo_storage_key ? '/logo.png' : null,
              customized: true
            },
            null,
            2
          )
        },
        {
          name: 'App.jsx',
          path: 'src/App.jsx',
          language: 'javascript',
          content: `import React, { useEffect, useState } from 'react';\nimport branding from './branding.json';\n\nexport default function App() {\n  return (\n    <div className="min-h-screen bg-slate-50 text-slate-900">\n      <header style={{ backgroundColor: branding.primaryColor }} className="px-6 py-4 text-white shadow flex items-center justify-between">\n        <div className="flex items-center gap-3">\n          {branding.logo ? <img src={branding.logo} alt="Logo" className="h-8 w-8 object-contain" /> : <div className="h-8 w-8 bg-white/20 rounded" />}\n          <h1 className="text-xl font-bold">{branding.appName}</h1>\n        </div>\n        <span className="text-xs font-semibold bg-white/20 px-2.5 py-1 rounded-full">Live Instance</span>\n      </header>\n      <main className="max-w-6xl mx-auto p-8">\n        <h2 className="text-2xl font-bold mb-4">Welcome to {branding.appName}</h2>\n        <p className="text-slate-600 mb-6">Interactive customized prototype running with live brand requirements.</p>\n      </main>\n    </div>\n  );\n}`
        },
        {
          name: 'index.html',
          path: 'index.html',
          language: 'html',
          content: `<!DOCTYPE html>\n<html lang="en">\n  <head>\n    <meta charset="UTF-8" />\n    <meta name="viewport" content="width=device-width, initial-scale=1.0" />\n    <title>${appName}</title>\n    <style id="nexus-branding">\n      :root {\n        --color-primary: ${primaryColor};\n        --color-secondary: ${secondaryColor};\n      }\n    </style>\n  </head>\n  <body>\n    <div id="root"></div>\n    <script type="module" src="/src/main.jsx"></script>\n  </body>\n</html>`
        },
        {
          name: 'package.json',
          path: 'package.json',
          language: 'json',
          content: JSON.stringify(
            {
              name: slugify(appName),
              private: true,
              version: '1.0.0',
              type: 'module',
              scripts: {
                dev: 'vite',
                build: 'vite build',
                preview: 'vite preview'
              },
              dependencies: {
                react: '^18.3.1',
                'react-dom': '^18.3.1',
                'lucide-react': '^1.67.0'
              }
            },
            null,
            2
          )
        }
      ];
      setFiles(fallbackFiles);
      setActiveFile(fallbackFiles[0]);
    }
  }, [instance, files.length]);

  // 3. Automated Terminal Startup & Streaming Sequence
  useEffect(() => {
    if (!instance) return;

    setTerminalLines([]);
    setTerminalRunning(true);

    const appName = instance.app_name || instance.prototype_name;
    const primary = instance.primary_color || '#E91D2B';
    const secondary = instance.secondary_color || '#171A24';
    const instId = instance.instance_id;

    const sequence = [
      { text: `nexus@cloud-worker:~$ cd /workspaces/${instId}`, delay: 100 },
      { text: `[Nexus Cloud Engine] Initializing runtime container environment...`, delay: 350 },
      { text: `[Nexus Cloud Engine] Reading user branding & configuration requirements:`, delay: 650 },
      { text: `  → Application Name: "${appName}"`, delay: 900, highlight: 'emerald' },
      { text: `  → Primary Brand Color: ${primary}`, delay: 1100, highlight: 'emerald' },
      { text: `  → Secondary Brand Color: ${secondary}`, delay: 1300, highlight: 'emerald' },
      { text: `  → Assets: Dynamic branding configuration injected to src/branding.json`, delay: 1550 },
      { text: `nexus@cloud-worker:~$ npm install --prefer-offline`, delay: 1850 },
      { text: `[✓] All dependencies verified and installed (142 packages in 1.1s)`, delay: 2400 },
      { text: `nexus@cloud-worker:~$ npm run dev`, delay: 2800 },
      { text: ``, delay: 3100 },
      { text: `  VITE v6.3.5  ready in 184 ms`, delay: 3300, highlight: 'cyan' },
      { text: `  ➜  Local:   http://localhost:3000/`, delay: 3500, highlight: 'green' },
      { text: `  ➜  Network: use --host to expose`, delay: 3700 },
      { text: `  ➜  press h + enter to show help`, delay: 3900 },
      { text: ``, delay: 4100 },
      { text: `[Nexus DevServer] Live reload enabled. Watching for changes...`, delay: 4300, highlight: 'cyan' },
      { text: `[Nexus Engine] UI rendered with user requirements! Status: READY & LIVE`, delay: 4600, highlight: 'emerald' }
    ];

    const timeouts = [];
    sequence.forEach((item) => {
      const t = setTimeout(() => {
        setTerminalLines((prev) => [...prev, item]);
      }, item.delay);
      timeouts.push(t);
    });

    const finishTimeout = setTimeout(() => {
      setTerminalRunning(false);
    }, 4900);
    timeouts.push(finishTimeout);

    return () => {
      timeouts.forEach(clearTimeout);
    };
  }, [instance, terminalKey]);

  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [terminalLines]);

  const restartTerminal = () => {
    setTerminalKey((k) => k + 1);
  };

  const copyCode = async () => {
    if (!activeFile?.content) return;
    try {
      await navigator.clipboard.writeText(activeFile.content);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } catch {}
  };

  const copyUrl = async () => {
    const url = instance?.live_url || `${window.location.origin}/hosted/${instance?.instance_id}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    } catch {}
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
    } catch {
      setNotice('Download failed. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  const openInVSCode = async () => {
    setOpeningCode(true);
    setNotice('');
    try {
      await hostingService.openInVSCodeDirectly(instance.instance_id);
      setNotice('Opening workspace in VS Code…');
    } catch {
      if (instance?.vscode_open_folder_url) window.location.href = instance.vscode_open_folder_url;
    } finally {
      setOpeningCode(false);
    }
  };

  const appName = instance?.app_name || instance?.prototype_name || 'Prototype Application';
  const primaryColor = instance?.primary_color || '#E91D2B';
  const secondaryColor = instance?.secondary_color || '#171A24';
  const liveUrl = instance?.live_url || `${window.location.origin}/hosted/${instance?.instance_id}`;

  return (
    <AppShell>
      <div className="mx-auto max-w-[1700px] px-4 py-4 sm:px-6">
        {/* Top Header Bar */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-line bg-white px-5 py-3.5 shadow-sm">
          <div className="flex items-center gap-3">
            <Link
              to="/my-instances"
              className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface px-3 py-1.5 text-xs font-semibold text-charcoal-600 hover:bg-slate-100 transition"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              All Instances
            </Link>
            <div className="h-4 w-px bg-line" />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold tracking-tight text-charcoal">{appName}</h1>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live & Running
                </span>
              </div>
              <p className="text-xs text-charcoal-400 font-mono">
                {instance?.instance_id} · Template: {instance?.prototype_name}
              </p>
            </div>
          </div>

          {/* View Mode Selector */}
          <div className="flex items-center gap-2">
            <div className="flex rounded-lg border border-line bg-surface p-0.5 text-xs font-medium">
              <button
                onClick={() => setViewMode('split')}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 transition ${
                  viewMode === 'split' ? 'bg-white font-semibold text-charcoal shadow-sm' : 'text-charcoal-500 hover:text-charcoal'
                }`}
              >
                <Layers className="h-3.5 w-3.5 text-kaara-600" />
                Workspace Split
              </button>
              <button
                onClick={() => setViewMode('ui')}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 transition ${
                  viewMode === 'ui' ? 'bg-white font-semibold text-charcoal shadow-sm' : 'text-charcoal-500 hover:text-charcoal'
                }`}
              >
                <Monitor className="h-3.5 w-3.5 text-emerald-600" />
                Live UI Only
              </button>
              <button
                onClick={() => setViewMode('code')}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 transition ${
                  viewMode === 'code' ? 'bg-white font-semibold text-charcoal shadow-sm' : 'text-charcoal-500 hover:text-charcoal'
                }`}
              >
                <Code2 className="h-3.5 w-3.5 text-blue-600" />
                Code & Terminal
              </button>
            </div>

            <div className="h-4 w-px bg-line" />

            {/* Actions */}
            <a
              href={liveUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg bg-kaara-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-kaara-700 transition"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Open Live App
            </a>

            <Button variant="secondary" size="sm" onClick={downloadSource} loading={downloading}>
              <Download className="h-3.5 w-3.5" />
              Download .zip
            </Button>
          </div>
        </div>

        {notice && (
          <div className="mb-4 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-xs text-blue-900">
            {notice}
          </div>
        )}

        {loading && <LoadingBlock label="Loading workspace environment..." />}

        {instance && (
          <div
            className={`grid gap-5 transition-all ${
              viewMode === 'split' ? 'lg:grid-cols-12' : viewMode === 'code' ? 'grid-cols-1' : 'grid-cols-1'
            }`}
          >
            {/* LEFT / TOP: CODE EDITOR & TERMINAL */}
            {(viewMode === 'split' || viewMode === 'code') && (
              <div className={`${viewMode === 'split' ? 'lg:col-span-6' : 'col-span-1'} space-y-4`}>
                {/* Code Viewer Panel */}
                <div className="rounded-2xl border border-line bg-[#0D1117] text-white shadow-lg overflow-hidden">
                  {/* File Tabs Header */}
                  <div className="flex items-center justify-between border-b border-[#30363D] bg-[#161B22] px-3 py-2">
                    <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
                      {files.map((file) => {
                        const active = activeFile?.path === file.path;
                        return (
                          <button
                            key={file.path}
                            onClick={() => setActiveFile(file)}
                            className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-mono transition ${
                              active
                                ? 'bg-[#0D1117] text-white font-semibold border-b-2 border-kaara-500'
                                : 'text-[#8B949E] hover:bg-[#21262D] hover:text-[#C9D1D9]'
                            }`}
                          >
                            <FileCode className={`h-3.5 w-3.5 ${file.name.endsWith('.json') ? 'text-amber-400' : 'text-blue-400'}`} />
                            {file.name}
                            {file.name === 'branding.json' && (
                              <span className="h-1.5 w-1.5 rounded-full bg-kaara-500" title="Customized requirements" />
                            )}
                          </button>
                        );
                      })}
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="hidden sm:inline-flex items-center gap-1 rounded bg-[#21262D] px-2 py-0.5 text-[10px] font-mono text-emerald-400 border border-[#30363D]">
                        <Sparkles className="h-3 w-3" /> Customized Code
                      </span>
                      <button
                        onClick={copyCode}
                        className="rounded-md p-1.5 text-[#8B949E] hover:bg-[#21262D] hover:text-white transition"
                        title="Copy code"
                        aria-label="Copy code"
                      >
                        {copiedCode ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  </div>

                  {/* Active File Path Sub-bar */}
                  <div className="flex items-center justify-between border-b border-[#21262D] bg-[#0D1117] px-4 py-1.5 text-[11px] font-mono text-[#8B949E]">
                    <span>{activeFile?.path || 'src/branding.json'}</span>
                    <span className="text-[10px] text-[#8B949E]">UTF-8 · React / Vite Component</span>
                  </div>

                  {/* Code Content Area */}
                  <div className="max-h-[380px] min-h-[300px] overflow-auto p-4 font-mono text-xs leading-relaxed text-[#C9D1D9]">
                    <pre className="overflow-x-auto whitespace-pre">
                      <code>
                        {(activeFile?.content || '').split('\n').map((line, idx) => (
                          <div key={idx} className="flex hover:bg-[#161B22]/60 px-1 rounded">
                            <span className="w-8 select-none text-[#484F58] text-right pr-3 flex-none">{idx + 1}</span>
                            <span className="flex-1">{line || ' '}</span>
                          </div>
                        ))}
                      </code>
                    </pre>
                  </div>
                </div>

                {/* Interactive Auto-Running Terminal */}
                <div className="rounded-2xl border border-line bg-[#0B0F19] text-white shadow-lg overflow-hidden">
                  {/* Terminal Header */}
                  <div className="flex items-center justify-between border-b border-slate-800 bg-[#111827] px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1.5">
                        <span className="h-3 w-3 rounded-full bg-[#EF4444]" />
                        <span className="h-3 w-3 rounded-full bg-[#F59E0B]" />
                        <span className="h-3 w-3 rounded-full bg-[#10B981]" />
                      </div>
                      <span className="ml-2 font-mono text-xs font-semibold text-slate-300">
                        bash — nexus@container: ~/workspaces/{instance.instance_id}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 text-[11px] font-mono text-emerald-400">
                        <span className={`h-2 w-2 rounded-full bg-emerald-500 ${terminalRunning ? 'animate-ping' : ''}`} />
                        {terminalRunning ? 'Executing…' : 'DevServer Active'}
                      </span>
                      <button
                        onClick={restartTerminal}
                        className="rounded-md p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition"
                        title="Restart Dev Server sequence"
                        aria-label="Restart terminal"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Terminal Output */}
                  <div className="max-h-[220px] min-h-[180px] overflow-y-auto p-4 font-mono text-xs leading-relaxed space-y-1">
                    {terminalLines.map((line, idx) => (
                      <div
                        key={idx}
                        className={`${
                          line.highlight === 'emerald'
                            ? 'text-emerald-400 font-semibold'
                            : line.highlight === 'cyan'
                            ? 'text-cyan-300 font-semibold'
                            : line.highlight === 'green'
                            ? 'text-green-400 underline font-semibold'
                            : line.text.startsWith('$') || line.text.startsWith('nexus@')
                            ? 'text-amber-300'
                            : 'text-slate-300'
                        }`}
                      >
                        {line.text}
                      </div>
                    ))}
                    <div ref={terminalEndRef} />
                  </div>
                </div>
              </div>
            )}

            {/* RIGHT / BOTTOM: LIVE APPLICATION UI */}
            {(viewMode === 'split' || viewMode === 'ui') && (
              <div className={`${viewMode === 'split' ? 'lg:col-span-6' : 'col-span-1'} space-y-4`}>
                <div className="rounded-2xl border border-line bg-white shadow-card overflow-hidden flex flex-col">
                  {/* Browser Mock Navigation Bar */}
                  <div className="flex items-center justify-between border-b border-line bg-surface/70 px-4 py-2.5">
                    <div className="flex items-center gap-1.5">
                      <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
                      <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
                      <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
                    </div>

                    {/* Address bar */}
                    <div className="flex items-center gap-2 max-w-md flex-1 mx-4 rounded-lg border border-line bg-white px-3 py-1 text-xs text-charcoal-600 font-mono shadow-inner">
                      <span className="text-emerald-600 font-bold">https://</span>
                      <span className="truncate">{slugify(appName)}.nexus.vercel.app</span>
                    </div>

                    {/* Device Switcher */}
                    <div className="flex items-center gap-1 text-charcoal-400">
                      <button
                        onClick={() => setDeviceSize('desktop')}
                        className={`p-1.5 rounded hover:text-charcoal ${deviceSize === 'desktop' ? 'bg-white shadow text-charcoal' : ''}`}
                        title="Desktop view"
                      >
                        <Monitor className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setDeviceSize('tablet')}
                        className={`p-1.5 rounded hover:text-charcoal ${deviceSize === 'tablet' ? 'bg-white shadow text-charcoal' : ''}`}
                        title="Tablet view"
                      >
                        <Tablet className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setDeviceSize('mobile')}
                        className={`p-1.5 rounded hover:text-charcoal ${deviceSize === 'mobile' ? 'bg-white shadow text-charcoal' : ''}`}
                        title="Mobile view"
                      >
                        <Smartphone className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Interactive Application Window Frame */}
                  <div className="bg-slate-100/70 p-4 flex justify-center min-h-[580px] max-h-[660px] overflow-y-auto">
                    <div
                      className={`w-full bg-white rounded-xl shadow-card border border-line overflow-hidden transition-all duration-300 flex flex-col ${
                        deviceSize === 'tablet' ? 'max-w-[768px]' : deviceSize === 'mobile' ? 'max-w-[375px]' : 'w-full'
                      }`}
                    >
                      {/* Branded Prototype App Header with User Requirements */}
                      <div
                        className="px-6 py-4 text-white flex items-center justify-between shadow-sm transition-colors"
                        style={{ backgroundColor: primaryColor }}
                      >
                        <div className="flex items-center gap-3">
                          {instance.logo_storage_key ? (
                            <img
                              src={`/api/hosting/storage/${instance.logo_storage_key}`}
                              alt="Logo"
                              className="h-8 w-8 rounded-lg bg-white/95 p-1 object-contain"
                            />
                          ) : (
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/20 font-bold text-white text-sm">
                              {appName.charAt(0)}
                            </div>
                          )}
                          <div>
                            <div className="font-bold text-base leading-tight">{appName}</div>
                            <div className="text-[11px] text-white/80">Nexus Customized Instance</div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-semibold backdrop-blur-sm">
                            ● Active Live
                          </span>
                        </div>
                      </div>

                      {/* Interactive Prototype Body with User Requirements */}
                      <div className="flex-1 p-6 space-y-6 overflow-y-auto">
                        {/* Requirement Banner */}
                        <div className="rounded-xl border border-line bg-surface/50 p-4 flex items-start gap-3">
                          <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-none mt-0.5" />
                          <div className="text-xs text-charcoal-600">
                            <strong>Live App Requirements Injected:</strong> App Name is set to{' '}
                            <span className="font-semibold text-charcoal">{appName}</span>, primary theme color{' '}
                            <span className="font-mono font-semibold" style={{ color: primaryColor }}>
                              {primaryColor}
                            </span>
                            , and secondary color{' '}
                            <span className="font-mono font-semibold" style={{ color: secondaryColor }}>
                              {secondaryColor}
                            </span>
                            .
                          </div>
                        </div>

                        {/* Interactive KPIs */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          <div className="rounded-xl border border-line p-4 bg-white shadow-sm hover:shadow transition">
                            <div className="text-xs text-charcoal-400 font-medium">Pipeline Value</div>
                            <div className="mt-1 text-xl font-bold text-charcoal" style={{ color: primaryColor }}>
                              $1,420,000
                            </div>
                            <div className="text-[11px] text-emerald-600 mt-1">↑ +14% this quarter</div>
                          </div>
                          <div className="rounded-xl border border-line p-4 bg-white shadow-sm hover:shadow transition">
                            <div className="text-xs text-charcoal-400 font-medium">Active Accounts</div>
                            <div className="mt-1 text-xl font-bold text-charcoal">84 Accounts</div>
                            <div className="text-[11px] text-charcoal-500 mt-1">Tier: Enterprise</div>
                          </div>
                          <div className="col-span-2 sm:col-span-1 rounded-xl border border-line p-4 bg-white shadow-sm hover:shadow transition">
                            <div className="text-xs text-charcoal-400 font-medium">Conversion Rate</div>
                            <div className="mt-1 text-xl font-bold text-charcoal">38.4%</div>
                            <div className="text-[11px] text-emerald-600 mt-1">AI Guided Leads</div>
                          </div>
                        </div>

                        {/* Sample Interactive Work Queue / Deals Section */}
                        <div className="rounded-xl border border-line bg-white shadow-sm p-4">
                          <div className="flex items-center justify-between mb-3 border-b border-line pb-2">
                            <div className="text-sm font-bold text-charcoal">Recent Deals & Work Queue</div>
                            <button
                              className="text-xs font-semibold px-3 py-1 rounded-md text-white transition shadow-sm"
                              style={{ backgroundColor: primaryColor }}
                              onClick={() => alert(`Opening new record for ${appName}`)}
                            >
                              + New Record
                            </button>
                          </div>

                          <div className="space-y-2 text-xs">
                            {[
                              { client: 'Acme Global Corp', stage: 'Contract Proposal', val: '$240,000', status: 'Pending Review' },
                              { client: 'Starlight Tech Solutions', stage: 'Negotiation', val: '$185,000', status: 'In Progress' },
                              { client: 'Horizon Financial Group', stage: 'Closed Won', val: '$320,000', status: 'Completed' }
                            ].map((deal, i) => (
                              <div
                                key={i}
                                className="flex items-center justify-between p-2.5 rounded-lg border border-line hover:bg-surface/50 transition cursor-pointer"
                                onClick={() => alert(`Viewing details for ${deal.client}`)}
                              >
                                <div>
                                  <div className="font-semibold text-charcoal">{deal.client}</div>
                                  <div className="text-charcoal-400 text-[11px]">{deal.stage}</div>
                                </div>
                                <div className="text-right">
                                  <div className="font-bold font-mono text-charcoal">{deal.val}</div>
                                  <div className="text-[11px] text-emerald-600">{deal.status}</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
}
