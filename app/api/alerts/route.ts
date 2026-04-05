import { NextResponse } from 'next/server';
import { store } from '@/lib/store';
import { logger } from '@/lib/logger';

export async function GET() {
  try {
    const alerts = store.getAllAlerts();
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      request_id: crypto.randomUUID(),
      data: alerts
    }, { status: 200 });
  } catch (error) {
    logger.error("alerts_fetch_failed", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
