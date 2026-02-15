
import React from 'react';
import { TaxReport, StateSummary } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';

interface DashboardProps {
  report: TaxReport | null;
  onNavigate: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ report, onNavigate }) => {
  if (!report) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center">
        <div className="bg-white p-12 rounded-2xl shadow-sm border border-gray-100 max-w-md">
          <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <i className="fas fa-file-import text-2xl"></i>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">No Audit Data Found</h2>
          <p className="text-gray-500 mb-8">Import your sales report to begin a multi-jurisdiction tax audit and compliance analysis.</p>
          <button 
            onClick={() => window.location.hash = '#import'}
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 transition"
          >
            Start Audit Now
          </button>
        </div>
      </div>
    );
  }

  const stateData = Object.values(report.states).map((s: StateSummary) => ({
    name: s.name,
    collected: s.taxCollected,
    expected: s.expectedTax,
    variance: s.variance
  })).sort((a, b) => b.expected - a.expected);

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight">Compliance Dashboard</h1>
          <p className="text-gray-500 font-medium">Audit Summary for {report.period || 'Filing Period'}</p>
        </div>
        <button 
          onClick={onNavigate}
          className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-slate-800 transition shadow-lg active:scale-95"
        >
          View Detailed Audit
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Gross Sales Volume" value={`$${report.totalGrossSales.toLocaleString()}`} icon="fa-shopping-cart" color="blue" />
        <StatCard title="Actual Collected" value={`$${report.totalTaxCollected.toLocaleString()}`} icon="fa-hand-holding-usd" color="emerald" />
        <StatCard title="Audit Expected" value={`$${report.totalExpectedTax.toLocaleString()}`} icon="fa-calculator" color="indigo" />
        <StatCard title="Tax Variance" value={`${report.totalVariance > 0 ? '-' : ''}$${Math.abs(report.totalVariance).toLocaleString()}`} icon="fa-exclamation-triangle" color={report.totalVariance > 0 ? "rose" : "emerald"} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-8 rounded-3xl shadow-xl border border-gray-100">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-xl font-black text-gray-900">Tax Collection Accuracy</h3>
            <div className="flex items-center space-x-4">
               <div className="flex items-center space-x-1.5">
                 <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                 <span className="text-[10px] font-black uppercase text-gray-400">Expected</span>
               </div>
               <div className="flex items-center space-x-1.5">
                 <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                 <span className="text-[10px] font-black uppercase text-gray-400">Collected</span>
               </div>
            </div>
          </div>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stateData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700, fill: '#64748b'}} />
                <YAxis axisLine={false} tickLine={false} tickFormatter={(val) => `$${val}`} tick={{fontSize: 10, fontWeight: 700, fill: '#64748b'}} />
                <Tooltip 
                  cursor={{fill: '#f8fafc'}}
                  contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)'}}
                />
                <Bar dataKey="expected" fill="#3b82f6" radius={[6, 6, 0, 0]} barSize={25} />
                <Bar dataKey="collected" fill="#10b981" radius={[6, 6, 0, 0]} barSize={25} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-8 rounded-3xl shadow-xl border border-gray-100">
          <h3 className="text-xl font-black text-gray-900 mb-8">Liability Distribution</h3>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stateData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={100}
                  paddingAngle={8}
                  dataKey="expected"
                >
                  {stateData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-8 space-y-4">
            {stateData.slice(0, 4).map((s, i) => (
              <div key={s.name} className="flex items-center justify-between group">
                <div className="flex items-center">
                  <div className="w-4 h-4 rounded-lg mr-3 shadow-sm" style={{ backgroundColor: COLORS[i % COLORS.length] }}></div>
                  <span className="text-sm font-bold text-gray-600 group-hover:text-gray-900 transition-colors">{s.name}</span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black text-gray-900">${s.expected.toLocaleString()}</p>
                  <p className={`text-[10px] font-black ${s.variance <= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {s.variance <= 0 ? 'Surplus' : 'Deficit'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard: React.FC<{ title: string; value: string; icon: string; color: string }> = ({ title, value, icon, color }) => {
  const colorMap: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    indigo: 'bg-indigo-50 text-indigo-600',
    rose: 'bg-rose-50 text-rose-600',
    amber: 'bg-amber-50 text-amber-600'
  };

  return (
    <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 flex items-center space-x-6 hover:shadow-xl transition-all duration-300">
      <div className={`w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm ${colorMap[color]}`}>
        <i className={`fas ${icon} text-2xl`}></i>
      </div>
      <div>
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{title}</p>
        <p className="text-2xl font-black text-gray-900 mt-1">{value}</p>
      </div>
    </div>
  );
};

export default Dashboard;
