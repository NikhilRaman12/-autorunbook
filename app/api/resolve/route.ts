import { NextRequest, NextResponse } from 'next/server';
import { store } from '@/lib/store';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { alert_id } = body;

    if (!alert_id) {
      // If no alert_id, resolve all and reset metrics
      const activeAlerts = store.getActiveAlerts();
      activeAlerts.forEach(a => store.resolveAlert(a.id));
      store.resetMetricsToNormal();
      
      logger.info("all_alerts_resolved");
      
      return NextResponse.json({
        timestamp: new Date().toISOString(),
        request_id: crypto.randomUUID(),
        message: "All alerts resolved and metrics reset"
      }, { status: 200 });
    }

    store.resolveAlert(alert_id);
    logger.info("alert_resolved", { alert_id });

    // If no more active alerts, reset metrics
    if (store.getActiveAlerts().length === 0) {
      store.resetMetricsToNormal();
    }

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      request_id: crypto.randomUUID(),
      message: `Alert ${alert_id} resolved`
    }, { status: 200 });

  } catch (error) {
    logger.error("resolve_failed", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
