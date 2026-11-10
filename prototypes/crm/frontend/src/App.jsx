import React, { useState } from 'react';
import branding from './branding.json';
import {
  TrendingUp,
  UserCheck,
  Target,
  DollarSign,
  Plus,
  MoreVertical,
  Calendar,
  CheckCircle2
} from 'lucide-react';

const PIPELINE_STAGES = [
  {
    name: 'Discovery (20%)',
    total: '$340,000',
    deals: [
      { id: 'DEAL-1', title: 'Global Retail Cloud Migration', company: 'HyperMart Group', value: '$180,000', rep: 'Marcus V.' },
      { id: 'DEAL-2', title: 'Data Warehouse Modernization', company: 'Solaria FinTech', value: '$160,000', rep: 'Elena R.' }
    ]
  },
  {
    name: 'Proposal Sent (50%)',
    total: '$520,000',
    deals: [
      { id: 'DEAL-3', title: 'Enterprise SSO & Governance', company: 'Orbit Telecom', value: '$220,000', rep: 'Sarah K.' },
      { id: 'DEAL-4', title: 'Core Banking API Connector', company: 'Nordic Credit Union', value: '$300,000', rep: 'Marcus V.' }
    ]
  },
  {
    name: 'Negotiation (80%)',
    total: '$750,000',
    deals: [
      { id: 'DEAL-5', title: 'Global Multi-Region Deployment', company: 'AeroDynamics Int.', value: '$750,000', rep: 'Alex R.' }
    ]
  }
];

export const CRMPreview = ({ activeModule = 'dashboard', branding = {} }) => {
  return (
    <div className="space-y-6">
      {/* Banner */}
      <div
        className="rounded-xl p-6 text-white shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all"
        style={{
          backgroundColor: branding.primaryColor || '#7C3AED',
          backgroundImage: `linear-gradient(135deg, ${branding.primaryColor || '#7C3AED'} 0%, ${branding.secondaryColor || '#1E1B4B'} 100%)`
        }}
      >
        <div>
          <span className="text-xs uppercase tracking-wider opacity-80 font-medium">Revenue Acceleration System</span>
          {branding.logo && (
            <img src={branding.logo} alt="Logo" className="h-12 w-12 object-contain rounded-lg bg-white/90 p-1.5 mb-2" />
          )}
          <h2 className="text-2xl font-bold mt-1">
            {branding.companyName || 'Acme Corporation'} Sales Engine
          </h2>
          <p className="text-sm opacity-90 mt-1 max-w-xl">
            Pipeline velocity tracking, automated lead routing, and ARR forecasting.
          </p>
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 rounded-lg text-xs font-semibold bg-white text-slate-900 shadow hover:bg-slate-50 transition">
            + New Opportunity
          </button>
          <button className="px-4 py-2 rounded-lg text-xs font-semibold bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white transition border border-white/20">
            Export Forecast
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>Total Active Pipeline</span>
            <DollarSign className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">$3.82M</div>
          <div className="text-xs text-emerald-600 mt-1 font-medium">+24% vs previous quarter</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>Qualified Inbound Leads</span>
            <Target className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">142 Leads</div>
          <div className="text-xs text-slate-500 mt-1">32 high-intent enterprise</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>Win Rate (Enterprise)</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">34.8%</div>
          <div className="text-xs text-emerald-600 mt-1 font-medium">+3.2% vs industry benchmark</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>Sales Cycle Duration</span>
            <Calendar className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">38 Days</div>
          <div className="text-xs text-slate-500 mt-1">Accelerated by automated sequences</div>
        </div>
      </div>

      {/* Visual Kanban Pipeline */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-slate-900">Active Deals Pipeline (Kanban)</h3>
          <span className="text-xs text-slate-500 font-medium">5 Deals in Advanced Stages</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {PIPELINE_STAGES.map((stage, idx) => (
            <div key={idx} className="bg-slate-50 rounded-xl p-3 border border-slate-200/80">
              <div className="flex items-center justify-between mb-3 px-1">
                <span className="text-xs font-bold text-slate-800">{stage.name}</span>
                <span className="text-xs font-semibold text-slate-500">{stage.total}</span>
              </div>

              <div className="space-y-2.5">
                {stage.deals.map((deal) => (
                  <div
                    key={deal.id}
                    className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-xs hover:shadow-sm transition"
                  >
                    <div className="flex items-start justify-between">
                      <span className="text-xs font-semibold text-slate-900 leading-snug">{deal.title}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">{deal.company}</p>
                    <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-100">
                      <span className="text-xs font-bold text-slate-900">{deal.value}</span>
                      <span className="text-[10px] text-slate-500 font-medium bg-slate-100 px-2 py-0.5 rounded">
                        {deal.rep}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <CRMPreview branding={branding} />
      </div>
    </div>
  );
}
