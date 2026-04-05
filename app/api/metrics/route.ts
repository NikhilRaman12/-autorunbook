import { NextResponse } from 'next/server';
import { getMetricsOutput, syncFromStore } from '@/lib/metrics';
import { logger } from '@/lib/logger';

export async function GET() {
  try {
    syncFromStore();
    const metricsText = await getMetricsOutput();
    return new NextResponse(metricsText, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; version=0.0.4',
      },
    });
  } catch (error) {
    logger.error("metrics_fetch_failed", error);
    return new NextResponse("Error fetching metrics", { status: 500 });
  }
}
