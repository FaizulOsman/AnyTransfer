import React from 'react';
import { Radar } from '../components/Radar';
import { PeerDevice } from '../types/transfer';
import { HardDrive, Radio, QrCode, Sparkles, Send } from 'lucide-react';
import { AvatarImage } from '../components/AvatarImage';

interface ConnectPageProps {
  selfDevice: PeerDevice;
  peers: PeerDevice[];
  roomId: string | null;
  isConnected: boolean;
  isDraggingOverScreen: boolean;
  onSelectFilesForPeer: (peer: PeerDevice, files: File[]) => void;
  onNavigateToPairing: () => void;
  onNavigateToTransfers: () => void;
}

export const ConnectPage: React.FC<ConnectPageProps> = ({
  selfDevice,
  peers,
  roomId,
  isConnected,
  isDraggingOverScreen,
  onSelectFilesForPeer,
  onNavigateToPairing,
  onNavigateToTransfers,
}) => {
  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col items-center animate-in fade-in duration-200">
      {/* Editorial Header - Streamlined & Focused */}
      <div className="w-full flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4 px-1">
        <div className="flex items-start sm:items-center gap-2.5 min-w-0 flex-1">
          <div className="w-9 h-9 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0 mt-0.5 sm:mt-0">
            <Radio className="w-4 h-4 animate-pulse" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                Connection Radar
              </h2>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-950/70 border border-emerald-800/60 text-emerald-400 shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live P2P
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed mt-0.5">
              Tap a peer to send files, or drop files directly onto the radar.
            </p>
          </div>
        </div>

        {/* Quick Room / Pairing Indicator */}
        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0 pl-11 sm:pl-0">
          <button
            type="button"
            onClick={onNavigateToPairing}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/40 rounded-xl transition-all cursor-pointer shadow-sm"
          >
            <QrCode className="w-3.5 h-3.5 text-cyan-400" />
            <span>{roomId ? `Room #${roomId}` : 'Pair Code / QR'}</span>
          </button>
        </div>
      </div>

      {/* Central Radar Connection Canvas */}
      <div className="w-full relative">
        <Radar
          selfDevice={selfDevice}
          peers={peers}
          roomId={roomId}
          onSelectFilesForPeer={onSelectFilesForPeer}
          onOpenPairingModal={onNavigateToPairing}
        />

        {/* Full Radar Drag-and-Drop Active Overlay */}
        {isDraggingOverScreen && (
          <div className="absolute inset-0 z-50 bg-cyan-950/90 border-2 border-dashed border-cyan-400 rounded-3xl flex flex-col items-center justify-center backdrop-blur-md animate-in fade-in duration-150 p-4 text-center">
            <div className="w-16 h-16 rounded-2xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center mb-3">
              <HardDrive className="w-8 h-8 text-cyan-300 animate-bounce" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-white mb-1">
              Drop Files to Transfer
            </h3>
            <p className="text-xs sm:text-sm text-cyan-200 max-w-sm">
              Release anywhere to transmit immediately over WebRTC DataChannel to connected peers
            </p>
          </div>
        )}
      </div>

      {/* Ambient Quick Instructions & Peer Summary Banner */}
      <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-3 mt-4 px-2 py-2 rounded-2xl bg-slate-900/60 border border-slate-800/80 text-xs text-slate-400 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-slate-800 flex items-center justify-center text-cyan-400 shrink-0">
            <Sparkles className="w-3 h-3" />
          </div>
          <span>
            {peers.length > 0
              ? `Select any nearby device on the radar to stream unlimited size files.`
              : `Waiting for nearby peers to open AetherDrop on your Wi-Fi or cellular network.`}
          </span>
        </div>

        <button
          type="button"
          onClick={onNavigateToTransfers}
          className="text-xs text-cyan-400 hover:text-cyan-300 font-medium transition-colors cursor-pointer shrink-0"
        >
          View Transfer Activity →
        </button>
      </div>
    </div>
  );
};
