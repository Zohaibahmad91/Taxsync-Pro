
import React, { useState, useMemo } from 'react';

const US_STATES = [
  "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut", 
  "Delaware", "District of Columbia", "Florida", "Georgia", "Hawaii", "Idaho", "Illinois", 
  "Indiana", "Iowa", "Kansas", "Kentucky", "Louisiana", "Maine", "Maryland", "Massachusetts", 
  "Michigan", "Minnesota", "Mississippi", "Missouri", "Montana", "Nebraska", "Nevada", 
  "New Hampshire", "New Jersey", "New Mexico", "New York", "North Carolina", "North Dakota", 
  "Ohio", "Oklahoma", "Oregon", "Pennsylvania", "Rhode Island", "South Carolina", 
  "South Dakota", "Tennessee", "Texas", "Utah", "Vermont", "Virginia", "Washington", 
  "West Virginia", "Wisconsin", "Wyoming"
];

const Settings: React.FC = () => {
  const [search, setSearch] = useState('');
  const [activeNexus, setActiveNexus] = useState<Set<string>>(new Set(["California", "Texas", "New York"]));

  const toggleNexus = (state: string) => {
    const newSet = new Set(activeNexus);
    if (newSet.has(state)) newSet.delete(state);
    else newSet.add(state);
    setActiveNexus(newSet);
  };

  const activateAll = () => {
    setActiveNexus(new Set(US_STATES));
  };

  const deactivateAll = () => {
    setActiveNexus(new Set());
  };

  const filteredStates = useMemo(() => {
    return US_STATES.filter(state => state.toLowerCase().includes(search.toLowerCase()));
  }, [search]);

  const activeCount = activeNexus.size;

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500 pb-12">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Compliance & Nexus</h2>
          <p className="text-gray-500 mt-1">Manage jurisdictions where you have tax collection obligations.</p>
        </div>
        <div className="bg-blue-600 text-white px-4 py-2 rounded-full text-sm font-bold shadow-sm">
          {activeCount} Jurisdictions Active
        </div>
      </div>
      
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-8 border-b border-gray-100">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex-1">
              <h3 className="text-xl font-bold text-gray-900 mb-1">State Nexus Jurisdictions</h3>
              <p className="text-sm text-gray-500 mb-4">Enable states where you meet physical or economic nexus thresholds.</p>
              
              <div className="flex items-center space-x-3 mt-2">
                <button 
                  onClick={activateAll}
                  className="px-4 py-2 bg-blue-50 text-blue-700 text-xs font-bold rounded-lg hover:bg-blue-100 transition border border-blue-100"
                >
                  <i className="fas fa-check-double mr-2"></i> Activate All States
                </button>
                <button 
                  onClick={deactivateAll}
                  className="px-4 py-2 bg-gray-50 text-gray-600 text-xs font-bold rounded-lg hover:bg-gray-100 transition border border-gray-200"
                >
                  <i className="fas fa-times mr-2"></i> Deactivate All
                </button>
              </div>
            </div>
            
            <div className="relative w-full md:w-72">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <i className="fas fa-search text-gray-400"></i>
              </span>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl bg-gray-50 text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                placeholder="Search states..."
              />
            </div>
          </div>
        </div>

        <div className="p-8 bg-gray-50/50">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 h-[500px] overflow-y-auto pr-2 custom-scrollbar">
            {filteredStates.map((state) => (
              <NexusItem 
                key={state} 
                state={state} 
                active={activeNexus.has(state)} 
                type={activeNexus.has(state) ? (state === "California" ? "Physical" : "Economic") : "None"} 
                onToggle={() => toggleNexus(state)}
              />
            ))}
            {filteredStates.length === 0 && (
              <div className="col-span-full py-20 text-center">
                <i className="fas fa-map-marked-alt text-4xl text-gray-300 mb-4"></i>
                <p className="text-gray-500 font-medium">No jurisdictions found matching "{search}"</p>
              </div>
            )}
          </div>
        </div>

        <div className="p-8 border-t border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Tax Calculation Configuration</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2 tracking-wider">Nexus Sourcing Rule</label>
                <select className="w-full bg-white border border-gray-200 rounded-xl p-3 text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none">
                  <option>Destination-based (Standard)</option>
                  <option>Origin-based (OH, TX, PA, etc.)</option>
                  <option>Hybrid Sourcing</option>
                </select>
                <p className="text-[11px] text-gray-400 mt-2">Most economic nexus states use destination-based sourcing.</p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2 tracking-wider">Default Filing Frequency</label>
                <select className="w-full bg-white border border-gray-200 rounded-xl p-3 text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none">
                  <option>Monthly (Default)</option>
                  <option>Quarterly</option>
                  <option>Annually</option>
                </select>
                <p className="text-[11px] text-gray-400 mt-2">Frequency is usually determined by your estimated tax liability.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-8 bg-slate-900 flex flex-col md:flex-row items-center justify-between text-white">
          <div className="flex items-center space-x-3 mb-4 md:mb-0">
            <i className="fas fa-shield-check text-blue-400 text-xl"></i>
            <p className="text-sm font-medium opacity-80">Settings are synced with your Shopify and Amazon ERP integrations.</p>
          </div>
          <button className="w-full md:w-auto bg-blue-600 text-white px-10 py-3 rounded-xl font-bold hover:bg-blue-500 transition shadow-lg shadow-blue-900/20 active:scale-95 transform">
            Update Compliance Policy
          </button>
        </div>
      </div>
      
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #d1d5db;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #9ca3af;
        }
      `}</style>
    </div>
  );
};

interface NexusItemProps {
  state: string;
  active: boolean;
  type: string;
  onToggle: () => void;
}

const NexusItem: React.FC<NexusItemProps> = ({ state, active, type, onToggle }) => (
  <div 
    onClick={onToggle}
    className={`flex items-center justify-between p-4 bg-white rounded-2xl border transition-all cursor-pointer group ${
      active 
        ? 'border-blue-200 bg-blue-50/20 ring-1 ring-blue-100' 
        : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
    }`}
  >
    <div className="flex items-center space-x-3 overflow-hidden">
      <div className={`w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center transition-colors ${
        active ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-400 group-hover:bg-gray-200'
      }`}>
        <i className="fas fa-map-marker-alt text-sm"></i>
      </div>
      <div className="overflow-hidden">
        <p className="font-bold text-gray-900 text-sm truncate">{state}</p>
        <p className={`text-[10px] font-bold uppercase tracking-wider ${active ? 'text-blue-500' : 'text-gray-400'}`}>
          {active ? `${type} Nexus` : 'No Nexus'}
        </p>
      </div>
    </div>
    <div className="flex items-center ml-2">
      <div className={`w-10 h-6 rounded-full relative transition-colors ${active ? 'bg-blue-600' : 'bg-gray-300'}`}>
        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${active ? 'translate-x-5' : 'translate-x-1'}`}></div>
      </div>
    </div>
  </div>
);

export default Settings;
