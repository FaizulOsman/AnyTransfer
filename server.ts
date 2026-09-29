import express, { Request, Response } from 'express';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isProd = process.env.NODE_ENV === 'production';
const PORT = parseInt(process.env.PORT || '3000', 10);

interface ClientPeer {
  id: string;
  ws: WebSocket;
  name: string;
  modelName?: string;
  avatar?: string;
  deviceType: 'desktop' | 'laptop' | 'mobile' | 'tablet' | 'unknown';
  os: string;
  browser: string;
  ip: string;
  subnet: string;
  roomId?: string;
  lastSeen: number;
}

// Map from clientId -> ClientPeer
const clients = new Map<string, ClientPeer>();
// Map from roomId -> Set<clientId>
const rooms = new Map<string, Set<string>>();

// Adjectives and Animals for friendly device names
const ADJECTIVES = [
  'Amber', 'Azure', 'Cosmic', 'Crimson', 'Emerald', 'Golden', 'Indigo', 
  'Jade', 'Lunar', 'Mystic', 'Neon', 'Obsidian', 'Opal', 'Quartz', 
  'Radiant', 'Ruby', 'Sapphire', 'Solar', 'Topaz', 'Vibrant', 'Zenith'
];

const ANIMALS = [
  'Wolf', 'Goblin', 'Tiger', 'Falcon', 'Fox', 'Dolphin', 'Dragon', 'Bear',
  'Panda', 'Phoenix', 'Otter', 'Eagle', 'Hawk', 'Lynx', 'Leopard'
];

function generateFriendlyName(): string {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const animal = ANIMALS[Math.floor(Math.random() * ANIMALS.length)];
  return `${adj} ${animal}`;
}

function getSubnet(ip: string): string {
  if (!ip) return 'local_default';
  // If IPv4 or IPv4-mapped IPv6 (::ffff:192.168.1.10)
  const cleanIp = ip.replace(/^.*:/, '');
  const parts = cleanIp.split('.');
  if (parts.length === 4) {
    // Group by first 3 octets (e.g. 192.168.1.x)
    return `subnet_${parts.slice(0, 3).join('.')}`;
  }
  // Fallback hash for IPv6 or others
  return `subnet_${crypto.createHash('sha256').update(ip).digest('hex').slice(0, 8)}`;
}

function getClientIp(req: http.IncomingMessage): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  if (Array.isArray(forwarded) && forwarded.length > 0) {
    return forwarded[0].trim();
  }
  return req.socket.remoteAddress || '127.0.0.1';
}

function getVisiblePeersFor(targetClient: ClientPeer): any[] {
  const visible: any[] = [];

  for (const [id, peer] of clients.entries()) {
    if (id === targetClient.id) continue;

    // A peer is visible if:
    // 1. They are in the same transient room code
    // OR 2. They share the same IP subnet (and neither has locked to an exclusive room)
    const sameRoom = Boolean(targetClient.roomId && peer.roomId && targetClient.roomId === peer.roomId);
    const sameSubnet = Boolean(!targetClient.roomId && !peer.roomId && targetClient.subnet === peer.subnet);

    if (sameRoom || sameSubnet) {
      visible.push({
        id: peer.id,
        name: peer.name,
        modelName: peer.modelName,
        avatar: peer.avatar,
        deviceType: peer.deviceType,
        os: peer.os,
        browser: peer.browser,
        ipSubnet: peer.subnet,
        roomId: peer.roomId,
        status: 'available',
      });
    }
  }

  return visible;
}

function notifyPeerDiscoveryChange(client: ClientPeer) {
  // Find all peers that can see this client
  for (const [, other] of clients.entries()) {
    if (other.id === client.id) continue;

    const sameRoom = Boolean(client.roomId && other.roomId && client.roomId === other.roomId);
    const sameSubnet = Boolean(!client.roomId && !other.roomId && client.subnet === other.subnet);

    if (sameRoom || sameSubnet) {
      if (other.ws.readyState === WebSocket.OPEN) {
        other.ws.send(JSON.stringify({
          type: 'peer_joined',
          peer: {
            id: client.id,
            name: client.name,
            modelName: client.modelName,
            avatar: client.avatar,
            deviceType: client.deviceType,
            os: client.os,
            browser: client.browser,
            ipSubnet: client.subnet,
            roomId: client.roomId,
            status: 'available',
          }
        }));
      }
    }
  }
}

