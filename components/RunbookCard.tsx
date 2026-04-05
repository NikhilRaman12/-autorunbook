import React from 'react';
import { Runbook } from '@/types';
import { StatusBadge } from './StatusBadge';
import { Terminal, Clock, ShieldAlert, Zap, Bot, FileText } from 'lucide-react';

interface RunbookCardProps {
  runbook: Runbook;
}

export function RunbookCard({ runbook }: RunbookCardProps) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-2xl">
      <div className="p-5 border-b border-zinc-800 bg-zinc-900/50 flex justify-between items-start">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h2 className="text-xl font-bold text-zinc-100">{runbook.incident_title}</h2>
            <StatusBadge severity={runbook.severity} />
            {runbook.ai_generated ? (
              <span className="flex items-center gap-1 text-xs px-2 py-1 bg-purple-500/10 text-purple-400 rounded-md border border-purple-500/20">
                <Bot className="w-3 h-3" /> AI Generated
              </span>
            ) : (
              <span className="flex items-center gap-1 text-xs px-2 py-1 bg-zinc-800 text-zinc-400 rounded-md border border-zinc-700">
                <FileText className="w-3 h-3" /> Fallback
              </span>
            )}
          </div>
          <p className="text-sm text-zinc-400">{runbook.root_cause}</p>
        </div>
      </div>

      <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <div>
            <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Terminal className="w-4 h-4 text-blue-400" /> Action Plan
            </h3>
            <div className="space-y-2">
              {runbook.fix_steps.map((step, idx) => {
                const isImmediate = step.startsWith("IMMEDIATE:");
                const isVerify = step.startsWith("VERIFY:");
                const isMonitor = step.startsWith("MONITOR:");
                const isEscalate = step.startsWith("ESCALATE:");
                const isInvestigate = step.startsWith("INVESTIGATE:");
                
                let colorClass = "text-zinc-300";
                if (isImmediate) colorClass = "text-red-400 font-medium";
                if (isVerify) colorClass = "text-green-400";
                if (isMonitor) colorClass = "text-blue-400";
                if (isEscalate) colorClass = "text-orange-400";
                if (isInvestigate) colorClass = "text-purple-400";

                return (
                  <div key={idx} className="flex gap-3 bg-black/20 p-3 rounded-lg border border-zinc-800/50">
                    <span className="text-zinc-600 font-mono text-sm">{idx + 1}.</span>
                    <span className={`text-sm font-mono ${colorClass}`}>{step}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider mb-2 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-green-400" /> Prevention
            </h3>
            <p className="text-sm text-zinc-400 bg-black/20 p-3 rounded-lg border border-zinc-800/50">
              {runbook.prevention}
            </p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-black/20 p-4 rounded-lg border border-zinc-800/50">
            <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">Impact</h3>
            <p className="text-sm text-zinc-300">{runbook.estimated_impact}</p>
          </div>
          
          <div className="bg-black/20 p-4 rounded-lg border border-zinc-800/50">
            <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">Resolution Time</h3>
            <p className="text-sm text-zinc-300 flex items-center gap-2">
              <Clock className="w-4 h-4 text-zinc-400" /> {runbook.estimated_resolution_time}
            </p>
          </div>

          <div className="bg-black/20 p-4 rounded-lg border border-zinc-800/50">
            <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">Confidence</h3>
            <div className="flex items-center gap-2">
              <Zap className={`w-4 h-4 ${
                runbook.runbook_confidence === 'HIGH' ? 'text-green-500' : 
                runbook.runbook_confidence === 'MEDIUM' ? 'text-yellow-500' : 'text-red-500'
              }`} />
              <span className="text-sm font-medium text-zinc-300">{runbook.runbook_confidence}</span>
            </div>
          </div>

          <div className="text-xs text-zinc-600 flex justify-between">
            <span>Gen Time: {runbook.generation_time_ms}ms</span>
            <span>ID: {runbook.id.split('-')[0]}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
