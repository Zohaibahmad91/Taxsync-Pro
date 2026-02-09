
import React, { useState, useEffect } from 'react';
import { processSalesData, MOCK_SALES_CSV } from '../services/geminiService';
import { TaxReport } from '../types';

interface ImportDataProps {
  onReportGenerated: (report: TaxReport) => void;
}

const STATUS_MESSAGES = [
  "Initializing high-speed sync engine...",
  "Analyzing report headers...",
  "Identifying tax jurisdictions...",
  "Inferring counties from cities...",
  "Retrieving official jurisdiction codes...",
  "Aggregating sales totals...",
  "Finalizing tax liability calculations...",
  "Generating audit-ready report..."
];

const ImportData: React.FC<ImportDataProps> = ({ onReportGenerated }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [statusIndex, setStatusIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let interval: any;
    if (isProcessing) {
      interval = setInterval(() => {
        setStatusIndex(prev => (prev + 1) % STATUS_MESSAGES.length);
        setProgress(prev => Math.min(prev + (100 / (40 * 2)), 95)); // Simulate progress up to 95% over ~40s
      }, 3000);
    } else {
      setProgress(0);
      setStatusIndex(0);
    }
    return () => clearInterval(interval);
  }, [isProcessing]);

  const downloadTemplate = () => {
    const headers = "Shipping region,Shipping city,Zip,Taxes,Net sales,Order ID,Date\n";
    const sampleRow = "California,Los Angeles,90001,8.50,100.00,ORD-1001,2023-10-01\n";
    const blob = new Blob([headers + sampleRow], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'TaxSync_Pro_Template.csv';
    link.click();
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64String = (reader.result as string).split(',')[1];
        resolve(base64String);
      };
      reader.onerror = error => reject(error);
    });
  };

  const cleanCsvText = (text: string): string => {
    return text
      .split('\n')
      .filter(line => {
        const trimmed = line.trim();
        if (!trimmed || /^,+$/.test(trimmed)) return false;
        if (trimmed.toLowerCase().includes('total') && trimmed.split(',').length < 3) return false;
        return true;
      })
      .join('\n');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setIsProcessing(true);
    setError(null);
    setProgress(5);
    
    try {
      let content: string;
      let mimeType: string = file.type || 'application/octet-stream';

      if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
        const rawText = await file.text();
        content = cleanCsvText(rawText);
        mimeType = 'text/plain';
      } else if (file.type === 'text/plain') {
        content = await file.text();
        mimeType = 'text/plain';
      } else {
        content = await fileToBase64(file);
      }

      const report = await processSalesData(content, mimeType);
      setProgress(100);
      setTimeout(() => onReportGenerated(report), 500);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "High-speed processing failed. Please check your data format.");
    } finally {
      setIsProcessing(false);
    }
  };

  const simulateShopifyConnect = async () => {
    setIsProcessing(true);
    setError(null);
    setFileName("Shopify API Sync");
    setProgress(10);
    
    try {
      // Small artificial delay for visual feedback of "connecting"
      await new Promise(resolve => setTimeout(resolve, 1500));
      const report = await processSalesData(MOCK_SALES_CSV, 'text/plain');
      setProgress(100);
      setTimeout(() => onReportGenerated(report), 500);
    } catch (err) {
      setError("Could not connect to Shopify. Check your API credentials.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in slide-in-from-bottom duration-500 pb-20">
      <div className="text-center">
        <h2 className="text-4xl font-extrabold text-gray-900 tracking-tight">Import Sales Data</h2>
        <p className="text-gray-500 mt-3 text-lg">Sync any report format in 30-60 seconds using our High-Speed AI Engine.</p>
        <button 
          onClick={downloadTemplate}
          className="mt-6 inline-flex items-center text-blue-600 hover:text-blue-700 font-bold transition-all group"
        >
          <i className="fas fa-download mr-2 group-hover:translate-y-0.5 transition-transform"></i>
          Download CSV Template for Faster Processing
        </button>
      </div>

      {!isProcessing ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white p-10 rounded-3xl shadow-sm border border-gray-100 flex flex-col items-center text-center transition-all hover:shadow-xl hover:border-blue-100">
            <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-8 rotate-3 transition-transform hover:rotate-0">
              <i className="fas fa-file-invoice text-3xl"></i>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">Upload Large Files</h3>
            <p className="text-gray-500 text-sm mb-8 leading-relaxed px-4">
              Upload <strong>CSV, PDF, or Excel</strong>. Our AI handles automatic county mapping and jurisdiction code lookups instantly.
            </p>
            <label className="w-full">
              <input 
                type="file" 
                className="hidden" 
                accept=".csv,.xlsx,.xls,.pdf,image/*" 
                onChange={handleFileUpload}
              />
              <div className="cursor-pointer px-8 py-10 border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50 hover:bg-white hover:border-blue-400 hover:shadow-inner transition-all flex flex-col items-center justify-center">
                <i className="fas fa-cloud-upload-alt mb-3 text-3xl text-gray-400"></i>
                <span className="font-bold text-gray-800">Drag & Drop or Browse</span>
                <span className="text-[11px] text-gray-400 mt-2 uppercase tracking-widest font-bold">Max 50MB per file</span>
              </div>
            </label>
            {fileName && <p className="mt-4 text-sm text-blue-600 font-bold bg-blue-50 px-3 py-1 rounded-full">{fileName}</p>}
          </div>

          <div className="bg-white p-10 rounded-3xl shadow-sm border border-gray-100 flex flex-col items-center text-center transition-all hover:shadow-xl hover:border-green-100">
            <div className="w-20 h-20 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center mb-8 -rotate-3 transition-transform hover:rotate-0">
              <i className="fab fa-shopify text-3xl"></i>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">Direct ERP Sync</h3>
            <p className="text-gray-500 text-sm mb-8 leading-relaxed px-4">
              Pull data directly from <strong>Shopify, Amazon, or Netsuite</strong>. Synchronize thousands of transactions in under a minute.
            </p>
            <button 
              onClick={simulateShopifyConnect}
              className="w-full bg-slate-900 text-white font-bold py-4 rounded-2xl hover:bg-slate-800 transition-all flex items-center justify-center shadow-lg hover:shadow-slate-200 active:scale-95 transform"
            >
              <i className="fab fa-shopify mr-3 text-xl"></i>
              Connect Shopify Store
            </button>
            <p className="mt-6 text-[11px] text-gray-400 font-medium">Auto-syncs every 24 hours once connected</p>
          </div>
        </div>
      ) : (
        <div className="bg-white p-12 md:p-20 rounded-[40px] shadow-2xl border border-blue-50 flex flex-col items-center text-center animate-in zoom-in duration-500 max-w-3xl mx-auto">
          <div className="relative mb-12">
            <div className="w-24 h-24 border-8 border-blue-50 rounded-full"></div>
            <div className="w-24 h-24 border-8 border-blue-600 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-blue-600 font-bold text-lg">{Math.floor(progress)}%</span>
            </div>
          </div>
          
          <h4 className="text-3xl font-black text-gray-900 mb-4">Syncing Tax Data...</h4>
          <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden mb-8 max-w-md">
            <div 
              className="h-full bg-blue-600 transition-all duration-500 rounded-full" 
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          
          <div className="h-12 overflow-hidden">
            <p className="text-blue-600 font-bold text-lg animate-in slide-in-from-bottom duration-300">
              {STATUS_MESSAGES[statusIndex]}
            </p>
          </div>
          
          <p className="text-gray-400 text-sm mt-6 max-w-md">
            Our high-speed engine is processing large volumes of data. This typically takes 30-60 seconds for 10k+ rows.
          </p>
        </div>
      )}

      {error && (
        <div className="p-6 bg-rose-50 border-2 border-rose-100 text-rose-900 rounded-3xl flex items-start animate-in shake duration-500 shadow-lg shadow-rose-100">
          <div className="w-12 h-12 bg-rose-600 text-white rounded-xl flex-shrink-0 flex items-center justify-center mr-6 shadow-lg shadow-rose-200">
            <i className="fas fa-exclamation-triangle text-xl"></i>
          </div>
          <div className="flex-1">
            <p className="text-xl font-black mb-1">Upload Error</p>
            <p className="text-sm font-medium opacity-90">{error}</p>
            <button 
              onClick={() => setError(null)}
              className="mt-3 text-rose-700 font-bold text-sm hover:underline"
            >
              Try again with another file
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImportData;
