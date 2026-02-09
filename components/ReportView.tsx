
import React, { useState } from 'react';
import { TaxReport, StateSummary, CountySummary, JurisdictionSummary } from '../types';

interface ReportViewProps {
  report: TaxReport | null;
}

const ReportView: React.FC<ReportViewProps> = ({ report }) => {
  const [expandedStates, setExpandedStates] = useState<Set<string>>(new Set());
  const [expandedCounties, setExpandedCounties] = useState<Set<string>>(new Set());

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

  const handleDownload = () => {
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sales-tax-report-${report.period || 'summary'}.json`;
    a.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Sales Tax Summary Report</h2>
          <p className="text-gray-500 text-sm italic">Counties automatically inferred from cities. Official jurisdiction codes included.</p>
        </div>
        <div className="flex space-x-3">
          <button 
            onClick={() => window.print()}
            className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
          >
            <i className="fas fa-print mr-2 text-gray-400"></i> Print Report
          </button>
          <button 
            onClick={handleDownload}
            className="flex items-center px-4 py-2 bg-blue-600 rounded-lg text-sm font-medium text-white hover:bg-blue-700 shadow-sm transition"
          >
            <i className="fas fa-download mr-2"></i> Export Data
          </button>
        </div>
      </div>

      <div className="bg-white shadow-sm border border-gray-200 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Jurisdiction</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Code</th>
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
                        <i className={`fas fa-chevron-${expandedStates.has(stateCode) ? 'down' : 'right'} text-gray-400 w-4 mr-2`}></i>
                        <span className="font-bold text-gray-900">{state.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-left font-mono text-xs text-gray-400">{state.jurisdictionCode || '-'}</td>
                    <td className="px-6 py-4 text-right font-medium">${state.grossSales.toLocaleString()}</td>
                    <td className="px-6 py-4 text-right font-medium">${state.taxableSales.toLocaleString()}</td>
                    <td className="px-6 py-4 text-right font-bold text-blue-600">${state.taxCollected.toLocaleString()}</td>
                    <td className="px-6 py-4 text-right font-bold text-rose-600">${state.taxLiability.toLocaleString()}</td>
                  </tr>

                  {/* Counties */}
                  {expandedStates.has(stateCode) && state.counties && Object.entries(state.counties).map(([countyName, county]: [string, CountySummary]) => (
                    <React.Fragment key={`${stateCode}-${countyName}`}>
                      <tr className="bg-gray-50/50 hover:bg-gray-100 transition cursor-pointer" onClick={(e) => {
                        e.stopPropagation();
                        toggleCounty(`${stateCode}-${countyName}`);
                      }}>
                        <td className="px-6 py-3 whitespace-nowrap pl-12">
                          <div className="flex items-center">
                            <i className={`fas fa-chevron-${expandedCounties.has(`${stateCode}-${countyName}`) ? 'down' : 'right'} text-gray-400 w-4 mr-2`}></i>
                            <span className="text-gray-700 font-medium">{county.name} County</span>
                          </div>
                        </td>
                        <td className="px-6 py-3 text-left font-mono text-xs text-blue-400">{county.jurisdictionCode || '-'}</td>
                        <td className="px-6 py-3 text-right text-gray-600">${county.grossSales.toLocaleString()}</td>
                        <td className="px-6 py-3 text-right text-gray-600">${county.taxableSales.toLocaleString()}</td>
                        <td className="px-6 py-3 text-right font-semibold text-blue-500">${county.taxCollected.toLocaleString()}</td>
                        <td className="px-6 py-3 text-right font-semibold text-rose-500">${county.taxLiability.toLocaleString()}</td>
                      </tr>

                      {/* Cities */}
                      {expandedCounties.has(`${stateCode}-${countyName}`) && county.cities && Object.entries(county.cities).map(([cityName, city]: [string, JurisdictionSummary]) => (
                        <tr key={`${stateCode}-${countyName}-${cityName}`} className="bg-white hover:bg-gray-50">
                          <td className="px-6 py-2 whitespace-nowrap pl-20 text-gray-500 italic">
                            {city.name}
                          </td>
                          <td className="px-6 py-2 text-left font-mono text-[10px] text-gray-300">{city.jurisdictionCode || '-'}</td>
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
                <td colSpan={2} className="px-6 py-6 text-gray-900">GRAND TOTAL</td>
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
