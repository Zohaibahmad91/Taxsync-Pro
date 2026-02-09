
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
      ['State', 'County', 'City', 'Jurisdiction Code', 'Tax Rate', 'Gross Sales', 'Taxable Sales', 'Tax Collected', 'Liability']
    ];

    Object.values(report.states).forEach((state: StateSummary) => {
      rows.push([state.name, '', '', state.jurisdictionCode || '', state.taxRate ? `${state.taxRate}%` : '', state.grossSales.toString(), state.taxableSales.toString(), state.taxCollected.toString(), state.taxLiability.toString()]);
      Object.values(state.counties).forEach((county: CountySummary) => {
        rows.push([state.name, county.name, '', county.jurisdictionCode || '', county.taxRate ? `${county.taxRate}%` : '', county.grossSales.toString(), county.taxableSales.toString(), county.taxCollected.toString(), county.taxLiability.toString()]);
        Object.values(county.cities).forEach((city: JurisdictionSummary) => {
          rows.push([state.name, county.name, city.name, city.jurisdictionCode || '', city.taxRate ? `${city.taxRate}%` : '', city.grossSales.toString(), city.taxableSales.toString(), city.taxCollected.toString(), city.taxLiability.toString()]);
        });
      });
    });

    rows.push(['TOTAL', '', '', '', '', report.totalGrossSales.toString(), report.totalTaxableSales.toString(), report.totalTaxCollected.toString(), report.totalTaxLiability.toString()]);
    return rows;
  };

  const exportCSV = () => {
    const data = getExportData();
    const csvContent = "data:text/csv;charset=utf-8," + data.map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `SalesTaxReport_${report.period || 'Summary'}.csv`);
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
    link.download = `SalesTaxReport_${report.period || 'Summary'}.xls`;
    link.click();
    setShowExportOptions(false);
  };

  const exportWord = () => {
    const data = getExportData();
    let docHtml = `<html><head><meta charset="utf-8"><style>table { border-collapse: collapse; width: 100%; } th, td { border: 1px solid black; padding: 8px; text-align: left; }</style></head><body><h1>Sales Tax Report - ${report.period}</h1><table>`;
    data.forEach(row => {
      docHtml += `<tr>${row.map(c => `<td>${c}</td>`).join('')}</tr>`;
    });
    docHtml += '</table></body></html>';

    const blob = new Blob([docHtml], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `SalesTaxReport_${report.period || 'Summary'}.doc`;
    link.click();
    setShowExportOptions(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Sales Tax Summary Report</h2>
          <p className="text-gray-500 text-sm italic">Detailed breakdown including Tax Rates and inferred jurisdictions.</p>
        </div>
        <div className="flex items-center space-x-3 relative">
          <button 
            onClick={() => window.print()}
            className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
          >
            <i className="fas fa-file-pdf mr-2 text-red-500"></i> Export PDF / Print
          </button>
          
          <div className="relative">
            <button 
              onClick={() => setShowExportOptions(!showExportOptions)}
              className="flex items-center px-4 py-2 bg-blue-600 rounded-lg text-sm font-medium text-white hover:bg-blue-700 shadow-sm transition"
            >
              <i className="fas fa-download mr-2"></i> Download Report <i className="fas fa-chevron-down ml-2 text-xs opacity-70"></i>
            </button>
            
            {showExportOptions && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden animate-in fade-in zoom-in duration-200">
                <button onClick={exportCSV} className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 flex items-center border-b border-gray-50">
                  <i className="fas fa-file-csv w-5 text-green-600"></i> Export as CSV
                </button>
                <button onClick={exportExcel} className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 flex items-center border-b border-gray-50">
                  <i className="fas fa-file-excel w-5 text-emerald-600"></i> Export as Excel (XLS)
                </button>
                <button onClick={exportWord} className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 flex items-center border-b border-gray-50">
                  <i className="fas fa-file-word w-5 text-blue-500"></i> Export as Word (DOC)
                </button>
                <button 
                  onClick={() => {
                    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `tax-report-raw.json`;
                    a.click();
                    setShowExportOptions(false);
                  }} 
                  className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 flex items-center"
                >
                  <i className="fas fa-file-code w-5 text-gray-500"></i> Export Raw JSON
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white shadow-sm border border-gray-200 rounded-2xl overflow-hidden print:shadow-none print:border-none">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Jurisdiction</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Code</th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Rate</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Gross Sales</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Taxable Sales</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Tax Collected</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Liability</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {Object.entries(report.states).map(([stateCode, state]: [string, StateSummary]) => (
                <React.Fragment key={stateCode}>
                  {/* State Row */}
                  <tr className="hover:bg-gray-50 transition cursor-pointer" onClick={() => toggleState(stateCode)}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <i className={`fas fa-chevron-${expandedStates.has(stateCode) ? 'down' : 'right'} text-gray-400 w-4 mr-2 print:hidden`}></i>
                        <span className="font-bold text-gray-900">{state.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-left font-mono text-xs text-gray-400">{state.jurisdictionCode || '-'}</td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                        {state.taxRate ? `${state.taxRate}%` : '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-medium">${state.grossSales.toLocaleString()}</td>
                    <td className="px-6 py-4 text-right font-medium">${state.taxableSales.toLocaleString()}</td>
                    <td className="px-6 py-4 text-right font-bold text-blue-600">${state.taxCollected.toLocaleString()}</td>
                    <td className="px-6 py-4 text-right font-bold text-rose-600">${state.taxLiability.toLocaleString()}</td>
                  </tr>

                  {/* Counties */}
                  {(expandedStates.has(stateCode) || window.matchMedia('print').matches) && state.counties && Object.entries(state.counties).map(([countyName, county]: [string, CountySummary]) => (
                    <React.Fragment key={`${stateCode}-${countyName}`}>
                      <tr className="bg-gray-50/50 hover:bg-gray-100 transition cursor-pointer" onClick={(e) => {
                        e.stopPropagation();
                        toggleCounty(`${stateCode}-${countyName}`);
                      }}>
                        <td className="px-6 py-3 whitespace-nowrap pl-12">
                          <div className="flex items-center">
                            <i className={`fas fa-chevron-${expandedCounties.has(`${stateCode}-${countyName}`) ? 'down' : 'right'} text-gray-400 w-4 mr-2 print:hidden`}></i>
                            <span className="text-gray-700 font-medium">{county.name} County</span>
                          </div>
                        </td>
                        <td className="px-6 py-3 text-left font-mono text-xs text-blue-400">{county.jurisdictionCode || '-'}</td>
                        <td className="px-6 py-3 text-center">
                          <span className="text-xs font-medium text-blue-600">
                            {county.taxRate ? `${county.taxRate}%` : '-'}
                          </span>
                        </td>
                        <td className="px-6 py-3 text-right text-gray-600">${county.grossSales.toLocaleString()}</td>
                        <td className="px-6 py-3 text-right text-gray-600">${county.taxableSales.toLocaleString()}</td>
                        <td className="px-6 py-3 text-right font-semibold text-blue-500">${county.taxCollected.toLocaleString()}</td>
                        <td className="px-6 py-3 text-right font-semibold text-rose-500">${county.taxLiability.toLocaleString()}</td>
                      </tr>

                      {/* Cities */}
                      {(expandedCounties.has(`${stateCode}-${countyName}`) || window.matchMedia('print').matches) && county.cities && Object.entries(county.cities).map(([cityName, city]: [string, JurisdictionSummary]) => (
                        <tr key={`${stateCode}-${countyName}-${cityName}`} className="bg-white hover:bg-gray-50">
                          <td className="px-6 py-2 whitespace-nowrap pl-20 text-gray-500 italic">
                            {city.name}
                          </td>
                          <td className="px-6 py-2 text-left font-mono text-[10px] text-gray-300">{city.jurisdictionCode || '-'}</td>
                          <td className="px-6 py-2 text-center">
                            <span className="text-[10px] font-medium text-gray-400">
                              {city.taxRate ? `${city.taxRate}%` : '-'}
                            </span>
                          </td>
                          <td className="px-6 py-2 text-right text-gray-500 text-sm">${city.grossSales.toLocaleString()}</td>
                          <td className="px-6 py-2 text-right text-gray-500 text-sm">${city.taxableSales.toLocaleString()}</td>
                          <td className="px-6 py-2 text-right text-gray-500 text-sm">${city.taxCollected.toLocaleString()}</td>
                          <td className="px-6 py-2 text-right text-gray-500 text-sm font-semibold">${city.taxLiability.toLocaleString()}</td>
                        </tr>
                      ))}
                    </React.Fragment>
                  ))}
                </React.Fragment>
              ))}
            </tbody>
            <tfoot className="bg-blue-50/30">
              <tr className="font-bold">
                <td colSpan={3} className="px-6 py-6 text-gray-900">GRAND TOTAL</td>
                <td className="px-6 py-6 text-right">${report.totalGrossSales.toLocaleString()}</td>
                <td className="px-6 py-6 text-right">${report.totalTaxableSales.toLocaleString()}</td>
                <td className="px-6 py-6 text-right text-blue-700 font-extrabold text-lg">${report.totalTaxCollected.toLocaleString()}</td>
                <td className="px-6 py-6 text-right text-rose-700 font-extrabold text-lg">${report.totalTaxLiability.toLocaleString()}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ReportView;
