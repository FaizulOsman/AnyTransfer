import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    environment: process.env.VERCEL ? 'vercel-serverless' : 'custom-server',
    timestamp: Date.now(),
  });
}
