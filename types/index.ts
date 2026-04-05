export interface Alert {
  id: string;
  name: string;
  metric: string;
  current_value: number;
  threshold: number;
  severity: "P1" | "P2" | "P3";
  status: "firing" | "resolved";
  fired_at: string;
  resolved_at?: string;
  runbook_id?: string;
}

export interface Runbook {
  id: string;
  alert_id: string;
  incident_title: string;
  root_cause: string;
  severity: "P1" | "P2" | "P3";
  severity_reason: string;
  estimated_impact: string;
  fix_steps: string[];
  prevention: string;
  estimated_resolution_time: string;
  runbook_confidence: "HIGH" | "MEDIUM" | "LOW";
  generated_at: string;
  generation_time_ms: number;
  ai_generated: boolean;
}

export interface MetricSnapshot {
  error_rate_percent: number;
  p99_latency_ms: number;
  cpu_usage_percent: number;
  memory_usage_percent: number;
  availability_percent: number;
  requests_per_second: number;
  active_connections: number;
  timestamp: string;
}

export interface TimelineEvent {
  id: string;
  timestamp: string;
  message: string;
}

export interface ServiceStatus {
  healthy: boolean;
  uptime_seconds: number;
  started_at: string;
  total_alerts_fired: number;
  total_runbooks_generated: number;
  ai_runbooks: number;
  fallback_runbooks: number;
  average_generation_time_ms: number;
  gemini_available: boolean;
  current_metrics: MetricSnapshot;
  timeline: TimelineEvent[];
  mttr_stats: {
    total_incidents_today: number;
    avg_detection_time_seconds: number;
    avg_runbook_generation_seconds: number;
    avg_mttr_seconds: number;
  };
}

export interface SimulateRequest {
  type: "high_latency" | "high_errors" | "cpu_spike" | 
        "memory_leak" | "availability_drop" | "traffic_surge";
  intensity: "mild" | "moderate" | "severe";
}
