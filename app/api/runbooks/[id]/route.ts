import { NextRequest, NextResponse } from 'next/server';
import { store } from '@/lib/store';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const runbook = store.getRunbook(id);
    if (!runbook) {
      return NextResponse.json({ error: "Runbook not found" }, { status: 404 });
    }
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      request_id: crypto.randomUUID(),
      data: runbook
    }, { status: 200 });
  } catch (error) {
    logger.error("runbook_fetch_failed", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
