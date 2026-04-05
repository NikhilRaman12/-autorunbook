import { v4 as uuidv4 } from 'uuid';
import { Alert, MetricSnapshot } from '../types';
import { store } from './store';

interface Rule {
  id: string;
  name: string;
  severity: "P1" | "P2" | "P3";
  metric: keyof MetricSnapshot;
  check: (value: number) => boolean;
  threshold: number;
}

class AlertEngine {
  private rules: Rule[] = [
    {
      id: "critical_error_rate",
      name: "Critical Error Rate Spike",
      severity: "P1",
      metric: "error_rate_percent",
      check: (v) => v > 10,
      threshold: 10,
    },
    {
      id: "high_error_rate",
      name: "Elevated Error Rate",
      severity: "P2",
      metric: "error_rate_percent",
      check: (v) => v > 5 && v <= 10,
      threshold: 5,
    },
    {
      id: "critical_latency",
      name: "Critical API Latency",
      severity: "P1",
      metric: "p99_latency_ms",
      check: (v) => v > 1000,
      threshold: 1000,
    },
    {
      id: "high_latency",
      name: "High API Latency",
      severity: "P2",
      metric: "p99_latency_ms",
      check: (v) => v > 500 && v <= 1000,
      threshold: 500,
    },
    {
      id: "cpu_critical",
      name: "CPU Saturation Critical",
      severity: "P1",
      metric: "cpu_usage_percent",
      check: (v) => v > 90,
      threshold: 90,
    },
    {
      id: "cpu_high",
      name: "High CPU Usage",
      severity: "P2",
      metric: "cpu_usage_percent",
      check: (v) => v > 80 && v <= 90,
      threshold: 80,
    },
    {
      id: "memory_high",
      name: "High Memory Usage",
      severity: "P2",
      metric: "memory_usage_percent",
      check: (v) => v > 85,
      threshold: 85,
    },
    {
      id: "availability_critical",
      name: "Availability SLO Breach",
      severity: "P1",
      metric: "availability_percent",
      check: (v) => v < 95,
      threshold: 95,
    },
    {
      id: "availability_degraded",
      name: "Availability Degraded",
      severity: "P2",
      metric: "availability_percent",
      check: (v) => v < 99 && v >= 95,
      threshold: 99,
    }
  ];

  checkAll(metrics: MetricSnapshot): Alert[] {
    console.log("\n--- RUNNING ALERT CHECK ---");
    console.log("Current Metrics:", JSON.stringify(metrics, null, 2));
    
    const newAlerts: Alert[] = [];
    const activeAlerts = store.getActiveAlerts();

    for (const rule of this.rules) {
      const currentValue = metrics[rule.metric] as number;
      const isBreached = rule.check(currentValue);
      
      console.log(`[Alert Check] Rule: ${rule.name} | Metric: ${rule.metric} | Value: ${currentValue} | Threshold: ${rule.threshold} | Breached: ${isBreached}`);

      if (isBreached) {
        // Suppress duplicates: check if an active alert for this rule name already exists
        const isDuplicate = activeAlerts.some(a => a.name === rule.name);
        if (!isDuplicate) {
          const alert: Alert = {
            id: uuidv4(),
            name: rule.name,
            metric: rule.metric,
            current_value: currentValue,
            threshold: rule.threshold,
            severity: rule.severity,
            status: "firing",
            fired_at: new Date().toISOString(),
          };
          newAlerts.push(alert);
        }
      }
    }

    return newAlerts;
  }
}

export const alertEngine = new AlertEngine();
