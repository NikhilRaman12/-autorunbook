'use client';

import React, { useEffect, useState } from 'react';
import { MetricsBar } from '@/components/MetricsBar';
import { SimulatePanel } from '@/components/SimulatePanel';
import { AlertCard } from '@/components/AlertCard';
import { RunbookCard } from '@/components/RunbookCard';
import { Alert, Runbook, ServiceStatus } from '@/types';
import { Activity, ShieldAlert, BookOpen, Server, CheckCircle2, XCircle, Loader2 } from 'lucide-react';

export default function Dashboard() {
  const [status, setStatus] = useState<ServiceStatus | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [runbooks, setRunbooks] = useState<Runbook[]>([]);
  const [selectedRunbookId, setSelectedRunbookId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const refreshData = async () => {
    setIsLoading(true);
    try {
      const [statusRes, alertsRes, runbooksRes] = await Promise.all([
        fetch('/api/status'),
        fetch('/api/alerts'),
        fetch('/api/runbooks')
      ]);

      if (statusRes.ok && statusRes.headers.get('content-type')?.includes('application/json')) {
        const data = await statusRes.json();
        setStatus(data.data);
      }
      if (alertsRes.ok && alertsRes.headers.get('content-type')?.includes('application/json')) {
        const data = await alertsRes.json();
        setAlerts(data.data);
      }
      if (runbooksRes.ok && runbooksRes.headers.get('content-type')?.includes('application/json')) {
        const data = await runbooksRes.json();
        setRunbooks(data.data);
      }
    } catch (error) {
      // Silently ignore fetch errors during rebuilds/cold starts
      // console.error('Failed to fetch dashboard data', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    
    const poll = async () => {
      if (mounted) await refreshData();
    };
    
    poll();
    const interval = setInterval(poll, 2000);
    
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  const handleSimulate = async (type: string, intensity: string) => {
    setToast("P1 Alert fired — ARIA generating runbook...");
    try {
      const res = await fetch('/api/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, intensity })
      });
      
      if (!res.ok) return;
      const contentType = res.headers.get('content-type');
      if (!contentType?.includes('application/json')) return;
      
      const data = await res.json();
      
      // Fetch data immediately after simulation completes
      await refreshData();
      
      if (data.runbooks && data.runbooks.length > 0) {
        setSelectedRunbookId(data.runbooks[0].id);
      }
    } catch (error) {
      // Silently ignore fetch errors
    } finally {
      setTimeout(() => setToast(null), 5000);
    }
  };

  const handleResolveAll = async () => {
    try {
      const res = await fetch('/api/resolve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      
      if (!res.ok) return;
      const contentType = res.headers.get('content-type');
      if (!contentType?.includes('application/json')) return;
      
      setSelectedRunbookId(null);
      await refreshData();
    } catch (error) {
      // Silently ignore fetch errors
    }
  };

  const handleResolveAlert = async (id: string) => {
    try {
      const res = await fetch('/api/resolve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alert_id: id })
      });
      
      if (!res.ok) return;
      const contentType = res.headers.get('content-type');
      if (!contentType?.includes('application/json')) return;
      
      await refreshData();
    } catch (error) {
      // Silently ignore fetch errors
    }
  };

  if (!status) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="flex items-center gap-3 text-zinc-400">
          <Activity className="w-6 h-6 animate-pulse" />
          <span>Initializing AutoRunbook...</span>
        </div>
      </div>
    );
  }

  const activeAlerts = alerts.filter(a => a.status === 'firing');
  const resolvedAlerts = alerts.filter(a => a.status === 'resolved');
  const selectedRunbook = selectedRunbookId ? runbooks.find(r => r.id === selectedRunbookId) : null;

  return (
    <div className="min-h-screen bg-black text-zinc-100 font-sans selection:bg-blue-500/30">
      <header className="border-b border-zinc-800 bg-zinc-950 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold tracking-tight">AutoRunbook</h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 uppercase tracking-wider">
              Production
            </span>
            {isLoading && (
              <Loader2 className="w-4 h-4 text-zinc-500 animate-spin ml-2" />
            )}
          </div>
          
          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <Server className="w-4 h-4 text-zinc-500" />
              <span className="text-zinc-400">Uptime: {status.uptime_seconds}s</span>
            </div>
            <div className="flex items-center gap-2">
              {status.gemini_available ? (
                <CheckCircle2 className="w-4 h-4 text-green-500" />
              ) : (
                <XCircle className="w-4 h-4 text-red-500" />
              )}
              <span className={status.gemini_available ? "text-green-400" : "text-red-400"}>
                Gemini AI {status.gemini_available ? "Online" : "Offline"}
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <MetricsBar metrics={status.current_metrics} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-6">
            <SimulatePanel onSimulate={handleSimulate} onResolveAll={handleResolveAll} />

            <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden flex flex-col max-h-[600px]">
              <div className="p-4 border-b border-zinc-800 bg-zinc-900/50 flex items-center justify-between">
                <h2 className="font-bold text-zinc-100 flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-red-400" /> Active Alerts
                </h2>
                <span className="bg-red-500/10 text-red-400 px-2 py-0.5 rounded-full text-xs font-bold">
                  {activeAlerts.length}
                </span>
              </div>
              <div className="p-4 overflow-y-auto flex-1 space-y-3">
                {activeAlerts.length === 0 ? (
                  <div className="text-center py-8 text-zinc-500 text-sm">
                    No active alerts. System is healthy.
                  </div>
                ) : (
                  activeAlerts.map(alert => (
                    <AlertCard 
                      key={alert.id} 
                      alert={alert} 
                      onResolve={handleResolveAlert}
                      onViewRunbook={setSelectedRunbookId}
                    />
                  ))
                )}
              </div>
            </div>

            {resolvedAlerts.length > 0 && (
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden flex flex-col max-h-[400px]">
                <div className="p-4 border-b border-zinc-800 bg-zinc-900/50 flex items-center justify-between">
                  <h2 className="font-bold text-zinc-100 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-zinc-400" /> Recent History
                  </h2>
                </div>
                <div className="p-4 overflow-y-auto flex-1 space-y-3 opacity-70">
                  {resolvedAlerts.slice(0, 5).map(alert => (
                    <AlertCard 
                      key={alert.id} 
                      alert={alert} 
                      onResolve={handleResolveAlert}
                      onViewRunbook={setSelectedRunbookId}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="lg:col-span-2">
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl min-h-[600px] flex flex-col">
              <div className="p-4 border-b border-zinc-800 bg-zinc-900/50 flex items-center justify-between">
                <h2 className="font-bold text-zinc-100 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-blue-400" /> 
                  {selectedRunbook ? 'Active Runbook' : 'Runbook Viewer'}
                </h2>
                <div className="text-xs text-zinc-500">
                  Total Generated: {status.total_runbooks_generated}
                </div>
              </div>
              <div className="p-6 flex-1 bg-zinc-950/50">
                {selectedRunbook ? (
                  <RunbookCard runbook={selectedRunbook} />
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-zinc-500 space-y-4">
                    <BookOpen className="w-16 h-16 opacity-20" />
                    <p>Select an alert to view its generated runbook.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
