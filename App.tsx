
import React, { useState, useEffect } from 'react';
import { ViewType, TaxReport } from './types';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import ReportView from './components/ReportView';
import ImportData from './components/ImportData';
import Settings from './components/Settings';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const [report, setReport] = useState<TaxReport | null>(null);

  // Initialize with some dummy report for visualization if empty
  useEffect(() => {
    const saved = localStorage.getItem('tax_report');
    if (saved) {
      setReport(JSON.parse(saved));
    }
  }, []);

  const handleReportGenerated = (newReport: TaxReport) => {
    setReport(newReport);
    localStorage.setItem('tax_report', JSON.stringify(newReport));
    setCurrentView('dashboard');
  };

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard report={report} onNavigate={() => setCurrentView('reports')} />;
      case 'reports':
        return <ReportView report={report} />;
      case 'import':
        return <ImportData onReportGenerated={handleReportGenerated} />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard report={report} onNavigate={() => setCurrentView('reports')} />;
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar activeView={currentView} onViewChange={setCurrentView} />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          {renderView()}
        </main>
      </div>
    </div>
  );
};

export default App;
