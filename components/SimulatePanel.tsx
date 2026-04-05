import React, { useState } from 'react';
import { AlertTriangle, RefreshCw, Loader2 } from 'lucide-react';

interface SimulatePanelProps {
  onSimulate: (type: string, intensity: string) => Promise<void>;
  onResolveAll: () => Promise<void>;
}

export function SimulatePanel({ onSimulate, onResolveAll }: SimulatePanelProps) {
  const [loadingType, setLoadingType] = useState<string | null>(null);
  const [resolving, setResolving] = useState(false);

  const handleSimulate = async (type: string, intensity: string) => {
    setLoadingType(type);
    await onSimulate(type, intensity);
    setLoadingType(null);
  };

  const handleResolveAll = async () => {
    setResolving(true);
    await onResolveAll();
    setResolving(false);
  };

  const renderButton = (type: string, intensity: string, title: string, desc: string) => {
    const isLoading = loadingType === type;
    return (
      <button 
        onClick={() => handleSimulate(type, intensity)}
        disabled={loadingType !== null || resolving}
        className="p-3 text-left bg-black/20 hover:bg-zinc-800 border border-zinc-800 rounded-lg transition-colors disabled:opacity-50 relative overflow-hidden"
      >
        {isLoading ? (
          <div className="absolute inset-0 bg-blue-500/20 flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
            <span className="text-blue-400 font-bold text-xs uppercase tracking-wider">Generating...</span>
          </div>
        ) : (
          <>
            <div className="text-sm font-semibold text-zinc-200">{title}</div>
            <div className="text-xs text-zinc-500">{desc}</div>
          </>
        )}
      </button>
    );
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 relative overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-orange-500" /> Chaos Engineering
        </h2>
        <button 
          onClick={handleResolveAll}
          disabled={loadingType !== null || resolving}
          className="px-3 py-1.5 text-xs font-medium bg-green-500/10 text-green-400 hover:bg-green-500/20 rounded-md transition-colors flex items-center gap-1 disabled:opacity-50"
        >
          <RefreshCw className={`w-3 h-3 ${resolving ? 'animate-spin' : ''}`} /> Resolve All
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {renderButton('high_latency', 'severe', 'API Latency Spike', 'Simulate database lock')}
        {renderButton('high_errors', 'severe', '500 Error Surge', 'Simulate downstream failure')}
        {renderButton('cpu_spike', 'severe', 'CPU Saturation', 'Simulate runaway process')}
        {renderButton('memory_leak', 'severe', 'Memory Leak', 'Simulate OOM risk')}
        {renderButton('availability_drop', 'severe', 'SLO Breach', 'Simulate network partition')}
        {renderButton('traffic_surge', 'moderate', 'Traffic Surge', 'Simulate viral event')}
      </div>
    </div>
  );
}
