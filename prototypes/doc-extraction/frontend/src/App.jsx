import React, { useState } from 'react';
import branding from './branding.json';
import {
  FileText,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  Eye,
  Download,
  Cpu,
  Layers
} from 'lucide-react';

export const DocumentExtractionPreview = ({ activeModule = 'dashboard', branding = {} }) => {
  const [activeDoc, setActiveDoc] = useState({
    id: 'DOC-9921',
    name: 'Invoice_AcmeCorp_Oct2026.pdf',
    type: 'Commercial Tax Invoice',
    fields: [
      { key: 'Invoice Number', value: 'INV-2026-8849', confidence: 99.8, status: 'Verified' },
      { key: 'Vendor Name', value: 'Apex Cloud Solutions GmbH', confidence: 99.2, status: 'Verified' },
      { key: 'Tax Identification (VAT)', value: 'DE 814 290 119', confidence: 97.5, status: 'Verified' },
      { key: 'Invoice Date', value: '2026-10-24', confidence: 99.9, status: 'Verified' },
      { key: 'Total Net Amount', value: '€42,500.00', confidence: 98.4, status: 'Verified' },
      { key: 'VAT (19%)', value: '€8,075.00', confidence: 99.1, status: 'Verified' },
      { key: 'Gross Payable Amount', value: '€50,575.00', confidence: 99.7, status: 'Verified' }
    ]
  });

  const [simulatedReviewDone, setSimulatedReviewDone] = useState(false);

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div
        className="rounded-xl p-6 text-white shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all"
        style={{
          backgroundColor: branding.primaryColor || '#DC2626',
          backgroundImage: `linear-gradient(135deg, ${branding.primaryColor || '#DC2626'} 0%, ${branding.secondaryColor || '#18181B'} 100%)`
        }}
      >
        <div>
          <span className="text-xs uppercase tracking-wider opacity-80 font-medium">Cognitive Document Intelligence</span>
          {branding.logo && (
            <img src={branding.logo} alt="Logo" className="h-12 w-12 object-contain rounded-lg bg-white/90 p-1.5 mb-2" />
          )}
          <h2 className="text-2xl font-bold mt-1">
            {branding.companyName || 'Vertex Solutions'} DocuSense Engine
          </h2>
          <p className="text-sm opacity-90 mt-1 max-w-xl">
            Automated OCR boundary segmentation, transformer key-value extraction, and ERP webhook sync.
          </p>
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 rounded-lg text-xs font-semibold bg-white text-slate-900 shadow hover:bg-slate-50 transition">
            + Batch Ingest
          </button>
          <button className="px-4 py-2 rounded-lg text-xs font-semibold bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white transition border border-white/20">
            Export JSON Schema
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>Documents Ingested</span>
            <FileText className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">14,280 Docs</div>
          <div className="text-xs text-emerald-600 mt-1 font-medium">+18% processing speed</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>Extraction Accuracy</span>
            <Cpu className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">99.4% F1-Score</div>
          <div className="text-xs text-slate-500 mt-1">Vision Transformer + LayoutLM</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>Pending Human-in-the-Loop</span>
            <AlertCircle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">4 In Review</div>
          <div className="text-xs text-amber-600 mt-1 font-medium">Confidence score &lt; 90%</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>ERP Synced Records</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">14,276</div>
          <div className="text-xs text-slate-500 mt-1">Direct SAP & NetSuite sync</div>
        </div>
      </div>

      {/* Interactive Extraction Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Simulated Document View */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-rose-600" />
              <span className="text-xs font-semibold text-slate-900">{activeDoc.name}</span>
            </div>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
              OCR Processed (320ms)
            </span>
          </div>

          <div className="bg-slate-50 rounded-lg p-4 border border-dashed border-slate-300 min-h-[280px] flex flex-col justify-between">
            <div className="space-y-3">
              <div className="bg-white p-3 rounded border border-slate-200 shadow-xs flex justify-between items-center">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Header Block</span>
                  <p className="text-xs font-semibold text-slate-800">Apex Cloud Solutions GmbH • Tax ID: DE 814 290 119</p>
                </div>
                <span className="text-[10px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded font-mono">Conf: 99.8%</span>
              </div>

              <div className="bg-white p-3 rounded border border-slate-200 shadow-xs flex justify-between items-center">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Line Items Detected</span>
                  <p className="text-xs text-slate-700">1x Dedicated Kubernetes Cluster (m5.4xlarge) - €42,500.00</p>
                </div>
                <span className="text-[10px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded font-mono">Conf: 98.4%</span>
              </div>

              <div className="bg-white p-3 rounded border border-slate-200 shadow-xs flex justify-between items-center">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Total Settlement Balance</span>
                  <p className="text-xs font-bold text-slate-900">Gross Total: €50,575.00</p>
                </div>
                <span className="text-[10px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded font-mono">Conf: 99.7%</span>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center justify-between text-xs text-slate-500">
              <span>Bounding boxes identified: 24</span>
              <span className="font-medium text-slate-700">Page 1 of 1</span>
            </div>
          </div>
        </div>

        {/* Structured JSON & Key-Value Extraction Table */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Extracted Key-Value Data</h3>
                <p className="text-xs text-slate-500">Validated against master schema</p>
              </div>
              <button className="text-xs font-medium text-slate-600 hover:text-slate-900 flex items-center gap-1">
                <Download className="w-3.5 h-3.5" /> Download JSON
              </button>
            </div>

            <div className="divide-y divide-slate-100 max-h-[260px] overflow-y-auto">
              {activeDoc.fields.map((field, idx) => (
                <div key={idx} className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-slate-500 font-medium">{field.key}</span>
                    <p className="font-semibold text-slate-900">{field.value}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] font-mono font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                      {field.confidence}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 mt-4">
            {simulatedReviewDone ? (
              <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium text-center">
                ✓ Document payload approved and pushed to ERP webhook.
              </div>
            ) : (
              <button
                onClick={() => setSimulatedReviewDone(true)}
                style={{ backgroundColor: branding.primaryColor || '#DC2626' }}
                className="w-full py-2.5 text-xs font-semibold text-white rounded-lg hover:opacity-95 transition shadow"
              >
                Approve & Sync Extracted Record
              </button>
            )}
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
        <DocumentExtractionPreview branding={branding} />
      </div>
    </div>
  );
}
