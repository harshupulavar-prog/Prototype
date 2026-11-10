import React, { useState } from 'react';
import branding from './branding.json';
import {
  Users,
  CalendarCheck,
  Clock,
  Briefcase,
  UserCheck,
  Check,
  X,
  Search,
  Filter,
  Award
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

const ATTENDANCE_DATA = [
  { dept: 'Eng', present: 142, remote: 28, leave: 4 },
  { dept: 'Product', present: 38, remote: 12, leave: 2 },
  { dept: 'Sales', present: 64, remote: 18, leave: 6 },
  { dept: 'Marketing', present: 29, remote: 8, leave: 3 },
  { dept: 'Finance', present: 22, remote: 4, leave: 1 }
];

export const HRMSPreview = ({ activeModule = 'dashboard', branding = {} }) => {
  const [leaveRequests, setLeaveRequests] = useState([
    { id: 1, name: 'Clara Oswald', role: 'Staff Software Engineer', days: 'Nov 12 - Nov 16 (5 days)', type: 'Annual Paid Leave', status: 'Pending' },
    { id: 2, name: 'Rohan Sharma', role: 'Product Marketing Lead', days: 'Nov 09 - Nov 10 (2 days)', type: 'Personal Leave', status: 'Pending' }
  ]);

  const handleAction = (id, newStatus) => {
    setLeaveRequests((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: newStatus } : r))
    );
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div
        className="rounded-xl p-6 text-white shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all"
        style={{
          backgroundColor: branding.primaryColor || '#059669',
          backgroundImage: `linear-gradient(135deg, ${branding.primaryColor || '#059669'} 0%, ${branding.secondaryColor || '#064E3B'} 100%)`
        }}
      >
        <div>
          <span className="text-xs uppercase tracking-wider opacity-80 font-medium">Workforce Operating System</span>
          {branding.logo && (
            <img src={branding.logo} alt="Logo" className="h-12 w-12 object-contain rounded-lg bg-white/90 p-1.5 mb-2" />
          )}
          <h2 className="text-2xl font-bold mt-1">
            {branding.companyName || 'Nova Technologies'} People & Culture
          </h2>
          <p className="text-sm opacity-90 mt-1 max-w-xl">
            Managing global headcount, multi-country payroll compliance, and employee lifecycle performance.
          </p>
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 rounded-lg text-xs font-semibold bg-white text-slate-900 shadow hover:bg-slate-50 transition">
            + Onboard Employee
          </button>
          <button className="px-4 py-2 rounded-lg text-xs font-semibold bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white transition border border-white/20">
            Run Payroll Cycle
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>Total Active Headcount</span>
            <Users className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">348 Full-Time</div>
          <div className="text-xs text-emerald-600 mt-1 font-medium">+12 joiners this month</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>Today's Attendance Rate</span>
            <CalendarCheck className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">97.4%</div>
          <div className="text-xs text-slate-500 mt-1">295 In-Office / Remote logged</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>Pending Leave Requests</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">8 Pending</div>
          <div className="text-xs text-amber-600 mt-1 font-medium">Requires manager review</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>Avg Employee Net Promoter</span>
            <Award className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">+64 eNPS</div>
          <div className="text-xs text-slate-500 mt-1">Top 5% tech percentile</div>
        </div>
      </div>

      {/* Grid: Charts + Leave Approvals */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Attendance & Hybrid Roster by Department</h3>
              <p className="text-xs text-slate-500">Live breakdown of present, remote, and on-leave</p>
            </div>
            <span className="text-xs font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-600">Today</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ATTENDANCE_DATA} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="dept" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                />
                <Bar dataKey="present" fill={branding.primaryColor || '#059669'} radius={[4, 4, 0, 0]} name="In Office" />
                <Bar dataKey="remote" fill={branding.accentColor || '#34D399'} radius={[4, 4, 0, 0]} name="Remote" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Leave Requests Action Module */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-900 mb-1">Pending Leave Approval</h3>
            <p className="text-xs text-slate-500 mb-4">Click to simulate manager sign-off</p>

            <div className="space-y-3">
              {leaveRequests.map((req) => (
                <div key={req.id} className="p-3 rounded-lg border border-slate-100 bg-slate-50/70">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs font-semibold text-slate-800">{req.name}</p>
                      <p className="text-[11px] text-slate-500">{req.role}</p>
                    </div>
                    {req.status === 'Pending' ? (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                        Pending
                      </span>
                    ) : req.status === 'Approved' ? (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                        Approved
                      </span>
                    ) : (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800">
                        Rejected
                      </span>
                    )}
                  </div>
                  <div className="mt-2 text-[11px] text-slate-600 bg-white p-2 rounded border border-slate-200/60">
                    <p className="font-medium">{req.type}</p>
                    <p className="text-slate-400">{req.days}</p>
                  </div>
                  {req.status === 'Pending' && (
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={() => handleAction(req.id, 'Approved')}
                        style={{ backgroundColor: branding.primaryColor || '#059669' }}
                        className="flex-1 py-1 text-[11px] font-semibold text-white rounded hover:opacity-90 flex items-center justify-center gap-1 transition"
                      >
                        <Check className="w-3 h-3" /> Approve
                      </button>
                      <button
                        onClick={() => handleAction(req.id, 'Rejected')}
                        className="px-2.5 py-1 text-[11px] font-semibold text-slate-600 bg-slate-200 rounded hover:bg-slate-300 transition"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  )}
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
        <HRMSPreview branding={branding} />
      </div>
    </div>
  );
}
