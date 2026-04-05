import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { brain } from '@/lib/brain';

export async function GET() {
  try {
    const placeholders = ["MY_GEMINI_API_KEY", "Gemini_Api_Key", "undefined"];
    const keys = [
      process.env.NEXT_PUBLIC_GEMINI_API_KEY,
      process.env.Gemini_API_Key,
      process.env.GEMINI_API_KEY
    ];
    
    let apiKey = keys.find(k => k && !placeholders.includes(k));
    
    const isReady = !!apiKey;
    const lastError = brain.getLastError();
    if (isReady) {
      return NextResponse.json({ 
        ready: true,
        lastError,
        env: {
          NEXT_PUBLIC_GEMINI_API_KEY: !!process.env.NEXT_PUBLIC_GEMINI_API_KEY,
          Gemini_API_Key: !!process.env.Gemini_API_Key,
          GEMINI_API_KEY: !!process.env.GEMINI_API_KEY,
          apiKey_used: apiKey?.substring(0, 5) + '...'
        }
      }, { status: 200 });
    } else {
      return NextResponse.json({ 
        ready: false, 
        lastError,
        reason: "Gemini API key is not set or is a placeholder",
        env: {
          NEXT_PUBLIC_GEMINI_API_KEY: !!process.env.NEXT_PUBLIC_GEMINI_API_KEY,
          Gemini_API_Key: !!process.env.Gemini_API_Key,
          GEMINI_API_KEY: !!process.env.GEMINI_API_KEY,
          apiKey_used: 'None'
        }
      }, { status: 503 });
    }
  } catch (error: any) {
    logger.error("ready_check_failed", error);
    return NextResponse.json({ ready: false, reason: error.message || "Internal error" }, { status: 503 });
  }
}
