import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { roomName, sessionTitle } = await req.json();

  const DAILY_API_KEY = process.env.DAILY_API_KEY;
  if (!DAILY_API_KEY) {
    return NextResponse.json({ error: 'Daily API key not configured' }, { status: 500 });
  }

  const name = roomName || `sparsh-${Date.now()}`;

  // Create a Daily.co room via their REST API
  const res = await fetch('https://api.daily.co/v1/rooms', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${DAILY_API_KEY}`,
    },
    body: JSON.stringify({
      name,
      properties: {
        enable_screenshare: true,
        enable_chat: true,
        enable_knocking: false,
        enable_prejoin_ui: false,
        exp: Math.round(Date.now() / 1000) + 3600, // 1 hour from now
      },
    }),
  });

  if (!res.ok) {
    const err = await res.json();
    return NextResponse.json({ error: err }, { status: 400 });
  }

  const room = await res.json();
  return NextResponse.json({ url: room.url, name: room.name });
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const roomName = searchParams.get('room');

  const DAILY_API_KEY = process.env.DAILY_API_KEY;
  if (!DAILY_API_KEY) {
    return NextResponse.json({ error: 'Daily API key not configured' }, { status: 500 });
  }

  const res = await fetch(`https://api.daily.co/v1/rooms/${roomName}`, {
    headers: { Authorization: `Bearer ${DAILY_API_KEY}` },
  });

  if (!res.ok) {
    return NextResponse.json({ error: 'Room not found' }, { status: 404 });
  }

  const room = await res.json();
  return NextResponse.json({ url: room.url, name: room.name });
}
