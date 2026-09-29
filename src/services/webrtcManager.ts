import { FileMetadata, IceServerConfig, PeerDevice, RTCControlMessage, TransferSession } from '../types/transfer';
import { computeCRC32 } from '../utils/device';

export const CHUNK_SIZE = 64 * 1024; // 64 KB
export const MAX_BUFFER_AMOUNT = 1024 * 1024; // 1 MB backpressure limit
export const BUFFER_LOW_THRESHOLD = 256 * 1024; // 256 KB resume threshold

export const DEFAULT_ICE_SERVERS: IceServerConfig[] = [
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
];

export interface WebRTCEvents {
  onSignalingSend: (to: string, data: any) => void;
  onRelaySend: (to: string, data: any) => void;
  onIncomingTransferRequest: (transfer: TransferSession) => void;
  onTransferProgress: (transfer: TransferSession) => void;
  onTransferComplete: (transfer: TransferSession) => void;
  onTransferError: (transferId: string, error: string) => void;
  onPeerConnectionStateChange: (peerId: string, state: RTCPeerConnectionState) => void;
}

export class WebRTCManager {
  private peerConnections = new Map<string, RTCPeerConnection>();
  private dataChannels = new Map<string, RTCDataChannel>();
  private peerTransports = new Map<string, 'webrtc' | 'relay'>();
  private pendingCandidates = new Map<string, RTCIceCandidateInit[]>();

  private iceServers: IceServerConfig[] = DEFAULT_ICE_SERVERS;
  private events: WebRTCEvents;
  private selfId: string = '';

  // Track active transfers
  private activeTransfers = new Map<string, TransferSession>();
  // Buffers for receiving chunks: transferId -> fileIndex -> Uint8Array[]
  private receiveBuffers = new Map<string, Map<number, Uint8Array[]>>();
  // Speed calculation helpers: transferId -> { lastBytes, lastTime }
  private speedTrackers = new Map<string, { lastBytes: number; lastTime: number }>();
  // Cancellation / pause flags: transferId -> { paused: boolean; cancelled: boolean }
  private transferControls = new Map<string, { paused: boolean; cancelled: boolean }>();

  constructor(events: WebRTCEvents) {
    this.events = events;
    this.loadCustomIceServers();
  }

  public setSelfId(id: string) {
    this.selfId = id;
  }

