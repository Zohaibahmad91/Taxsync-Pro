
import React from 'react';
import { ViewType } from '../types';

interface SidebarProps {
  activeView: ViewType;
  onViewChange: (view: ViewType) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeView, onViewChange }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: 'fa-chart-pie' },
    { id: 'reports', label: 'Sales Tax Reports', icon: 'fa-file-invoice-dollar' },
    { id: 'import', label: 'Import Data', icon: 'fa-file-import' },
    { id: 'settings', label: 'Settings', icon: 'fa-cog' },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-white flex-shrink-0 flex flex-col">
      <div className="p-6 flex items-center space-x-3 border-b border-slate-800">
        <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
          <i className="fas fa-sync-alt text-white"></i>
        </div>
        <span className="text-xl font-bold tracking-tight">TaxSync Pro</span>
      </div>
      
      <nav className="flex-1 mt-6 px-4">
        <ul className="space-y-2">
          {menuItems.map((item) => (
            <li key={item.id}>
              <button
                onClick={() => onViewChange(item.id as ViewType)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                  activeView === item.id 
                    ? 'bg-blue-600 text-white shadow-lg' 
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <i className={`fas ${item.icon} w-5`}></i>
                <span className="font-medium">{item.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <div className="p-6 border-t border-slate-800">
        <div className="bg-slate-800 p-4 rounded-xl">
          <p className="text-xs text-slate-400 mb-2 uppercase font-semibold">Current Plan</p>
          <p className="text-sm font-bold text-blue-400">Professional Plus</p>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
