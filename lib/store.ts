import { v4 as uuidv4 } from 'uuid';
import { Alert, Runbook, MetricSnapshot, ServiceStatus, TimelineEvent } from '../types';

class Store {
  private alerts: Map<string, Alert> = new Map();
  private runbooks: Map<string, Runbook> = new Map();
  private metrics: MetricSnapshot;
  private started_at: Date;

  private total_alerts_fired = 0;
  private total_runbooks_generated = 0;
  private ai_runbooks = 0;
  private fallback_runbooks = 0;
  private total_generation_time_ms = 0;

  private timeline: TimelineEvent[] = [];
  private resolved_incidents_count = 0;
  private total_mttr_seconds = 0;

  constructor() {
    this.started_at = new Date();
    this.metrics = this.getBaselineMetrics();
  }

  private getBaselineMetrics(): MetricSnapshot {
    return {
      error_rate_percent: 0.5,
      p99_latency_ms: 45,
      cpu_usage_percent: 22,
      memory_usage_percent: 35,
      availability_percent: 99.98,
      requests_per_second: 120,
      active_connections: 45,
      timestamp: new Date().toISOString(),
    };
  }

  addTimelineEvent(message: string) {
    this.timeline.unshift({
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      message
    });
    if (this.timeline.length > 50) {
      this.timeline.pop();
    }
  }

  addAlert(alert: Alert): void {
    this.alerts.set(alert.id, alert);
    this.total_alerts_fired++;
    this.addTimelineEvent(`ALERT FIRED — ${alert.name} (${alert.severity})`);
    this.addTimelineEvent(`ARIA generating runbook...`);
  }

  resolveAlert(id: string): void {
    const alert = this.alerts.get(id);
    if (alert && alert.status === "firing") {
      alert.status = "resolved";
      alert.resolved_at = new Date().toISOString();
      this.alerts.set(id, alert);
      
      const resolveTime = new Date(alert.resolved_at).getTime();
      const firedTime = new Date(alert.fired_at).getTime();
      const mttr = Math.floor((resolveTime - firedTime) / 1000);
      
      this.resolved_incidents_count++;
      this.total_mttr_seconds += mttr;
      
      this.addTimelineEvent(`INCIDENT RESOLVED — MTTR: ${mttr}s`);
    }
  }

  addRunbook(runbook: Runbook): void {
    this.runbooks.set(runbook.id, runbook);
    this.total_runbooks_generated++;
    if (runbook.ai_generated) {
      this.ai_runbooks++;
    } else {
      this.fallback_runbooks++;
    }
    this.total_generation_time_ms += runbook.generation_time_ms;
    
    this.addTimelineEvent(`RUNBOOK READY — Generated in ${(runbook.generation_time_ms / 1000).toFixed(1)}s`);
  }

  getAlert(id: string): Alert | undefined {
    return this.alerts.get(id);
  }

  getRunbook(id: string): Runbook | undefined {
    return this.runbooks.get(id);
  }

  getAllAlerts(): Alert[] {
    return Array.from(this.alerts.values()).sort((a, b) => new Date(b.fired_at).getTime() - new Date(a.fired_at).getTime());
  }

  getAllRunbooks(): Runbook[] {
    return Array.from(this.runbooks.values()).sort((a, b) => new Date(b.generated_at).getTime() - new Date(a.generated_at).getTime());
  }

  getActiveAlerts(): Alert[] {
    return Array.from(this.alerts.values()).filter(a => a.status === "firing");
  }

  updateMetrics(snapshot: Partial<MetricSnapshot>): void {
    this.metrics = {
      ...this.metrics,
      ...snapshot,
      timestamp: new Date().toISOString(),
    };
  }

  getStatus(): ServiceStatus {
    const uptime_seconds = Math.floor((new Date().getTime() - this.started_at.getTime()) / 1000);
    const average_generation_time_ms = this.total_runbooks_generated > 0 
      ? Math.floor(this.total_generation_time_ms / this.total_runbooks_generated) 
      : 0;

    const avg_mttr_seconds = this.resolved_incidents_count > 0 
      ? Math.floor(this.total_mttr_seconds / this.resolved_incidents_count) 
      : 0;

    return {
      healthy: true,
      uptime_seconds,
      started_at: this.started_at.toISOString(),
      total_alerts_fired: this.total_alerts_fired,
      total_runbooks_generated: this.total_runbooks_generated,
      ai_runbooks: this.ai_runbooks,
      fallback_runbooks: this.fallback_runbooks,
      average_generation_time_ms,
      gemini_available: !!(
        (process.env.NEXT_PUBLIC_GEMINI_API_KEY && process.env.NEXT_PUBLIC_GEMINI_API_KEY !== "MY_GEMINI_API_KEY" && process.env.NEXT_PUBLIC_GEMINI_API_KEY !== "undefined") || 
        (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== "MY_GEMINI_API_KEY" && process.env.GEMINI_API_KEY !== "undefined") ||
        (process.env.Gemini_API_Key && process.env.Gemini_API_Key !== "Gemini_Api_Key" && process.env.Gemini_API_Key !== "undefined")
      ),
      current_metrics: this.metrics,
      timeline: this.timeline,
      mttr_stats: {
        total_incidents_today: this.total_alerts_fired,
        avg_detection_time_seconds: 2,
        avg_runbook_generation_seconds: Number((average_generation_time_ms / 1000).toFixed(1)),
        avg_mttr_seconds
      }
    };
  }

  resetMetricsToNormal(): void {
    const baseline = this.getBaselineMetrics();
    this.metrics = baseline;
    this.addTimelineEvent(`SYSTEM STABILIZED — Metrics reset to baseline`);
    console.log('[STORE] Metrics reset to baseline:', baseline);
  }
}

export const store = new Store();
