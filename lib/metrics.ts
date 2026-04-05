import client from 'prom-client';
import { store } from './store';

const register = new client.Registry();

client.collectDefaultMetrics({ register });

export const http_requests_total = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
});
register.registerMetric(http_requests_total);

export const alerts_fired_total = new client.Counter({
  name: 'alerts_fired_total',
  help: 'Total number of alerts fired',
  labelNames: ['severity', 'metric_name'],
});
register.registerMetric(alerts_fired_total);

export const runbooks_generated_total = new client.Counter({
  name: 'runbooks_generated_total',
  help: 'Total number of runbooks generated',
  labelNames: ['severity', 'ai_generated'],
});
register.registerMetric(runbooks_generated_total);

export const incidents_resolved_total = new client.Counter({
  name: 'incidents_resolved_total',
  help: 'Total number of incidents resolved',
});
register.registerMetric(incidents_resolved_total);

export const error_rate_percent = new client.Gauge({
  name: 'error_rate_percent',
  help: 'Current error rate percentage',
});
register.registerMetric(error_rate_percent);

export const p99_latency_ms = new client.Gauge({
  name: 'p99_latency_ms',
  help: 'Current p99 latency in ms',
});
register.registerMetric(p99_latency_ms);

export const cpu_usage_percent = new client.Gauge({
  name: 'cpu_usage_percent',
  help: 'Current CPU usage percentage',
});
register.registerMetric(cpu_usage_percent);

export const memory_usage_percent = new client.Gauge({
  name: 'memory_usage_percent',
  help: 'Current memory usage percentage',
});
register.registerMetric(memory_usage_percent);

export const availability_percent = new client.Gauge({
  name: 'availability_percent',
  help: 'Current availability percentage',
});
register.registerMetric(availability_percent);

export const requests_per_second = new client.Gauge({
  name: 'requests_per_second',
  help: 'Current requests per second',
});
register.registerMetric(requests_per_second);

export const active_alerts = new client.Gauge({
  name: 'active_alerts',
  help: 'Number of currently active alerts',
  labelNames: ['severity'],
});
register.registerMetric(active_alerts);

export const service_uptime_seconds = new client.Gauge({
  name: 'service_uptime_seconds',
  help: 'Service uptime in seconds',
});
register.registerMetric(service_uptime_seconds);

export const runbook_generation_duration_ms = new client.Histogram({
  name: 'runbook_generation_duration_ms',
  help: 'Duration of runbook generation in ms',
  buckets: [500, 1000, 2000, 3000, 5000],
});
register.registerMetric(runbook_generation_duration_ms);

export const http_request_duration_ms = new client.Histogram({
  name: 'http_request_duration_ms',
  help: 'Duration of HTTP requests in ms',
  buckets: [50, 100, 200, 500, 1000, 2000],
});
register.registerMetric(http_request_duration_ms);

export async function getMetricsOutput(): Promise<string> {
  return await register.metrics();
}

export function syncFromStore(): void {
  const status = store.getStatus();
  const metrics = status.current_metrics;

  error_rate_percent.set(metrics.error_rate_percent);
  p99_latency_ms.set(metrics.p99_latency_ms);
  cpu_usage_percent.set(metrics.cpu_usage_percent);
  memory_usage_percent.set(metrics.memory_usage_percent);
  availability_percent.set(metrics.availability_percent);
  requests_per_second.set(metrics.requests_per_second);
  
  service_uptime_seconds.set(status.uptime_seconds);

  const active = store.getActiveAlerts();
  const p1Count = active.filter(a => a.severity === 'P1').length;
  const p2Count = active.filter(a => a.severity === 'P2').length;
  const p3Count = active.filter(a => a.severity === 'P3').length;

  active_alerts.set({ severity: 'P1' }, p1Count);
  active_alerts.set({ severity: 'P2' }, p2Count);
  active_alerts.set({ severity: 'P3' }, p3Count);
}

// Start sync interval
if (typeof setInterval !== 'undefined') {
  setInterval(syncFromStore, 10000);
}
