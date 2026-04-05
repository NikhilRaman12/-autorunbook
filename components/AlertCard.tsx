import React from 'react';
import { Alert } from '@/types';
import { StatusBadge } from './StatusBadge';
import { formatDistanceToNow } from 'date-fns';
import { CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';

interface AlertCardProps {
  alert: Alert;
  onResolve: (id: string) => void;
  onViewRunbook: (id: string) => void;
  isSelected?: boolean;
}

export function AlertCard({ alert, onResolve, onViewRunbook, isSelected = false }: AlertCardProps) {
  const isResolved = alert.status === "resolved";

  return (
    <div className={`p-4 rounded-lg border ${isResolved ? 'bg-zinc-900/50 border-zinc-800' : 'bg-red-950/20 border-red-900/50'} ${isSelected ? 'ring-2 ring-blue-500' : ''} flex flex-col gap-3 transition-colors`}>
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-3">
          {isResolved ? (
            <CheckCircle2 className="w-5 h-5 text-green-500" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-500" />
          )}
          <div>
            <h3 className="font-semibold text-zinc-100">{alert.name}</h3>
            <p className="text-xs text-zinc-400">
              {alert.metric} crossed {alert.threshold} (Current: {alert.current_value.toFixed(2)})
            </p>
          </div>
        </div>
        <StatusBadge severity={alert.severity} />
      </div>

      <div className="flex justify-between items-center mt-2">
        <div className="text-xs text-zinc-500">
          {isResolved ? (
            <span>Resolved {formatDistanceToNow(new Date(alert.resolved_at!), { addSuffix: true })}</span>
          ) : (
            <span>Fired {formatDistanceToNow(new Date(alert.fired_at), { addSuffix: true })}</span>
          )}
        </div>
        
        <div className="flex gap-2">
          {alert.runbook_id && (
            <button 
              onClick={() => onViewRunbook(alert.runbook_id!)}
              className="px-3 py-1 text-xs font-medium bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 rounded-md transition-colors flex items-center gap-1"
            >
              Runbook <ArrowRight className="w-3 h-3" />
            </button>
          )}
          {!isResolved && (
            <button 
              onClick={() => onResolve(alert.id)}
              className="px-3 py-1 text-xs font-medium bg-zinc-800 text-zinc-300 hover:bg-zinc-700 rounded-md transition-colors"
            >
              Resolve
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
