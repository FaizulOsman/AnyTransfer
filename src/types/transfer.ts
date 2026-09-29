export type DeviceType = 'desktop' | 'laptop' | 'mobile' | 'tablet' | 'unknown';

export interface PeerDevice {
  id: string;
  name: string;
  modelName?: string;
  avatar?: string;
  deviceType: DeviceType;
  os: string;
  browser: string;
  ipSubnet?: string;
  roomId?: string;
  isSelf?: boolean;
  status: 'available' | 'connecting' | 'connected' | 'busy';
  pairedAt?: number;
}

export interface FileMetadata {
  id: string;
  name: string;
  size: number;
  type: string;
  lastModified?: number;
  totalChunks: number;
  chunkSize: number;
  sha256?: string;
}

export type TransferDirection = 'upload' | 'download';
export type TransferStatus = 
  | 'pending_approval' 
  | 'connecting' 
  | 'transferring' 
  | 'paused' 
  | 'completed' 
  | 'cancelled' 
  | 'failed';

export interface TransferSession {
  id: string;
  peerId: string;
  peerName: string;
  direction: TransferDirection;
  files: FileMetadata[];
  currentFileIndex: number;
  status: TransferStatus;
  bytesTransferred: number;
  totalBytes: number;
  speed: number; // bytes per second
  eta: number; // seconds remaining
  startedAt: number;
  completedAt?: number;
  error?: string;
  assembledBlobs?: { [fileId: string]: Blob };
  transport?: 'webrtc' | 'relay';
  _rawFiles?: File[];
}

export interface SignalingMessage {
  type: 
    | 'join'
    | 'welcome'
    | 'peer_list'
    | 'peer_joined'
    | 'peer_left'
    | 'create_room'
    | 'room_created'
    | 'join_room'
    | 'room_joined'
    | 'leave_room'
    | 'room_error'
    | 'signal'
    | 'ping'
    | 'pong';
  peerId?: string;
  from?: string;
  to?: string;
  data?: any;
  room?: string;
  device?: Partial<PeerDevice>;
  peers?: PeerDevice[];
}

export interface RTCControlMessage {
  type: 
    | 'transfer_request'
    | 'transfer_accept'
    | 'transfer_reject'
    | 'transfer_cancel'
    | 'transfer_pause'
    | 'transfer_resume'
    | 'file_start'
    | 'file_complete'
    | 'batch_complete';
  transferId: string;
  files?: FileMetadata[];
  fileId?: string;
  fileIndex?: number;
  reason?: string;
  checksum?: string;
}

export interface IceServerConfig {
  urls: string | string[];
  username?: string;
  credential?: string;
}
