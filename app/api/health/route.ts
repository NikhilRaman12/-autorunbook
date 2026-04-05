import { NextResponse } from 'next/server';
import { store } from '@/lib/store';
import { logger } from '@/lib/logger';

export async function GET() {
  try {
    const status = store.getStatus();
    const response = {
      status: "healthy",
      service: "autorunbook", 
      version: "1.0.0",
      uptime_seconds: status.uptime_seconds,
      timestamp: new Date().toISOString(),
      gemini_available: status.gemini_available
    };
    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    logger.error("health_check_failed", error);
    return NextResponse.json({
      status: "healthy",
      service: "autorunbook",
      version: "1.0.0",
      uptime_seconds: 0,
      timestamp: new Date().toISOString(),
      gemini_available: false,
      error: "Internal error but returning 200 as per policy"
    }, { status: 200 });
  }
}
