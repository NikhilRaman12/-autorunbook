import { NextRequest, NextResponse } from 'next/server';
import { store } from '@/lib/store';
import { alertEngine } from '@/lib/alerting';
import { brain } from '@/lib/brain';
import { logger } from '@/lib/logger';
import { SimulateRequest, MetricSnapshot } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body: SimulateRequest = await request.json();
    logger.info("simulation_started", { type: body.type, intensity: body.intensity });

    const currentMetrics = store.getStatus().current_metrics;
    let newMetrics: Partial<MetricSnapshot> = {};

    const isSevere = body.intensity === "severe";

    switch (body.type) {
      case "high_latency":
        newMetrics.p99_latency_ms = isSevere ? 1200 : 650;
        break;
      case "high_errors":
        newMetrics.error_rate_percent = isSevere ? 18 : 8;
        break;
      case "cpu_spike":
        newMetrics.cpu_usage_percent = isSevere ? 95 : 85;
        break;
      case "memory_leak":
        newMetrics.memory_usage_percent = isSevere ? 95 : 88;
        break;
      case "availability_drop":
        newMetrics.availability_percent = isSevere ? 88 : 93;
        break;
      case "traffic_surge":
        newMetrics.requests_per_second = isSevere ? 800 : 400;
        newMetrics.cpu_usage_percent = isSevere ? 95 : 85;
        newMetrics.error_rate_percent = currentMetrics.error_rate_percent + (isSevere ? 12 : 6);
        newMetrics.p99_latency_ms = currentMetrics.p99_latency_ms + (isSevere ? 800 : 400);
        break;
    }

    store.updateMetrics(newMetrics);
    const updatedMetrics = store.getStatus().current_metrics;

    const newAlerts = alertEngine.checkAll(updatedMetrics);
    const generatedRunbooks = [];
    
    for (const alert of newAlerts) {
      store.addAlert(alert);
      logger.alert(alert);
      
      try {
        // Generate runbook synchronously right away
        const runbook = await brain.generate(alert);
        store.addRunbook(runbook);
        const updatedAlert = store.getAlert(alert.id);
        if (updatedAlert) {
          updatedAlert.runbook_id = runbook.id;
        }
        generatedRunbooks.push(runbook);
      } catch (err) {
        logger.error("sync_runbook_generation_failed", err, { alert_id: alert.id });
      }
    }

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      request_id: crypto.randomUUID(),
      message: "Simulation applied",
      alerts_triggered: newAlerts.length,
      alerts: newAlerts,
      runbooks: generatedRunbooks,
      new_metrics: updatedMetrics
    }, { status: 200 });

  } catch (error) {
    logger.error("simulation_failed", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
