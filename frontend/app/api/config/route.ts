import { NextResponse } from 'next/server';

// This API route runs at request time, ensuring env vars are always read correctly
export const dynamic = 'force-dynamic';

export async function GET() {
  // Prioritize API_URL/WS_URL (runtime vars) over NEXT_PUBLIC_* (build-time vars)
  // This ensures we always get the correct values from the ConfigMap at runtime
  const config = {
    apiUrl: process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://134.209.86.116:30080',
    wsUrl: process.env.WS_URL || process.env.NEXT_PUBLIC_WS_URL || 'ws://134.209.86.116:30084',
  };

  return NextResponse.json(config);
}



