import React from 'react';
import { MetricSnapshot } from '@/types';
import { Activity, Cpu, HardDrive, Globe, Zap, Users } from 'lucide-react';

interface MetricsBarProps {
  metrics: MetricSnapshot;
}

export function MetricsBar({ metrics }: MetricsBarProps) {
  const getStatusColor = (val: number, warn: number, crit: number, inverse = false) => {
    if (inverse) {
      if (val < crit) return "text-red-500";
      if (val < warn) return "text-yellow-500";
      return "text-green-500";
    }
    if (val > crit) return "text-red-500";
    if (val > warn) return "text-yellow-500";
    return "text-green-500";
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-6 gap-4 bg-zinc-900/50 p-4 rounded-xl border border-zinc-800">
      <div className="flex flex-col gap-1">
        <span className="text-xs text-zinc-500 flex items-center gap-1 uppercase tracking-wider font-semibold">
          <Activity className="w-3 h-3" /> Error Rate
        </span>
        <span className={`text-xl font-mono font-bold ${getStatusColor(metrics.error_rate_percent, 5, 10)}`}>
          {metrics.error_rate_percent.toFixed(2)}%
        </span>
      </div>
      
      <div className="flex flex-col gap-1">
        <span className="text-xs text-zinc-500 flex items-center gap-1 uppercase tracking-wider font-semibold">
          <Zap className="w-3 h-3" /> p99 Latency
        </span>
        <span className={`text-xl font-mono font-bold ${getStatusColor(metrics.p99_latency_ms, 500, 1000)}`}>
          {metrics.p99_latency_ms.toFixed(0)}ms
        </span>
      </div>

      <div className="flex flex-col gap-1">
        <span className="text-xs text-zinc-500 flex items-center gap-1 uppercase tracking-wider font-semibold">
          <Cpu className="w-3 h-3" /> CPU Usage
        </span>
        <span className={`text-xl font-mono font-bold ${getStatusColor(metrics.cpu_usage_percent, 80, 90)}`}>
          {metrics.cpu_usage_percent.toFixed(1)}%
        </span>
      </div>

      <div className="flex flex-col gap-1">
        <span className="text-xs text-zinc-500 flex items-center gap-1 uppercase tracking-wider font-semibold">
          <HardDrive className="w-3 h-3" /> Memory
        </span>
        <span className={`text-xl font-mono font-bold ${getStatusColor(metrics.memory_usage_percent, 75, 85)}`}>
          {metrics.memory_usage_percent.toFixed(1)}%
        </span>
      </div>

      <div className="flex flex-col gap-1">
        <span className="text-xs text-zinc-500 flex items-center gap-1 uppercase tracking-wider font-semibold">
          <Globe className="w-3 h-3" /> Availability
        </span>
        <span className={`text-xl font-mono font-bold ${getStatusColor(metrics.availability_percent, 99, 95, true)}`}>
          {metrics.availability_percent.toFixed(2)}%
        </span>
      </div>

      <div className="flex flex-col gap-1">
        <span className="text-xs text-zinc-500 flex items-center gap-1 uppercase tracking-wider font-semibold">
          <Users className="w-3 h-3" /> RPS
        </span>
        <span className="text-xl font-mono font-bold text-blue-400">
          {metrics.requests_per_second.toFixed(0)}
        </span>
      </div>
    </div>
  );
}
