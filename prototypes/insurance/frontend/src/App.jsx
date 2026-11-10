import React, { useState } from 'react';
import branding from './branding.json';
import {
  ShieldCheck,
  FileCheck2,
  AlertTriangle,
  RotateCcw,
  Search,
  CheckCircle,
  FileText
} from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';

const POLICY_DISTRIBUTION = [
  { name: 'Commercial Property', value: 42, color: '#1E3A8A' },
  { name: 'Cyber Liability', value: 28, color: '#3B82F6' },
  { name: 'General Liability', value: 18, color: '#60A5FA' },
  { name: 'Directors & Officers', value: 12, color: '#93C5FD' }
];

export const InsurancePreview = ({ activeModule = 'dashboard', branding = {} }) => {
  const [claims, setClaims] = useState([
    { id: 'CLM-8819', policy: 'POL-COMM-991', holder: 'Atlas Logistics Inc.', amount: '$85,000', type: 'Cargo Water Damage', status: 'Under Review' },
    { id: 'CLM-8820', policy: 'POL-CYB-402', holder: 'Zenith BioMed', amount: '$240,000', type: 'Ransomware Recovery', status: 'Adjuster Assigned' }
  ]);

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div
        className="rounded-xl p-6 text-white shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all"
        style={{
          backgroundColor: branding.primaryColor || '#1E3A8A',
          backgroundImage: `linear-gradient(135deg, ${branding.primaryColor || '#1E3A8A'} 0%, ${branding.secondaryColor || '#0A1128'} 100%)`
        }}
      >
        <div>
          <span className="text-xs uppercase tracking-wider opacity-80 font-medium">Underwriting & Claims Portal</span>
          {branding.logo && (
            <img src={branding.logo} alt="Logo" className="h-12 w-12 object-contain rounded-lg bg-white/90 p-1.5 mb-2" />
          )}
          <h2 className="text-2xl font-bold mt-1">
            {branding.companyName || 'Global Insurance Corp'} Underwriting Hub
          </h2>
          <p className="text-sm opacity-90 mt-1 max-w-xl">
            Real-time loss ratio tracking, automated FNOL claims ingestion, and automated renewal quotes.
          </p>
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 rounded-lg text-xs font-semibold bg-white text-slate-900 shadow hover:bg-slate-50 transition">
            + Bind New Policy
          </button>
          <button className="px-4 py-2 rounded-lg text-xs font-semibold bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white transition border border-white/20">
            Intake FNOL Claim
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>Gross Written Premium</span>
            <ShieldCheck className="w-4 h-4 text-blue-700" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">$42.8M</div>
          <div className="text-xs text-emerald-600 mt-1 font-medium">+18.5% YoY Book Growth</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>Active Bound Policies</span>
            <FileCheck2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">1,842 Policies</div>
          <div className="text-xs text-slate-500 mt-1">94.2% renewal retention</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>Open Claims (Loss Ratio)</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">48.2% LR</div>
          <div className="text-xs text-emerald-600 mt-1 font-medium">Under 55% target threshold</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>Upcoming Renewals</span>
            <RotateCcw className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">126 in 30 Days</div>
          <div className="text-xs text-slate-500 mt-1">$3.4M renewal pipeline</div>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Active Claims Queue</h3>
              <p className="text-xs text-slate-500">First notice of loss & underwriting adjustments</p>
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700">Live Intake</span>
          </div>

          <div className="divide-y divide-slate-100">
            {claims.map((claim) => (
              <div key={claim.id} className="py-3 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-xs text-slate-900">{claim.id}</span>
                    <span className="text-slate-400 text-xs">•</span>
                    <span className="text-xs text-slate-600 font-medium">{claim.holder}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">{claim.type} ({claim.policy})</p>
                </div>
                <div className="text-right">
                  <div className="text-xs font-bold text-slate-900">{claim.amount}</div>
                  <span className="inline-block mt-0.5 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                    {claim.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Portfolio breakdown chart */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-900 mb-1">Policy Portfolio Mix</h3>
            <p className="text-xs text-slate-500 mb-2">Exposure by line of business</p>

            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={POLICY_DISTRIBUTION}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={65}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {POLICY_DISTRIBUTION.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val) => [`${val}%`, 'Share']}
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-1.5 mt-2">
              {POLICY_DISTRIBUTION.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs text-slate-600">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                    <span>{item.name}</span>
                  </div>
                  <span className="font-semibold text-slate-900">{item.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <InsurancePreview branding={branding} />
      </div>
    </div>
  );
}
