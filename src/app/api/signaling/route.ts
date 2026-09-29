import { NextRequest, NextResponse } from 'next/server';

interface PeerState {
  id: string;
  name: string;
  modelName?: string;
  avatar?: string;
  deviceType: string;
  os: string;
  browser: string;
  roomId?: string;
  subnet: string;
  lastSeen: number;
  messages: any[];
}

// In-memory global store for warm lambda instances
const globalPeers = new Map<string, PeerState>();
const globalRooms = new Map<string, Set<string>>();

function cleanupStale() {
  const now = Date.now();
  for (const [id, peer] of globalPeers.entries()) {
    if (now - peer.lastSeen > 45000) {
      if (peer.roomId && globalRooms.has(peer.roomId)) {
        globalRooms.get(peer.roomId)?.delete(id);
      }
      globalPeers.delete(id);
    }
  }
}

export async function POST(req: NextRequest) {
  cleanupStale();
  try {
    const body = await req.json();
    const { action, peerId, device, room, to, data } = body;
    const now = Date.now();

    if (action === 'poll') {
      const peer = globalPeers.get(peerId);
      if (peer) {
        peer.lastSeen = now;
        const queuedMessages = [...peer.messages];
        peer.messages = [];

        const visible: any[] = [];
        for (const [id, p] of globalPeers.entries()) {
          if (id === peer.id) continue;
          const sameRoom = Boolean(peer.roomId && p.roomId && peer.roomId === p.roomId);
          const sameSubnet = Boolean(!peer.roomId && !p.roomId && peer.subnet === p.subnet);
          if (sameRoom || sameSubnet) {
            visible.push({
              id: p.id,
              name: p.name,
              modelName: p.modelName,
              avatar: p.avatar,
              deviceType: p.deviceType,
              os: p.os,
              browser: p.browser,
              roomId: p.roomId,
              status: 'available',
            });
          }
        }

        return NextResponse.json({
          ok: true,
          peers: visible,
          messages: queuedMessages,
        });
      } else {
        return NextResponse.json({ ok: false, error: 'Peer not found' });
      }
    }

    if (action === 'register') {
      const newPeerId = peerId || crypto.randomUUID();
      const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';
      const cleanIp = clientIp.replace(/^.*:/, '');
      const subnet = `subnet_${cleanIp.split('.').slice(0, 3).join('.')}`;

      const peer: PeerState = {
        id: newPeerId,
        name: device?.name || 'Device',
        modelName: device?.modelName,
        avatar: device?.avatar || 'wolf',
        deviceType: device?.deviceType || 'unknown',
        os: device?.os || 'Unknown',
        browser: device?.browser || 'Unknown',
        roomId: room || undefined,
        subnet,
        lastSeen: now,
        messages: [],
      };

      globalPeers.set(newPeerId, peer);

      if (room) {
        if (!globalRooms.has(room)) globalRooms.set(room, new Set());
        globalRooms.get(room)!.add(newPeerId);
      }

      return NextResponse.json({
        ok: true,
        peerId: newPeerId,
        subnet,
      });
    }

    if (action === 'create_room') {
      const peer = globalPeers.get(peerId);
      if (!peer) return NextResponse.json({ ok: false, error: 'Peer not found' });

      const code = Math.floor(100000 + Math.random() * 900000).toString();

      if (peer.roomId && globalRooms.has(peer.roomId)) {
        globalRooms.get(peer.roomId)?.delete(peer.id);
      }

      peer.roomId = code;
      if (!globalRooms.has(code)) globalRooms.set(code, new Set());
      globalRooms.get(code)!.add(peer.id);

      return NextResponse.json({
        ok: true,
        room: code,
      });
    }

    if (action === 'join_room') {
      const peer = globalPeers.get(peerId);
      if (!peer) return NextResponse.json({ ok: false, error: 'Peer not found' });

      const code = String(room || '').trim();
      if (!code || code.length < 4) {
        return NextResponse.json({ ok: false, error: 'Invalid room code' });
      }

      if (peer.roomId && globalRooms.has(peer.roomId)) {
        globalRooms.get(peer.roomId)?.delete(peer.id);
      }

      peer.roomId = code;
      if (!globalRooms.has(code)) globalRooms.set(code, new Set());
      globalRooms.get(code)!.add(peer.id);

      return NextResponse.json({
        ok: true,
        room: code,
      });
    }

    if (action === 'leave_room') {
      const peer = globalPeers.get(peerId);
      if (peer && peer.roomId) {
        if (globalRooms.has(peer.roomId)) {
          globalRooms.get(peer.roomId)?.delete(peer.id);
        }
        peer.roomId = undefined;
      }
      return NextResponse.json({ ok: true });
    }

    if (action === 'signal' || action === 'relay_transfer') {
      const targetPeer = globalPeers.get(to);
      if (targetPeer) {
        targetPeer.messages.push({
          type: action,
          from: peerId,
          data,
        });
        return NextResponse.json({ ok: true });
      }
      return NextResponse.json({ ok: false, error: 'Target peer not found' });
    }

    return NextResponse.json({ ok: false, error: 'Unknown action' });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
