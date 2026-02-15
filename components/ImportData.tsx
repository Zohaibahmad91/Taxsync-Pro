
import React, { useState, useEffect } from 'react';
import { processSalesData, MOCK_SALES_CSV } from '../services/geminiService';
import { TaxReport } from '../types';

interface ImportDataProps {
  onReportGenerated: (report: TaxReport) => void;
}

const STATUS_MESSAGES = [
  "Initializing high-speed audit engine...",
  "Ingesting transaction logs...",
  "Parsing accounting notations (parentheses, dashes)...",
  "Normalizing geographic data and fixing typos...",
  "Cross-referencing 2024/2025 US County maps...",
  "Mapping Cities to their correct Tax Jurisdictions...",
  "Calculating Expected Tax based on combined local rates...",
  "Auditing 100% of rows for total accuracy...",
  "Validating variance against report grand totals...",
  "Finalizing comprehensive jurisdiction report..."
];

const ImportData: React.FC<ImportDataProps> = ({ onReportGenerated }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileSize, setFileSize] = useState<number>(0);
  const [statusIndex, setStatusIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let interval: any;
    if (isProcessing) {
      interval = setInterval(() => {
        setStatusIndex(prev => (prev + 1) % STATUS_MESSAGES.length);
        setProgress(prev => Math.min(prev + 0.6, 99)); // Even smoother progress to reflect deep reasoning
      }, 3500);
    } else {
      setProgress(0);
      setStatusIndex(0);
    }
    return () => clearInterval(interval);
  }, [isProcessing]);

  const cleanCsvText = (text: string): string => {
    return text
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .join('\n');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setFileSize(file.size);
    setIsProcessing(true);
    setError(null);
    setProgress(5);
    
    try {
      let content: string;
      if (file.type === 'text/csv' || file.name.endsWith('.csv') || file.name.endsWith('.txt')) {
        const rawText = await file.text();
        content = cleanCsvText(rawText);
      } else {
        const reader = new FileReader();
        const base64 = await new Promise<string>((resolve) => {
          reader.onload = () => resolve((reader.result as string).split(',')[1]);
          reader.readAsDataURL(file);
        });
        content = base64;
      }

      const report = await processSalesData(content, file.type === 'text/csv' ? 'text/plain' : file.type);
      setProgress(100);
      setTimeout(() => onReportGenerated(report), 800);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to process high-volume data. Please ensure file headers are present.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in slide-in-from-bottom duration-500 pb-20">
      <div className="text-center">
        <h2 className="text-4xl font-black text-gray-900 tracking-tight">Sync Sales Data</h2>
        <p className="text-gray-500 mt-4 text-lg max-w-2xl mx-auto leading-relaxed">
          Our high-precision auditor cross-references every city against the latest 2024/2025 US County tax maps to ensure 100% filing accuracy.
        </p>
      </div>

      {!isProcessing ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-gray-100 flex flex-col items-center text-center transition-all hover:shadow-2xl hover:border-blue-200 group">
            <div className="w-24 h-24 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center mb-8 rotate-3 group-hover:rotate-0 transition-transform shadow-sm">
              <i className="fas fa-file-csv text-4xl"></i>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Advanced Tax Audit</h3>
            <p className="text-gray-500 text-sm mb-10 px-6">
              Compatible with <strong>Shopify, Amazon, and ERP</strong> exports. Includes automatic City-to-County lookup.
            </p>
            <label className="w-full">
              <input 
                type="file" 
                className="hidden" 
                accept=".csv,.xlsx,.xls,.pdf,.txt" 
                onChange={handleFileUpload}
              />
              <div className="cursor-pointer px-8 py-12 border-2 border-dashed border-gray-200 rounded-3xl bg-gray-50 hover:bg-white hover:border-blue-500 hover:shadow-inner transition-all flex flex-col items-center justify-center group-active:scale-[0.98]">
                <i className="fas fa-upload mb-4 text-3xl text-gray-300 group-hover:text-blue-400 transition-colors"></i>
                <span className="font-bold text-gray-800 text-lg">Select Sales Report</span>
                <span className="text-[11px] text-gray-400 mt-2 uppercase tracking-widest font-black">CSV, EXCEL, or PDF • Unlimited Rows</span>
              </div>
            </label>
            {fileName && (
              <div className="mt-6 flex items-center bg-blue-50 px-4 py-2 rounded-full border border-blue-100">
                <i className="fas fa-check-circle text-blue-500 mr-2"></i>
                <span className="text-sm text-blue-700 font-bold">{fileName}</span>
              </div>
            )}
          </div>

          <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-gray-100 flex flex-col items-center text-center transition-all hover:shadow-2xl hover:border-indigo-200 group">
            <div className="w-24 h-24 bg-indigo-50 text-indigo-600 rounded-3xl flex items-center justify-center mb-8 -rotate-3 group-hover:rotate-0 transition-transform shadow-sm">
              <i className="fab fa-shopify text-4xl"></i>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Direct Cloud Sync</h3>
            <p className="text-gray-500 text-sm mb-10 px-6">
              Connect directly to your store to pull transaction logs without manual file handling.
            </p>
            <button className="w-full bg-slate-900 text-white font-bold py-5 rounded-3xl hover:bg-slate-800 transition-all flex items-center justify-center shadow-xl hover:shadow-slate-200 active:scale-95 transform">
              <i className="fab fa-shopify mr-3 text-2xl"></i>
              Connect Account
            </button>
            <div className="mt-8 flex items-center space-x-4 opacity-30 grayscale">
              <i className="fab fa-amazon text-2xl"></i>
              <i className="fab fa-ebay text-2xl"></i>
              <i className="fab fa-stripe text-2xl"></i>
              <i className="fab fa-square text-xl"></i>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white p-12 md:p-24 rounded-[3.5rem] shadow-2xl border border-blue-50 flex flex-col items-center text-center animate-in zoom-in duration-700 max-w-4xl mx-auto">
          {fileSize > 250000 && (
            <div className="mb-8 inline-flex items-center px-5 py-2 bg-amber-50 text-amber-700 rounded-full text-[10px] font-black uppercase tracking-widest animate-pulse border border-amber-100 shadow-sm">
              <i className="fas fa-map-marked-alt mr-2 text-sm"></i> Deep Geographic Lookup Mode Active
            </div>
          )}
          
          <div className="relative mb-16 scale-125">
            <div className="w-32 h-32 border-[12px] border-gray-100 rounded-full"></div>
            <div className="w-32 h-32 border-[12px] border-blue-600 border-t-transparent rounded-full animate-spin absolute top-0 left-0 shadow-[0_0_20px_rgba(37,99,235,0.3)]"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-blue-700 font-black text-2xl">{Math.floor(progress)}%</span>
            </div>
          </div>
          
          <h4 className="text-4xl font-black text-gray-900 mb-6 tracking-tight">Auditing Jurisdictions...</h4>
          <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden mb-12 max-w-md shadow-inner">
            <div 
              className="h-full bg-blue-600 transition-all duration-700 rounded-full shadow-[0_0_15px_rgba(37,99,235,0.5)]" 
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          
          <div className="h-16 flex items-center justify-center">
            <p className="text-blue-600 font-bold text-2xl animate-in slide-in-from-bottom duration-500 italic">
              {STATUS_MESSAGES[statusIndex]}
            </p>
          </div>
          
          <p className="text-gray-400 text-sm mt-12 max-w-md font-medium leading-relaxed px-4">
            "Mapping your sales to the correct counties and identifying current 2024/2025 tax rates for every city."
          </p>
        </div>
      )}

      {error && (
        <div className="p-10 bg-rose-50 border-4 border-rose-100 text-rose-900 rounded-[2.5rem] flex items-start animate-in shake duration-500 shadow-2xl shadow-rose-100/50">
          <div className="w-16 h-16 bg-rose-600 text-white rounded-2xl flex-shrink-0 flex items-center justify-center mr-8 shadow-xl shadow-rose-200">
            <i className="fas fa-triangle-exclamation text-2xl"></i>
          </div>
          <div className="flex-1">
            <p className="text-2xl font-black mb-2">Audit Exception</p>
            <p className="text-lg font-medium opacity-80 leading-relaxed">{error}</p>
            <button 
              onClick={() => setError(null)}
              className="mt-6 inline-flex items-center text-rose-700 font-black text-sm uppercase tracking-wider hover:underline"
            >
              Restart Process <i className="fas fa-arrow-right ml-2"></i>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImportData;
