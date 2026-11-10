import React, { useState } from 'react';
import branding from './branding.json';
import {
  CreditCard,
  ArrowUpRight,
  ArrowDownLeft,
  DollarSign,
  TrendingUp,
  Shield,
  Send,
  PlusCircle,
  Clock,
  Search,
  CheckCircle,
  ExternalLink
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

const CASHFLOW_DATA = [
  { day: 'Mon', inflows: 42000, outflows: 18000 },
  { day: 'Tue', inflows: 58000, outflows: 29000 },
  { day: 'Wed', inflows: 36000, outflows: 22000 },
  { day: 'Thu', inflows: 89000, outflows: 45000 },
  { day: 'Fri', inflows: 124000, outflows: 67000 },
  { day: 'Sat', inflows: 31000, outflows: 12000 },
  { day: 'Sun', inflows: 28000, outflows: 9500 }
];

export const BankingPreview = ({ activeModule = 'dashboard', branding = {} }) => {
  const [selectedAccount, setSelectedAccount] = useState('checking');
  const [transferAmount, setTransferAmount] = useState('');
  const [transferSuccess, setTransferSuccess] = useState(false);

  const handleSimulatedTransfer = (e) => {
    e.preventDefault();
    if (!transferAmount) return;
    setTransferSuccess(true);
    setTimeout(() => {
      setTransferSuccess(false);
      setTransferAmount('');
    }, 3000);
  };

  return (
    <div className="space-y-6">
      {/* Dynamic Brand Banner in Prototype */}
      <div
        className="rounded-xl p-6 text-white shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all"
        style={{
          backgroundColor: branding.primaryColor || '#2563EB',
          backgroundImage: `linear-gradient(135deg, ${branding.primaryColor || '#2563EB'} 0%, ${branding.secondaryColor || '#0F172A'} 100%)`
        }}
      >
        <div>
          <span className="text-xs uppercase tracking-wider opacity-80 font-medium">Enterprise Treasury & Liquidity</span>
          {branding.logo && (
            <img src={branding.logo} alt="Logo" className="h-12 w-12 object-contain rounded-lg bg-white/90 p-1.5 mb-2" />
          )}
          <h2 className="text-2xl font-bold mt-1">
            {branding.companyName || 'ABC Finance'} Global Accounts
          </h2>
          <p className="text-sm opacity-90 mt-1 max-w-xl">
            Real-time multi-currency settlement ledger with automated AML screening and instant FedNow / SEPA rails.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            className="px-4 py-2 rounded-lg text-xs font-semibold bg-white text-slate-900 shadow hover:bg-slate-50 transition"
          >
            Download Statement
          </button>
          <button
            className="px-4 py-2 rounded-lg text-xs font-semibold bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white transition border border-white/20"
          >
            + New Transfer
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>Consolidated Liquidity</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">$24,840,920.45</div>
          <div className="flex items-center gap-1 text-xs text-emerald-600 mt-1 font-medium">
            <ArrowUpRight className="w-3.5 h-3.5" /> +14.2% vs last quarter
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>Operating Accounts</span>
            <CreditCard className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">18 Active</div>
          <div className="text-xs text-slate-500 mt-1">USD, EUR, GBP, JPY</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>Pending Approvals</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">3 Wires</div>
          <div className="text-xs text-amber-600 mt-1 font-medium">Requires dual authorization</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>Compliance Score</span>
            <Shield className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">99.8% Tier-1</div>
          <div className="text-xs text-slate-500 mt-1">SOC-2 & Basel III compliant</div>
        </div>
      </div>

      {/* Main Content Area based on Active Module */}
      {activeModule === 'transfers' ? (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <h3 className="text-base font-semibold text-slate-900 mb-1">Initiate Domestic & International Wire</h3>
          <p className="text-xs text-slate-500 mb-5">Simulated fund transfer module respecting configured branding limits.</p>
          
          {transferSuccess ? (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-3">
              <CheckCircle className="w-6 h-6 text-emerald-600 flex-shrink-0" />
              <div>
                <p className="font-semibold text-sm">Simulated Transfer Dispatched!</p>
                <p className="text-xs text-emerald-700">Reference: WIRE-9982741. Routed via FedNow instant settlement network.</p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSimulatedTransfer} className="space-y-4 max-w-xl">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Debiting Account</label>
                <select className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option>Primary Commercial Checking (...9841) - $18,450,210.00</option>
                  <option>EUR Liquidity Reserve (...1120) - €4,230,000.00</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Beneficiary Name & IBAN</label>
                <input
                  type="text"
                  defaultValue="Apex Global Logistics (DE89 3704 0044 0532 0130 00)"
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Transfer Amount (USD)</label>
                  <input
                    type="number"
                    value={transferAmount}
                    onChange={(e) => setTransferAmount(e.target.value)}
                    placeholder="e.g. 250000"
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Routing Protocol</label>
                  <select className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option>FedNow Real-Time ($0.25)</option>
                    <option>SWIFT GPI Priority ($15.00)</option>
                  </select>
                </div>
              </div>
              <button
                type="submit"
                style={{ backgroundColor: branding.primaryColor || '#2563EB' }}
                className="w-full py-2.5 text-xs font-semibold text-white rounded-lg hover:opacity-95 transition shadow"
              >
                Simulate Wire Dispatch
              </button>
            </form>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chart Section */}
          <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Weekly Inflows vs Settlement Outflows</h3>
                <p className="text-xs text-slate-500">Real-time aggregate clearing volumes</p>
              </div>
              <span className="text-xs font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-600">7-Day Rolling</span>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={CASHFLOW_DATA} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="inflowsGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={branding.primaryColor || '#2563EB'} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={branding.primaryColor || '#2563EB'} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="day" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} tickFormatter={(v) => `$${v / 1000}k`} />
                  <Tooltip
                    formatter={(val) => [`$${val.toLocaleString()}`, 'Amount']}
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="inflows"
                    stroke={branding.primaryColor || '#2563EB'}
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#inflowsGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Quick Ledger / Beneficiaries */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 mb-1">Corporate Wallets</h3>
              <p className="text-xs text-slate-500 mb-4">Sub-account division breakdown</p>

              <div className="space-y-3">
                <div className="p-3 rounded-lg border border-slate-100 bg-slate-50/50 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-slate-800">Operational Payroll</p>
                    <p className="text-[11px] text-slate-500">Checking •••• 8841</p>
                  </div>
                  <span className="text-xs font-bold text-slate-900">$4,120,500</span>
                </div>

                <div className="p-3 rounded-lg border border-slate-100 bg-slate-50/50 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-slate-800">M&A Escrow Reserve</p>
                    <p className="text-[11px] text-slate-500">Escrow •••• 1290</p>
                  </div>
                  <span className="text-xs font-bold text-slate-900">$12,500,000</span>
                </div>

                <div className="p-3 rounded-lg border border-slate-100 bg-slate-50/50 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-slate-800">EUR Cross-Border Pool</p>
                    <p className="text-[11px] text-slate-500">SEPA •••• 7732</p>
                  </div>
                  <span className="text-xs font-bold text-slate-900">€7,420,000</span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 mt-4">
              <button
                style={{ color: branding.primaryColor || '#2563EB' }}
                className="w-full text-center text-xs font-semibold hover:underline flex items-center justify-center gap-1"
              >
                <span>View All 18 Sub-Ledgers</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Recent Transactions Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Recent Settled Transactions</h3>
            <p className="text-xs text-slate-500">Live feed from clearing house</p>
          </div>
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search reference..."
              className="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-5 py-2.5 font-medium">Counterparty / Description</th>
                <th className="px-5 py-2.5 font-medium">Channel</th>
                <th className="px-5 py-2.5 font-medium">Date & Time</th>
                <th className="px-5 py-2.5 font-medium">Amount</th>
                <th className="px-5 py-2.5 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr>
                <td className="px-5 py-3 font-medium text-slate-900 flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-[10px]">
                    ↓
                  </div>
                  <div>
                    <p>Stripe Settlements Inc.</p>
                    <p className="text-[10px] text-slate-400">Batch ref: STRIPE-29401</p>
                  </div>
                </td>
                <td className="px-5 py-3 text-slate-500">ACH Inbound</td>
                <td className="px-5 py-3 text-slate-500">Today, 14:15</td>
                <td className="px-5 py-3 font-semibold text-emerald-600">+$384,920.00</td>
                <td className="px-5 py-3">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Settled
                  </span>
                </td>
              </tr>
              <tr>
                <td className="px-5 py-3 font-medium text-slate-900 flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-[10px]">
                    ↑
                  </div>
                  <div>
                    <p>AWS Cloud Infrastructure EMEA</p>
                    <p className="text-[10px] text-slate-400">Invoice: INV-2026-991</p>
                  </div>
                </td>
                <td className="px-5 py-3 text-slate-500">Wire Outbound</td>
                <td className="px-5 py-3 text-slate-500">Today, 11:20</td>
                <td className="px-5 py-3 font-semibold text-slate-900">-$42,190.50</td>
                <td className="px-5 py-3">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Settled
                  </span>
                </td>
              </tr>
              <tr>
                <td className="px-5 py-3 font-medium text-slate-900 flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-[10px]">
                    ↑
                  </div>
                  <div>
                    <p>Global Payroll Disbursements (ADP)</p>
                    <p className="text-[10px] text-slate-400">Cycle: Oct B-Weekly</p>
                  </div>
                </td>
                <td className="px-5 py-3 text-slate-500">Direct Deposit</td>
                <td className="px-5 py-3 text-slate-500">Yesterday, 17:00</td>
                <td className="px-5 py-3 font-semibold text-slate-900">-$1,840,000.00</td>
                <td className="px-5 py-3">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Settled
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <BankingPreview branding={branding} />
      </div>
    </div>
  );
}
