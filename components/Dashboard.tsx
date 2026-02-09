
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
          <h2 className="text-2xl font-bold text-gray-900 mb-2">No Data Found</h2>
          <p className="text-gray-500 mb-8">Import your sales report to see a comprehensive sales tax analysis and breakdown.</p>
          <button 
            onClick={() => window.location.hash = '#import'}
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 transition"
          >
            Import My First Report
          </button>
        </div>
      </div>
    );
  }

  // Explicitly typing 's' as StateSummary to fix unknown property errors
  const stateData = Object.values(report.states).map((s: StateSummary) => ({
    name: s.name,
    tax: s.taxCollected,
    sales: s.grossSales
  })).sort((a, b) => b.tax - a.tax);

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Tax Overview</h1>
          <p className="text-gray-500">Period: {report.period || 'Current Filing Period'}</p>
        </div>
        <button 
          onClick={onNavigate}
          className="bg-white text-blue-600 border border-blue-600 px-4 py-2 rounded-lg font-medium hover:bg-blue-50 transition"
        >
          View Detailed Reports
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Gross Sales" value={`$${report.totalGrossSales.toLocaleString()}`} icon="fa-shopping-cart" color="blue" />
        <StatCard title="Total Taxable Sales" value={`$${report.totalTaxableSales.toLocaleString()}`} icon="fa-receipt" color="emerald" />
        <StatCard title="Taxes Collected" value={`$${report.totalTaxCollected.toLocaleString()}`} icon="fa-hand-holding-usd" color="amber" />
        <StatCard title="Tax Liability (Owed)" value={`$${report.totalTaxLiability.toLocaleString()}`} icon="fa-exclamation-triangle" color="rose" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Taxes Collected by State</h3>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stateData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} tickFormatter={(val) => `$${val}`} />
                <Tooltip 
                  cursor={{fill: '#f3f4f6'}}
                  contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                />
                <Bar dataKey="tax" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-6">State Breakdown</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stateData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="tax"
                >
                  {stateData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 space-y-2">
            {stateData.slice(0, 5).map((s, i) => (
              <div key={s.name} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: COLORS[i % COLORS.length] }}></div>
                  <span className="text-sm text-gray-600">{s.name}</span>
                </div>
                <span className="text-sm font-semibold text-gray-900">${s.tax.toLocaleString()}</span>
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
    amber: 'bg-amber-50 text-amber-600',
    rose: 'bg-rose-50 text-rose-600'
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-start space-x-4">
      <div className={`p-4 rounded-xl ${colorMap[color]}`}>
        <i className={`fas ${icon} text-xl`}></i>
      </div>
      <div>
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
      </div>
    </div>
  );
};

export default Dashboard;
