import { NextResponse } from 'next/server';
import { store } from '@/lib/store';
import { logger } from '@/lib/logger';

export async function GET() {
  try {
    const runbooks = store.getAllRunbooks();
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      request_id: crypto.randomUUID(),
      data: runbooks
    }, { status: 200 });
  } catch (error) {
    logger.error("runbooks_fetch_failed", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
