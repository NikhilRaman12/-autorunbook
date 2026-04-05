import { NextResponse } from 'next/server';
import { store } from '@/lib/store';
import { logger } from '@/lib/logger';

export async function GET() {
  try {
    const status = store.getStatus();
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      request_id: crypto.randomUUID(),
      data: status
    }, { status: 200 });
  } catch (error) {
    logger.error("status_fetch_failed", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