  public loadCustomIceServers() {
    try {
      const saved = localStorage.getItem('aetherdrop_ice_servers');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.iceServers = parsed;
          return;
        }
      }
    } catch (e) {
      console.warn('Failed to parse custom ice servers:', e);
    }
    this.iceServers = DEFAULT_ICE_SERVERS;
  }

  public setCustomIceServers(servers: IceServerConfig[]) {
    this.iceServers = servers.length > 0 ? servers : DEFAULT_ICE_SERVERS;
    try {
      localStorage.setItem('aetherdrop_ice_servers', JSON.stringify(this.iceServers));
    } catch (e) {
      console.warn('Failed to save custom ice servers:', e);
    }
  }

  public getIceServers(): IceServerConfig[] {
    return this.iceServers;
  }

  /**
   * Get or create an RTCPeerConnection to a peer
   */
  private getOrCreatePeerConnection(peerId: string, isInitiator: boolean): RTCPeerConnection {
    let pc = this.peerConnections.get(peerId);
    if (pc) {
      if (pc.connectionState === 'closed' || pc.connectionState === 'failed') {
        pc.close();
        this.peerConnections.delete(peerId);
        this.dataChannels.delete(peerId);
        pc = undefined;
      } else {
        return pc;
      }
    }

    const config: RTCConfiguration = {
      iceServers: this.iceServers,
      iceCandidatePoolSize: 2,
    };

    pc = new RTCPeerConnection(config);
    this.peerConnections.set(peerId, pc);

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        this.events.onSignalingSend(peerId, {
          candidate: event.candidate.toJSON ? event.candidate.toJSON() : {
            candidate: event.candidate.candidate,
            sdpMid: event.candidate.sdpMid,
            sdpMLineIndex: event.candidate.sdpMLineIndex,
          },
        });
      }
    };

    pc.onicecandidateerror = (event) => {
      console.warn(`[WebRTC] ICE candidate error with ${peerId}:`, event);
    };

    pc.onconnectionstatechange = () => {
      const state = pc!.connectionState;
      this.events.onPeerConnectionStateChange(peerId, state);
      if (state === 'failed' || state === 'disconnected' || state === 'closed') {
        console.warn(`[WebRTC] Peer ${peerId} connection state: ${state}`);
        // If connection fails, switch to relay transport
        if (state === 'failed') {
          this.peerTransports.set(peerId, 'relay');
        }
      }
    };

    if (isInitiator) {
      // Initiator creates data channel
      const dc = pc.createDataChannel('aetherdrop-transfer', {
        ordered: true,
      });
      this.setupDataChannel(peerId, dc);
    } else {
      // Receiver listens for data channel
      pc.ondatachannel = (event) => {
        this.setupDataChannel(peerId, event.channel);
      };
    }

    return pc;
  }

  private setupDataChannel(peerId: string, dc: RTCDataChannel) {
    dc.binaryType = 'arraybuffer';
    dc.bufferedAmountLowThreshold = BUFFER_LOW_THRESHOLD;
    this.dataChannels.set(peerId, dc);

    dc.onopen = () => {
      console.log(`[WebRTC] Data channel OPEN with peer ${peerId}`);
      this.peerTransports.set(peerId, 'webrtc');
    };

    dc.onclose = () => {
      console.log(`[WebRTC] Data channel CLOSED with peer ${peerId}`);
      this.dataChannels.delete(peerId);
    };

    dc.onerror = (err) => {
      console.error(`[WebRTC] Data channel error with peer ${peerId}:`, err);
    };

    dc.onmessage = (event) => {
      this.handleIncomingData(peerId, event.data);
    };
  }

  /**
   * Handle incoming WebRTC signaling data (offer, answer, candidate)
   */
  public async handleSignaling(fromPeerId: string, data: any) {
    try {
      if (data.sdp) {
        const rawSdp = data.sdp;
        const sdpInit: RTCSessionDescriptionInit = {
          type: rawSdp.type,
          sdp: rawSdp.sdp,
        };

        if (sdpInit.type === 'offer') {
          const pc = this.getOrCreatePeerConnection(fromPeerId, false);
          await pc.setRemoteDescription(new RTCSessionDescription(sdpInit));

          // Flush queued candidates
          await this.flushPendingCandidates(fromPeerId, pc);

          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);

          this.events.onSignalingSend(fromPeerId, {
            sdp: {
              type: pc.localDescription!.type,
              sdp: pc.localDescription!.sdp,
            },
          });
        } else if (sdpInit.type === 'answer') {
          const pc = this.peerConnections.get(fromPeerId);
          if (pc && pc.signalingState === 'have-local-offer') {
            await pc.setRemoteDescription(new RTCSessionDescription(sdpInit));
            // Flush queued candidates
            await this.flushPendingCandidates(fromPeerId, pc);
          }
        }
      } else if (data.candidate) {
        const pc = this.peerConnections.get(fromPeerId);
        if (pc && pc.remoteDescription && pc.remoteDescription.type) {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
          } catch (e) {
            console.warn(`[WebRTC] addIceCandidate error for ${fromPeerId}:`, e);
          }
        } else {
          // Queue candidate until remoteDescription is ready
          if (!this.pendingCandidates.has(fromPeerId)) {
            this.pendingCandidates.set(fromPeerId, []);
          }
          this.pendingCandidates.get(fromPeerId)!.push(data.candidate);
        }
      }
    } catch (err) {
      console.error(`[WebRTC] Error handling signal from ${fromPeerId}:`, err);
    }
  }

  private async flushPendingCandidates(peerId: string, pc: RTCPeerConnection) {
    const queued = this.pendingCandidates.get(peerId);
    if (queued && queued.length > 0) {
      for (const cand of queued) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(cand));
        } catch (e) {
          console.warn(`[WebRTC] Error adding flushed candidate:`, e);
        }
      }
      this.pendingCandidates.delete(peerId);
    }
  }

  /**
   * Connect to a peer (initiate WebRTC handshake with graceful Relay fallback)
   */
  public async ensureConnection(peerId: string): Promise<'webrtc' | 'relay'> {
    const existingDc = this.dataChannels.get(peerId);
    if (existingDc && existingDc.readyState === 'open') {
      this.peerTransports.set(peerId, 'webrtc');
      return 'webrtc';
    }

    try {
      const pc = this.getOrCreatePeerConnection(peerId, true);
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      this.events.onSignalingSend(peerId, {
        sdp: {
          type: pc.localDescription!.type,
          sdp: pc.localDescription!.sdp,
        },
      });

      // Wait up to 4.5 seconds for WebRTC data channel to open
      const connected = await new Promise<boolean>((resolve) => {
        const timeout = setTimeout(() => {
          resolve(false);
        }, 4500);

        const checkInterval = setInterval(() => {
          const dc = this.dataChannels.get(peerId);
          if (dc && dc.readyState === 'open') {
            clearTimeout(timeout);
            clearInterval(checkInterval);
            resolve(true);
          } else if (pc.iceConnectionState === 'failed' || pc.connectionState === 'failed') {
            clearTimeout(timeout);
            clearInterval(checkInterval);
            resolve(false);
          }
        }, 100);
      });

      if (connected) {
        this.peerTransports.set(peerId, 'webrtc');
        return 'webrtc';
      }
    } catch (err) {
      console.warn(`[WebRTC] Handshake error with ${peerId}, falling back to relay:`, err);
    }

    // Fallback to relay transport
    console.log(`[Transport] Using high-reliability Relay fallback for peer ${peerId}`);
    this.peerTransports.set(peerId, 'relay');
    return 'relay';
  }

  /**
   * Universal message sending abstraction: routes through WebRTC DataChannel if open,
   * or through WebSocket Relay if WebRTC direct P2P is blocked by symmetric NAT.
   */
  private sendToPeer(peerId: string, payload: string | ArrayBuffer) {
    const transport = this.peerTransports.get(peerId) || 'relay';
    const dc = this.dataChannels.get(peerId);

    if (transport === 'webrtc' && dc && dc.readyState === 'open') {
      dc.send(payload as any);
    } else {
      // Send via WebSocket Relay
      if (typeof payload === 'string') {
        this.events.onRelaySend(peerId, {
          isBinary: false,
          content: payload,
        });
      } else {
        // Binary ArrayBuffer: convert to base64
        const bytes = new Uint8Array(payload);
        let binaryStr = '';
        const len = bytes.byteLength;
        for (let i = 0; i < len; i++) {
          binaryStr += String.fromCharCode(bytes[i]);
        }
        const b64 = btoa(binaryStr);
        this.events.onRelaySend(peerId, {
          isBinary: true,
          content: b64,
        });
      }
    }
  }

  /**
   * Handle incoming message from WebSocket Relay
   */
  public handleRelayMessage(fromPeerId: string, data: any) {
    if (!data) return;
    if (data.isBinary) {
      const binaryStr = atob(data.content);
      const len = binaryStr.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryStr.charCodeAt(i);
      }
      this.handleIncomingData(fromPeerId, bytes.buffer);
    } else {
      this.handleIncomingData(fromPeerId, data.content);
    }
  }

  /**
   * Prepare files and initiate a transfer to a peer
   */
  public async sendFiles(peer: PeerDevice, rawFiles: File[]): Promise<string> {
    if (!rawFiles || rawFiles.length === 0) {
      throw new Error('No files provided to send');
    }

    const transferId = 'tx_' + Math.random().toString(36).substring(2, 10);
    const filesMeta: FileMetadata[] = [];
    let totalBytes = 0;

    for (let i = 0; i < rawFiles.length; i++) {
      const f = rawFiles[i];
      const totalChunks = Math.ceil(f.size / CHUNK_SIZE) || 1;
      totalBytes += f.size;
      filesMeta.push({
        id: `file_${i}_${Math.random().toString(36).substring(2, 7)}`,
        name: f.name,
        size: f.size,
        type: f.type || 'application/octet-stream',
        lastModified: f.lastModified,
        totalChunks,
        chunkSize: CHUNK_SIZE,
      });
    }

    const session: TransferSession = {
      id: transferId,
      peerId: peer.id,
      peerName: peer.name,
      direction: 'upload',
      files: filesMeta,
      currentFileIndex: 0,
      status: 'connecting',
      bytesTransferred: 0,
      totalBytes,
      speed: 0,
      eta: 0,
      startedAt: Date.now(),
      transport: 'webrtc',
      _rawFiles: rawFiles,
    };

    this.activeTransfers.set(transferId, session);
    this.transferControls.set(transferId, { paused: false, cancelled: false });
    this.speedTrackers.set(transferId, { lastBytes: 0, lastTime: Date.now() });
    this.events.onTransferProgress({ ...session });

    try {
      const transport = await this.ensureConnection(peer.id);
      session.transport = transport;

      // Send transfer authorization request
      const requestMsg: RTCControlMessage = {
        type: 'transfer_request',
        transferId,
        files: filesMeta,
      };

      session.status = 'pending_approval';
      this.events.onTransferProgress({ ...session });

      this.sendToPeer(peer.id, JSON.stringify(requestMsg));
      return transferId;
    } catch (err: any) {
      session.status = 'failed';
      session.error = err.message || 'Failed to establish connection';
      this.events.onTransferError(transferId, session.error || 'Connection failed');
      throw err;
    }
  }

  /**
   * Retry a failed transfer
   */
  public async retryTransfer(transferId: string) {
    const session = this.activeTransfers.get(transferId);
    if (!session || !session._rawFiles) return;

    session.status = 'connecting';
    session.bytesTransferred = 0;
    session.error = undefined;
    this.transferControls.set(transferId, { paused: false, cancelled: false });
    this.speedTrackers.set(transferId, { lastBytes: 0, lastTime: Date.now() });
    this.events.onTransferProgress({ ...session });

    try {
      const transport = await this.ensureConnection(session.peerId);
      session.transport = transport;

      const requestMsg: RTCControlMessage = {
        type: 'transfer_request',
        transferId,
        files: session.files,
      };

      session.status = 'pending_approval';
      this.events.onTransferProgress({ ...session });

      this.sendToPeer(session.peerId, JSON.stringify(requestMsg));
    } catch (err: any) {
      session.status = 'failed';
      session.error = err.message || 'Retry failed';
      this.events.onTransferError(transferId, session.error || 'Retry failed');
    }
  }

  /**
   * Receiver accepts an incoming transfer request
   */
  public acceptTransfer(transferId: string) {
    const session = this.activeTransfers.get(transferId);
    if (!session) return;

    session.status = 'transferring';
    session.startedAt = Date.now();
    this.events.onTransferProgress({ ...session });

    const acceptMsg: RTCControlMessage = {
      type: 'transfer_accept',
      transferId,
    };
    this.sendToPeer(session.peerId, JSON.stringify(acceptMsg));
  }

  /**
   * Receiver rejects an incoming transfer request
   */
  public rejectTransfer(transferId: string, reason = 'User declined') {
    const session = this.activeTransfers.get(transferId);
    if (!session) return;

    session.status = 'cancelled';
    session.error = reason;
    this.events.onTransferProgress({ ...session });

    const rejectMsg: RTCControlMessage = {
      type: 'transfer_reject',
      transferId,
      reason,
    };
    this.sendToPeer(session.peerId, JSON.stringify(rejectMsg));
  }

  /**
   * Pause or resume transfer
   */
  public togglePauseTransfer(transferId: string) {
    const session = this.activeTransfers.get(transferId);
    const ctrl = this.transferControls.get(transferId);
    if (!session || !ctrl) return;

    ctrl.paused = !ctrl.paused;
    session.status = ctrl.paused ? 'paused' : 'transferring';
    this.events.onTransferProgress({ ...session });

    const msg: RTCControlMessage = {
      type: ctrl.paused ? 'transfer_pause' : 'transfer_resume',
      transferId,
    };
    this.sendToPeer(session.peerId, JSON.stringify(msg));
  }

  /**
   * Cancel transfer
   */
  public cancelTransfer(transferId: string) {
    const session = this.activeTransfers.get(transferId);
    const ctrl = this.transferControls.get(transferId);
    if (ctrl) ctrl.cancelled = true;

    if (session) {
      session.status = 'cancelled';
      session.error = 'Cancelled by user';
      this.events.onTransferProgress({ ...session });

      const msg: RTCControlMessage = {
        type: 'transfer_cancel',
        transferId,
      };
      this.sendToPeer(session.peerId, JSON.stringify(msg));
    }
  }

  /**
   * Streaming sender execution with backpressure management
   */
  private async executeUpload(transferId: string) {
    const session = this.activeTransfers.get(transferId);
    const ctrl = this.transferControls.get(transferId);
    if (!session || !ctrl) return;

    const rawFiles: File[] = session._rawFiles || [];
    if (!rawFiles || rawFiles.length === 0) return;

    session.status = 'transferring';
    session.startedAt = Date.now();
    this.events.onTransferProgress({ ...session });

    const dc = this.dataChannels.get(session.peerId);
    const isDirectWebRTC = session.transport === 'webrtc' && dc && dc.readyState === 'open';

    const textEncoder = new TextEncoder();
    const txIdBytes = textEncoder.encode(transferId.slice(0, 16));

    for (let fileIndex = 0; fileIndex < rawFiles.length; fileIndex++) {
      if (ctrl.cancelled) break;

      session.currentFileIndex = fileIndex;
      const file = rawFiles[fileIndex];
      const meta = session.files[fileIndex];
      let offset = 0;
      let chunkIndex = 0;

      while (offset < file.size || (file.size === 0 && chunkIndex === 0)) {
        if (ctrl.cancelled) break;

        // Handle pause
        while (ctrl.paused && !ctrl.cancelled) {
          await new Promise((r) => setTimeout(r, 200));
        }
        if (ctrl.cancelled) break;

        // BACKPRESSURE CHECK (for WebRTC data channel)
        if (isDirectWebRTC && dc && dc.bufferedAmount > MAX_BUFFER_AMOUNT) {
          await new Promise<void>((resolve) => {
            const onLow = () => {
              dc.removeEventListener('bufferedamountlow', onLow);
              resolve();
            };
            dc.addEventListener('bufferedamountlow', onLow);
          });
        }

        const sliceEnd = Math.min(offset + CHUNK_SIZE, file.size);
        const slice = file.slice(offset, sliceEnd);
        const arrayBuf = await slice.arrayBuffer();
        const payloadLength = arrayBuf.byteLength;
        const isLastChunk = sliceEnd >= file.size ? 1 : 0;

        // 36-byte binary header
        const headerSize = 36;
        const packet = new Uint8Array(headerSize + payloadLength);
        packet.set(txIdBytes, 0);

        const dataView = new DataView(packet.buffer, 16, 20);
        dataView.setUint32(0, fileIndex, false);
        dataView.setUint32(4, chunkIndex, false);
        dataView.setUint32(8, meta.totalChunks, false);
        dataView.setUint32(12, payloadLength, false);
        dataView.setUint32(16, isLastChunk, false);

        packet.set(new Uint8Array(arrayBuf), headerSize);

        this.sendToPeer(session.peerId, packet.buffer);

        offset += payloadLength;
        chunkIndex++;
        session.bytesTransferred += payloadLength;

        // For relay transfers, add a tiny microtask throttle to prevent WebSocket flooding
        if (!isDirectWebRTC) {
          await new Promise((r) => setTimeout(r, 1));
        }

        this.updateTransferMetrics(transferId);

        if (file.size === 0) break;
      }
    }

    if (!ctrl.cancelled) {
      session.status = 'completed';
      session.completedAt = Date.now();
      session.speed = 0;
      session.eta = 0;
      this.events.onTransferComplete({ ...session });
    }
  }

  /**
   * Unified message processor for both WebRTC DataChannel and WebSocket Relay
   */
  public handleIncomingData(peerId: string, data: any) {
    if (typeof data === 'string') {
      try {
        const msg: RTCControlMessage = JSON.parse(data);
        this.handleControlMessage(peerId, msg);
      } catch (e) {
        console.error('[WebRTC] Error parsing JSON control message:', e);
      }
    } else if (data instanceof ArrayBuffer) {
      this.handleBinaryChunk(peerId, data);
    }
  }

  private handleControlMessage(peerId: string, msg: RTCControlMessage) {
    const { type, transferId } = msg;

    switch (type) {
      case 'transfer_request': {
        const session: TransferSession = {
          id: transferId,
          peerId,
          peerName: 'Remote Peer',
          direction: 'download',
          files: msg.files || [],
          currentFileIndex: 0,
          status: 'pending_approval',
          bytesTransferred: 0,
          totalBytes: (msg.files || []).reduce((acc, f) => acc + f.size, 0),
          speed: 0,
          eta: 0,
          startedAt: Date.now(),
          assembledBlobs: {},
        };

        this.activeTransfers.set(transferId, session);
        this.transferControls.set(transferId, { paused: false, cancelled: false });
        this.receiveBuffers.set(transferId, new Map());
        this.speedTrackers.set(transferId, { lastBytes: 0, lastTime: Date.now() });

        this.events.onIncomingTransferRequest(session);
        break;
      }

      case 'transfer_accept': {
        const session = this.activeTransfers.get(transferId);
        if (session && session.direction === 'upload') {
          this.executeUpload(transferId);
        }
        break;
      }

      case 'transfer_reject': {
        const session = this.activeTransfers.get(transferId);
        if (session) {
          session.status = 'cancelled';
          session.error = msg.reason || 'Peer rejected the transfer';
          this.events.onTransferProgress({ ...session });
        }
        break;
      }

      case 'transfer_pause': {
        const session = this.activeTransfers.get(transferId);
        const ctrl = this.transferControls.get(transferId);
        if (session && ctrl) {
          ctrl.paused = true;
          session.status = 'paused';
          this.events.onTransferProgress({ ...session });
        }
        break;
      }

      case 'transfer_resume': {
        const session = this.activeTransfers.get(transferId);
        const ctrl = this.transferControls.get(transferId);
        if (session && ctrl) {
          ctrl.paused = false;
          session.status = 'transferring';
          this.events.onTransferProgress({ ...session });
        }
        break;
      }

      case 'transfer_cancel': {
        const session = this.activeTransfers.get(transferId);
        const ctrl = this.transferControls.get(transferId);
        if (ctrl) ctrl.cancelled = true;
        if (session) {
          session.status = 'cancelled';
          session.error = 'Transfer cancelled by peer';
          this.events.onTransferProgress({ ...session });
        }
        break;
      }

      default:
        break;
    }
  }

  private handleBinaryChunk(_peerId: string, arrayBuf: ArrayBuffer) {
    try {
      const headerSize = 36;
      if (arrayBuf.byteLength < headerSize) return;

      const txBytes = new Uint8Array(arrayBuf, 0, 16);
      const textDecoder = new TextDecoder();
      const transferId = textDecoder.decode(txBytes).replace(/\0/g, '').trim();

      const session = this.activeTransfers.get(transferId);
      if (!session || session.status === 'cancelled' || session.status === 'failed') {
        return;
      }

      const dataView = new DataView(arrayBuf, 16, 20);
      const fileIndex = dataView.getUint32(0, false);
      const chunkIndex = dataView.getUint32(4, false);
      const totalChunks = dataView.getUint32(8, false);
      const payloadLength = dataView.getUint32(12, false);
      const isLastChunk = dataView.getUint32(16, false);

      const chunkData = new Uint8Array(arrayBuf, headerSize, payloadLength);

      let fileBuffers = this.receiveBuffers.get(transferId);
      if (!fileBuffers) {
        fileBuffers = new Map();
        this.receiveBuffers.set(transferId, fileBuffers);
      }

      if (!fileBuffers.has(fileIndex)) {
        fileBuffers.set(fileIndex, []);
      }
      fileBuffers.get(fileIndex)!.push(chunkData);

      session.bytesTransferred += payloadLength;
      session.currentFileIndex = fileIndex;
      session.status = 'transferring';

      this.updateTransferMetrics(transferId);

      // Check if this file is complete
      if (isLastChunk === 1 || chunkIndex === totalChunks - 1) {
        const chunks = fileBuffers.get(fileIndex) || [];
        const fileMeta = session.files[fileIndex];
        const blob = new Blob(chunks as any, { type: fileMeta?.type || 'application/octet-stream' });
        
        if (!session.assembledBlobs) {
          session.assembledBlobs = {};
        }
        if (fileMeta) {
          session.assembledBlobs[fileMeta.id] = blob;
          if (blob.size < 50 * 1024 * 1024) {
            blob.arrayBuffer().then((buf) => {
              fileMeta.sha256 = computeCRC32(new Uint8Array(buf));
            });
          }
        }

        const allCompleted = session.files.every((f) => session.assembledBlobs && session.assembledBlobs[f.id]);
        if (allCompleted) {
          session.status = 'completed';
          session.completedAt = Date.now();
          session.speed = 0;
          session.eta = 0;
          this.events.onTransferComplete({ ...session });
        }
      }
    } catch (e) {
      console.error('[WebRTC] Error handling binary chunk:', e);
    }
  }

  private updateTransferMetrics(transferId: string) {
    const session = this.activeTransfers.get(transferId);
    const tracker = this.speedTrackers.get(transferId);
    if (!session || !tracker) return;

    const now = Date.now();
    const elapsedSec = (now - tracker.lastTime) / 1000;

    if (elapsedSec >= 0.4) {
      const bytesDiff = session.bytesTransferred - tracker.lastBytes;
      const instantSpeed = bytesDiff / elapsedSec;
      session.speed = session.speed === 0 ? instantSpeed : session.speed * 0.7 + instantSpeed * 0.3;
      
      const remainingBytes = Math.max(0, session.totalBytes - session.bytesTransferred);
      session.eta = session.speed > 0 ? remainingBytes / session.speed : 0;

      tracker.lastBytes = session.bytesTransferred;
      tracker.lastTime = now;

      this.events.onTransferProgress({ ...session });
    }
  }

  public cleanup() {
    for (const [, pc] of this.peerConnections) {
      pc.close();
    }
    this.peerConnections.clear();
    this.dataChannels.clear();
    this.activeTransfers.clear();
    this.peerTransports.clear();
    this.pendingCandidates.clear();
  }
}
