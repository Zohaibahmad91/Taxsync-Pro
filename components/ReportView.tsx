
import React, { useState } from 'react';
import { TaxReport, StateSummary, CountySummary, JurisdictionSummary } from '../types';

interface ReportViewProps {
  report: TaxReport | null;
}

const ReportView: React.FC<ReportViewProps> = ({ report }) => {
  const [expandedStates, setExpandedStates] = useState<Set<string>>(new Set());
  const [expandedCounties, setExpandedCounties] = useState<Set<string>>(new Set());
  const [showExportOptions, setShowExportOptions] = useState(false);

  if (!report) return <div className="text-center p-12 text-gray-500">No report available. Please import data first.</div>;

  const toggleState = (stateName: string) => {
    const newSet = new Set(expandedStates);
    if (newSet.has(stateName)) newSet.delete(stateName);
    else newSet.add(stateName);
    setExpandedStates(newSet);
  };

  const toggleCounty = (countyId: string) => {
    const newSet = new Set(expandedCounties);
    if (newSet.has(countyId)) newSet.delete(countyId);
    else newSet.add(countyId);
    setExpandedCounties(newSet);
  };

  const getExportData = () => {
    const rows = [
      ['State', 'County', 'City', 'Tax Rate', 'Gross Sales', 'Taxable Sales', 'Collected Tax', 'Expected Tax', 'Variance']
    ];

    Object.values(report.states).forEach((state: StateSummary) => {
      rows.push([state.name, '', '', state.taxRate ? `${state.taxRate}%` : '', state.grossSales.toString(), state.taxableSales.toString(), state.taxCollected.toString(), state.expectedTax.toString(), state.variance.toString()]);
      Object.values(state.counties).forEach((county: CountySummary) => {
        rows.push([state.name, county.name, '', county.taxRate ? `${county.taxRate}%` : '', county.grossSales.toString(), county.taxableSales.toString(), county.taxCollected.toString(), county.expectedTax.toString(), county.variance.toString()]);
        Object.values(county.cities).forEach((city: JurisdictionSummary) => {
          rows.push([state.name, county.name, city.name, city.taxRate ? `${city.taxRate}%` : '', city.grossSales.toString(), city.taxableSales.toString(), city.taxCollected.toString(), city.expectedTax.toString(), city.variance.toString()]);
        });
      });
    });

    rows.push(['TOTAL', '', '', '', report.totalGrossSales.toString(), report.totalTaxableSales.toString(), report.totalTaxCollected.toString(), report.totalExpectedTax.toString(), report.totalVariance.toString()]);
    return rows;
  };

  const exportCSV = () => {
    const data = getExportData();
    const csvContent = "data:text/csv;charset=utf-8," + data.map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Full_Tax_Audit_${report.period || 'Summary'}.csv`);
    document.body.appendChild(link);
    link.click();
    setShowExportOptions(false);
  };

  const exportExcel = () => {
    const data = getExportData();
    let tableHtml = `<table border="1"><thead><tr>${data[0].map(h => `<th>${h}</th>`).join('')}</tr></thead><tbody>`;
    data.slice(1).forEach(row => {
      tableHtml += `<tr>${row.map(c => `<td>${c}</td>`).join('')}</tr>`;
    });
    tableHtml += '</tbody></table>';

    const blob = new Blob([tableHtml], { type: 'application/vnd.ms-excel' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Full_Tax_Audit_${report.period || 'Summary'}.xls`;
    link.click();
    setShowExportOptions(false);
  };

  const formatVariance = (val: number) => {
    if (val === 0) return <span className="text-gray-400">$0.00</span>;
    if (val > 0) return <span className="text-rose-600 font-bold">-${val.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>;
    return <span className="text-emerald-600 font-bold">+${Math.abs(val).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-gray-900 tracking-tight">Tax Audit Reports</h2>
          <p className="text-gray-500 font-medium">Comparison of Collected vs. Expected tax amounts.</p>
        </div>
        <div className="flex items-center space-x-3 relative">
          <button 
            onClick={() => window.print()}
            className="flex items-center px-5 py-2.5 bg-white border border-gray-300 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 transition shadow-sm"
          >
            <i className="fas fa-print mr-2 text-gray-400"></i> Print Audit
          </button>
          
          <div className="relative">
            <button 
              onClick={() => setShowExportOptions(!showExportOptions)}
              className="flex items-center px-6 py-2.5 bg-blue-600 rounded-xl text-sm font-bold text-white hover:bg-blue-700 shadow-xl transition active:scale-95"
            >
              <i className="fas fa-download mr-2"></i> Export Data <i className="fas fa-chevron-down ml-2 text-xs opacity-70"></i>
            </button>
            
            {showExportOptions && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden animate-in fade-in zoom-in duration-200">
                <button onClick={exportCSV} className="w-full text-left px-5 py-4 text-sm font-semibold text-gray-700 hover:bg-gray-50 flex items-center border-b border-gray-50">
                  <i className="fas fa-file-csv w-6 text-green-600"></i> Export CSV
                </button>
                <button onClick={exportExcel} className="w-full text-left px-5 py-4 text-sm font-semibold text-gray-700 hover:bg-gray-50 flex items-center">
                  <i className="fas fa-file-excel w-6 text-emerald-600"></i> Export Excel
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white shadow-xl rounded-[2rem] border border-gray-100 overflow-hidden print:shadow-none print:border-none">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50/50">
              <tr>
                <th className="px-6 py-5 text-left text-xs font-black text-gray-400 uppercase tracking-widest">Jurisdiction</th>
                <th className="px-6 py-5 text-center text-xs font-black text-gray-400 uppercase tracking-widest">Rate</th>
                <th className="px-6 py-5 text-right text-xs font-black text-gray-400 uppercase tracking-widest">Taxable Sales</th>
                <th className="px-6 py-5 text-right text-xs font-black text-gray-400 uppercase tracking-widest">Collected Tax</th>
                <th className="px-6 py-5 text-right text-xs font-black text-gray-400 uppercase tracking-widest">Expected Tax</th>
                <th className="px-6 py-5 text-right text-xs font-black text-gray-400 uppercase tracking-widest">Variance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {Object.entries(report.states).map(([stateName, state]: [string, StateSummary]) => (
                <React.Fragment key={stateName}>
                  <tr className="hover:bg-blue-50/30 transition cursor-pointer group" onClick={() => toggleState(stateName)}>
                    <td className="px-6 py-5 whitespace-nowrap">
                      <div className="flex items-center">
                        <i className={`fas fa-chevron-${expandedStates.has(stateName) ? 'down' : 'right'} text-blue-400 w-4 mr-3 print:hidden transition-transform`}></i>
                        <span className="font-black text-gray-900 text-lg">{state.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-black bg-blue-100 text-blue-700">
                        {state.taxRate ? `${state.taxRate}%` : '-'}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-right font-bold text-gray-600">${state.taxableSales.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    <td className="px-6 py-5 text-right font-bold text-gray-900">${state.taxCollected.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    <td className="px-6 py-5 text-right font-bold text-blue-600">${state.expectedTax.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    <td className="px-6 py-5 text-right">{formatVariance(state.variance)}</td>
                  </tr>

                  {(expandedStates.has(stateName) || window.matchMedia('print').matches) && state.counties && Object.entries(state.counties).map(([countyName, county]: [string, CountySummary]) => (
                    <React.Fragment key={`${stateName}-${countyName}`}>
                      <tr className="bg-gray-50/30 hover:bg-gray-100/50 transition cursor-pointer" onClick={(e) => {
                        e.stopPropagation();
                        toggleCounty(`${stateName}-${countyName}`);
                      }}>
                        <td className="px-6 py-4 whitespace-nowrap pl-14">
                          <div className="flex items-center">
                            <i className={`fas fa-chevron-${expandedCounties.has(`${stateName}-${countyName}`) ? 'down' : 'right'} text-gray-400 w-4 mr-2 print:hidden`}></i>
                            <span className="text-gray-700 font-bold">{county.name} County</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="text-xs font-bold text-gray-500">{county.taxRate ? `${county.taxRate}%` : '-'}</span>
                        </td>
                        <td className="px-6 py-4 text-right text-gray-500">${county.taxableSales.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                        <td className="px-6 py-4 text-right font-medium text-gray-700">${county.taxCollected.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                        <td className="px-6 py-4 text-right font-medium text-blue-500">${county.expectedTax.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                        <td className="px-6 py-4 text-right">{formatVariance(county.variance)}</td>
                      </tr>

                      {(expandedCounties.has(`${stateName}-${countyName}`) || window.matchMedia('print').matches) && county.cities && Object.entries(county.cities).map(([cityName, city]: [string, JurisdictionSummary]) => (
                        <tr key={`${stateName}-${countyName}-${cityName}`} className="bg-white hover:bg-gray-50/50">
                          <td className="px-6 py-3 whitespace-nowrap pl-24 text-gray-400 font-medium">
                            {city.name}
                          </td>
                          <td className="px-6 py-3 text-center text-xs text-gray-300 font-bold">{city.taxRate ? `${city.taxRate}%` : '-'}</td>
                          <td className="px-6 py-3 text-right text-gray-400 text-sm">${city.taxableSales.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                          <td className="px-6 py-3 text-right text-gray-400 text-sm">${city.taxCollected.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                          <td className="px-6 py-3 text-right text-gray-400 text-sm">${city.expectedTax.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                          <td className="px-6 py-3 text-right text-xs">{formatVariance(city.variance)}</td>
                        </tr>
                      ))}
                    </React.Fragment>
                  ))}
                </React.Fragment>
              ))}
            </tbody>
            <tfoot className="bg-slate-900 text-white">
              <tr className="font-black">
                <td colSpan={2} className="px-6 py-8 text-xl">TOTAL AUDIT</td>
                <td className="px-6 py-8 text-right text-lg">${report.totalTaxableSales.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                <td className="px-6 py-8 text-right text-lg">${report.totalTaxCollected.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                <td className="px-6 py-8 text-right text-lg text-blue-400">${report.totalExpectedTax.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                <td className="px-6 py-8 text-right text-xl">{formatVariance(report.totalVariance)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
          <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Accuracy Rating</h4>
          <div className="flex items-center space-x-4">
            <div className="text-3xl font-black text-gray-900">
              {report.totalVariance === 0 ? '100%' : `${(100 - (Math.abs(report.totalVariance) / report.totalExpectedTax * 100)).toFixed(1)}%`}
            </div>
            <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${report.totalVariance <= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
              {report.totalVariance <= 0 ? 'Optimal' : 'Needs Review'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportView;