function notifyPeerLeft(client: ClientPeer) {
  for (const [, other] of clients.entries()) {
    if (other.id === client.id) continue;

    const sameRoom = Boolean(client.roomId && other.roomId && client.roomId === other.roomId);
    const sameSubnet = Boolean(!client.roomId && !other.roomId && client.subnet === other.subnet);

    if (sameRoom || sameSubnet) {
      if (other.ws.readyState === WebSocket.OPEN) {
        other.ws.send(JSON.stringify({
          type: 'peer_left',
          peerId: client.id,
        }));
      }
    }
  }
}

async function startServer() {
  const app = express();
  const server = http.createServer(app);

  app.use(express.json());

  // Health and STUN config endpoint
  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({
      status: 'ok',
      peersOnline: clients.size,
      activeRooms: rooms.size,
      timestamp: Date.now()
    });
  });

  app.get('/api/stun-servers', (_req: Request, res: Response) => {
    res.json({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
        { urls: 'stun:stun.cloudflare.com:3478' },
        {
          urls: [
            'turn:openrelay.metered.ca:80',
            'turn:openrelay.metered.ca:443',
            'turn:openrelay.metered.ca:443?transport=tcp'
          ],
          username: 'openrelayproject',
          credential: 'openrelayproject'
        }
      ]
    });
  });

  // WebSocket Server for signaling
  const wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (ws: WebSocket, req: http.IncomingMessage) => {
    const clientId = crypto.randomUUID();
    const rawIp = getClientIp(req);
    const subnet = getSubnet(rawIp);

    const friendlyName = generateFriendlyName();
    const avatarAnimal = friendlyName.split(' ')[1]?.toLowerCase() || 'wolf';

    const client: ClientPeer = {
      id: clientId,
      ws,
      name: friendlyName,
      avatar: avatarAnimal,
      deviceType: 'unknown',
      os: 'Unknown',
      browser: 'Unknown',
      ip: rawIp,
      subnet,
      lastSeen: Date.now(),
    };

    clients.set(clientId, client);

    // Send initial welcome message with self info
    ws.send(JSON.stringify({
      type: 'welcome',
      peerId: clientId,
      device: {
        id: clientId,
        name: client.name,
        avatar: client.avatar,
        ipSubnet: client.subnet,
      }
    }));

    ws.on('message', (messageRaw: string | Buffer) => {
      try {
        const msg = JSON.parse(messageRaw.toString());
        client.lastSeen = Date.now();

        switch (msg.type) {
          case 'join': {
            if (msg.device) {
              if (msg.device.name) client.name = String(msg.device.name).slice(0, 32);
              if (msg.device.modelName) client.modelName = String(msg.device.modelName).slice(0, 48);
              if (msg.device.avatar) client.avatar = String(msg.device.avatar).slice(0, 32);
              if (msg.device.deviceType) client.deviceType = msg.device.deviceType;
              if (msg.device.os) client.os = String(msg.device.os).slice(0, 32);
              if (msg.device.browser) client.browser = String(msg.device.browser).slice(0, 32);
            }
            if (msg.room) {
              client.roomId = String(msg.room).trim();
              if (!rooms.has(client.roomId)) {
                rooms.set(client.roomId, new Set());
              }
              rooms.get(client.roomId)!.add(client.id);
            }

            // Send full peer list to newly joined client
            const peers = getVisiblePeersFor(client);
            ws.send(JSON.stringify({
              type: 'peer_list',
              peers,
            }));

            // Notify others
            notifyPeerDiscoveryChange(client);
            break;
          }

          case 'create_room': {
            // Generate 6-digit random code
            const code = Math.floor(100000 + Math.random() * 900000).toString();
            
            // If already in a room, leave it
            if (client.roomId && rooms.has(client.roomId)) {
              rooms.get(client.roomId)?.delete(client.id);
              notifyPeerLeft(client);
            }

            client.roomId = code;
            if (!rooms.has(code)) {
              rooms.set(code, new Set());
            }
            rooms.get(code)!.add(client.id);

            ws.send(JSON.stringify({
              type: 'room_created',
              room: code,
            }));

            // Refresh peer list
            ws.send(JSON.stringify({
              type: 'peer_list',
              peers: getVisiblePeersFor(client),
            }));
            notifyPeerDiscoveryChange(client);
            break;
          }

          case 'join_room': {
            const requestedRoom = String(msg.room || '').trim();
            if (!requestedRoom || requestedRoom.length < 4) {
              ws.send(JSON.stringify({
                type: 'room_error',
                data: 'Invalid room code',
              }));
              return;
            }

            // Leave old room
            if (client.roomId && rooms.has(client.roomId)) {
              rooms.get(client.roomId)?.delete(client.id);
              notifyPeerLeft(client);
            }

            client.roomId = requestedRoom;
            if (!rooms.has(requestedRoom)) {
              rooms.set(requestedRoom, new Set());
            }
            rooms.get(requestedRoom)!.add(client.id);

            ws.send(JSON.stringify({
              type: 'room_joined',
              room: requestedRoom,
            }));

            ws.send(JSON.stringify({
              type: 'peer_list',
              peers: getVisiblePeersFor(client),
            }));
            notifyPeerDiscoveryChange(client);
            break;
          }

          case 'leave_room': {
            if (client.roomId && rooms.has(client.roomId)) {
              rooms.get(client.roomId)?.delete(client.id);
              if (rooms.get(client.roomId)?.size === 0) {
                rooms.delete(client.roomId);
              }
              notifyPeerLeft(client);
              client.roomId = undefined;
            }

            ws.send(JSON.stringify({
              type: 'room_joined',
              room: null,
            }));

            // Fallback back to subnet discovery
            ws.send(JSON.stringify({
              type: 'peer_list',
              peers: getVisiblePeersFor(client),
            }));
            notifyPeerDiscoveryChange(client);
            break;
          }

          case 'signal': {
            // Relay WebRTC signaling (offer, answer, ICE candidate) to destination peer
            const targetPeerId = msg.to;
            if (targetPeerId && clients.has(targetPeerId)) {
              const target = clients.get(targetPeerId)!;
              if (target.ws.readyState === WebSocket.OPEN) {
                target.ws.send(JSON.stringify({
                  type: 'signal',
                  from: client.id,
                  data: msg.data,
                }));
              }
            }
            break;
          }

          case 'relay_transfer': {
            // Fallback relay transfer when WebRTC DataChannel cannot connect across restrictive NAT
            const targetPeerId = msg.to;
            if (targetPeerId && clients.has(targetPeerId)) {
              const target = clients.get(targetPeerId)!;
              if (target.ws.readyState === WebSocket.OPEN) {
                target.ws.send(JSON.stringify({
                  type: 'relay_transfer',
                  from: client.id,
                  data: msg.data,
                }));
              }
            }
            break;
          }

          case 'ping': {
            ws.send(JSON.stringify({ type: 'pong' }));
            break;
          }

          default:
            break;
        }
      } catch (err) {
        console.error('Error handling message from client:', err);
      }
    });

    ws.on('close', () => {
      notifyPeerLeft(client);
      if (client.roomId && rooms.has(client.roomId)) {
        rooms.get(client.roomId)?.delete(client.id);
        if (rooms.get(client.roomId)?.size === 0) {
          rooms.delete(client.roomId);
        }
      }
      clients.delete(clientId);
    });

    ws.on('error', (err) => {
      console.error(`WebSocket error on client ${clientId}:`, err);
    });
  });

  // Keep-alive heartbeat interval every 30s
  setInterval(() => {
    const now = Date.now();
    for (const [id, peer] of clients.entries()) {
      if (peer.ws.readyState === WebSocket.OPEN) {
        if (now - peer.lastSeen > 60000) {
          peer.ws.terminate();
          clients.delete(id);
        }
      }
    }
  }, 30000);

  // Vite middleware in dev or static files in production
  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`[Any Transfer] Server listening on http://0.0.0.0:${PORT} (mode: ${isProd ? 'production' : 'development'})`);
  });
}

startServer().catch((err) => {
  console.error('[Any Transfer] Failed to start server:', err);
  process.exit(1);
});
