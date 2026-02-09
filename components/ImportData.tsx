
import React, { useState } from 'react';
import { processSalesData, MOCK_SALES_CSV } from '../services/geminiService';
import { TaxReport } from '../types';

interface ImportDataProps {
  onReportGenerated: (report: TaxReport) => void;
}

const ImportData: React.FC<ImportDataProps> = ({ onReportGenerated }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

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
        // Remove empty lines or lines that are just commas (common at end of CSV exports)
        if (!trimmed || /^,+$/.test(trimmed)) return false;
        // Basic heuristic to remove 'Total' summary rows if they aren't the header
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
      onReportGenerated(report);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "AI was unable to extract data. The file might be too large or complex.");
    } finally {
      setIsProcessing(false);
    }
  };

  const simulateShopifyConnect = async () => {
    setIsProcessing(true);
    setError(null);
    setFileName("Shopify API Sync");
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    try {
      const report = await processSalesData(MOCK_SALES_CSV, 'text/plain');
      onReportGenerated(report);
    } catch (err) {
      setError("Could not connect to Shopify. Check your API credentials.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in slide-in-from-bottom duration-500">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900">Import Sales Data</h2>
        <p className="text-gray-500 mt-2">Upload any report format (CSV, Excel, PDF) from Shopify, Amazon, or custom systems.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-6">
            <i className="fas fa-file-invoice text-2xl"></i>
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">Upload Report</h3>
          <p className="text-gray-500 text-sm mb-6 leading-relaxed">
            Drag & drop any file. We support <strong>CSV, PDF, Excel</strong>, or even screenshots of sales summaries.
          </p>
          <label className="w-full">
            <input 
              type="file" 
              className="hidden" 
              accept=".csv,.xlsx,.xls,.pdf,image/*" 
              onChange={handleFileUpload}
              disabled={isProcessing}
            />
            <div className={`cursor-pointer px-6 py-4 border-2 border-dashed border-gray-300 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition flex flex-col items-center justify-center ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}>
              <i className="fas fa-cloud-upload-alt mb-2 text-2xl text-gray-400"></i>
              <span className="font-semibold text-gray-700">Choose Files</span>
              <span className="text-xs text-gray-400 mt-1">Maximum 50MB</span>
            </div>
          </label>
          {fileName && !isProcessing && <p className="mt-3 text-xs text-blue-600 font-medium italic">Ready to process: {fileName}</p>}
        </div>

        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-green-50 text-green-600 rounded-full flex items-center justify-center mb-6">
            <i className="fab fa-shopify text-2xl"></i>
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">Shopify Direct</h3>
          <p className="text-gray-500 text-sm mb-6 leading-relaxed">
            Link your store to automatically pull monthly sales reports and sync new jurisdictions.
          </p>
          <button 
            onClick={simulateShopifyConnect}
            disabled={isProcessing}
            className={`w-full bg-slate-900 text-white font-semibold py-3.5 rounded-xl hover:bg-slate-800 transition flex items-center justify-center shadow-md ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <i className="fab fa-shopify mr-2 text-lg"></i>
            Connect Shopify Store
          </button>
        </div>
      </div>

      {isProcessing && (
        <div className="flex flex-col items-center justify-center p-12 bg-white rounded-2xl border border-blue-100 shadow-xl animate-in zoom-in duration-300">
          <div className="relative mb-6">
            <div className="w-16 h-16 border-4 border-blue-100 rounded-full"></div>
            <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
          </div>
          <h4 className="text-xl font-bold text-gray-900">Crunching Your Tax Data</h4>
          <p className="text-gray-500 text-sm mt-2 max-w-sm text-center">
            Your file has a lot of entries! Gemini is currently aggregating these by jurisdiction to build your filing report.
          </p>
        </div>
      )}

      {error && (
        <div className="p-5 bg-red-50 border border-red-200 text-red-800 rounded-2xl flex items-start animate-in shake duration-500">
          <i className="fas fa-exclamation-triangle mt-1 mr-4 text-xl text-red-600"></i>
          <div>
            <p className="font-bold">Import Failed</p>
            <p className="text-sm opacity-90">{error}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImportData;
