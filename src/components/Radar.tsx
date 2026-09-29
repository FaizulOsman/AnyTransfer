import React, { useRef, useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { DeviceNode } from './DeviceNode';
import { PeerDevice } from '../types/transfer';
import { QrCode, Wifi, Globe, Copy, Check, Sparkles } from 'lucide-react';

interface RadarProps {
  selfDevice: PeerDevice;
  peers: PeerDevice[];
  roomId: string | null;
  onSelectFilesForPeer: (peer: PeerDevice, files: File[]) => void;
  onOpenPairingModal: () => void;
}

export const Radar: React.FC<RadarProps> = ({
  selfDevice,
  peers,
  roomId,
  onSelectFilesForPeer,
  onOpenPairingModal,
}) => {
  const [copied, setCopied] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 600, height: 600 });

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  const handleCopyLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Adaptive orbital calculation based on actual container size
  const calculatePeerPosition = (index: number, total: number) => {
    const isMobile = dimensions.width < 520;
    // Keep peers safely inside the radar boundary
    const maxRadiusX = Math.max(90, dimensions.width / 2 - 75);
    const maxRadiusY = Math.max(85, dimensions.height / 2 - 85);

    let baseRadius = isMobile 
      ? Math.min(maxRadiusX, total <= 2 ? 110 : 130)
      : Math.min(maxRadiusX, total <= 4 ? 175 : total <= 8 ? 215 : 255);

    // Spread angles evenly starting from top-right
    const angle = (index * (2 * Math.PI)) / total - Math.PI / 2;
    const x = Math.round(baseRadius * Math.cos(angle));
    const y = Math.round(Math.min(maxRadiusY, baseRadius * (isMobile ? 0.95 : 0.85)) * Math.sin(angle));
    return { x, y };
  };

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-[460px] sm:h-[540px] md:h-[620px] flex items-center justify-center select-none overflow-hidden rounded-3xl bg-slate-950/70 border border-slate-800/80 shadow-2xl backdrop-blur-xl"
    >
      {/* Decorative Grid Mesh */}
      <div 
        className="absolute inset-0 opacity-15 pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgba(56, 189, 248, 0.25) 1px, transparent 0)`,
          backgroundSize: '32px 32px',
        }}
      />

      {/* Concentric Radar Rings (Responsive sizes) */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {/* Ring 1 */}
        <div className="w-[140px] sm:w-[180px] h-[140px] sm:h-[180px] rounded-full border border-cyan-500/20" />
        {/* Ring 2 */}
        <div className="absolute w-[240px] sm:w-[320px] h-[240px] sm:h-[320px] rounded-full border border-cyan-500/15" />
        {/* Ring 3 */}
        <div className="absolute w-[340px] sm:w-[460px] h-[340px] sm:h-[460px] rounded-full border border-slate-700/35" />
        {/* Ring 4 */}
        <div className="absolute w-[440px] sm:w-[600px] h-[440px] sm:h-[600px] rounded-full border border-slate-800/25" />

        {/* Dynamic Sweeping Radar Beam */}
        <div 
          className="absolute w-[440px] sm:w-[600px] h-[440px] sm:h-[600px] rounded-full overflow-hidden opacity-30"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 8, ease: 'linear' }}
            className="w-full h-full"
            style={{
              background: 'conic-gradient(from 0deg, rgba(6, 182, 212, 0.35) 0deg, rgba(6, 182, 212, 0) 60deg, transparent 360deg)',
            }}
          />
        </div>

        {/* Pulse Waves */}
        <motion.div
          animate={{ scale: [1, 2.5], opacity: [0.3, 0] }}
          transition={{ repeat: Infinity, duration: 4, ease: 'easeOut' }}
          className="absolute w-[160px] sm:w-[200px] h-[160px] sm:h-[200px] rounded-full border border-cyan-400/30"
        />
        <motion.div
          animate={{ scale: [1, 2.5], opacity: [0.3, 0] }}
          transition={{ repeat: Infinity, duration: 4, delay: 2, ease: 'easeOut' }}
          className="absolute w-[160px] sm:w-[200px] h-[160px] sm:h-[200px] rounded-full border border-cyan-400/25"
        />
      </div>

      {/* Center Node (Current Device - Locked to Exact Geometric Center of Radar Rings) */}
      <div className="absolute z-20 flex items-center justify-center">
        <DeviceNode
          peer={selfDevice}
          isSelf={true}
          onSelectFiles={() => {}}
        />
      </div>

      {/* Discovered Peers */}
      {peers.map((peer, idx) => {
        const { x, y } = calculatePeerPosition(idx, peers.length);
        return (
          <motion.div
            key={peer.id}
            initial={{ opacity: 0, scale: 0.5, x: 0, y: 0 }}
            animate={{ opacity: 1, scale: 1, x, y }}
            exit={{ opacity: 0, scale: 0.5 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
            className="absolute z-30 flex items-center justify-center"
          >
            <DeviceNode
              peer={peer}
              onSelectFiles={onSelectFilesForPeer}
            />
          </motion.div>
        );
      })}

      {/* Empty State Banner if no peers discovered yet */}
      {peers.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="absolute bottom-4 sm:bottom-6 z-20 flex flex-col items-center max-w-sm sm:max-w-md px-3 text-center"
        >
          <div className="bg-slate-900/95 border border-slate-800 rounded-2xl p-3 sm:p-4 shadow-xl backdrop-blur-md">
            <div className="flex items-center justify-center gap-2 text-xs font-medium text-slate-200 mb-1">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              <span className="truncate">
                {roomId 
                  ? `In Room #${roomId} · Waiting for peer`
                  : 'Scanning local Wi-Fi & subnet for peers...'}
              </span>
            </div>
            
            <p className="text-[11px] sm:text-xs text-slate-400 mb-2.5 leading-relaxed">
              Open AetherDrop on another device to auto-discover, or pair across separate networks via code.
            </p>

            <div className="flex items-center justify-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={onOpenPairingModal}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-xl transition-colors cursor-pointer shadow-sm shadow-cyan-950/40"
              >
                <QrCode className="w-3.5 h-3.5" />
                <span>Pair via Code / QR</span>
              </button>

              <button
                type="button"
                onClick={handleCopyLink}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800/90 hover:bg-slate-750 border border-slate-700/80 rounded-xl transition-colors cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Share Link'}</span>
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Network Mode Indicator Pill in Top-Left Corner */}
      <div className="absolute top-3.5 left-3.5 sm:top-4 sm:left-4 z-20 flex items-center gap-1.5 bg-slate-900/85 border border-slate-800/90 rounded-xl px-2.5 py-1 text-[11px] sm:text-xs text-slate-300 backdrop-blur-md shadow-sm">
        {roomId ? (
          <>
            <Globe className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <span className="font-mono text-indigo-200">Room #{roomId}</span>
          </>
        ) : (
          <>
            <Wifi className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span>Local Radar</span>
          </>
        )}
      </div>

      {/* Discovered Peers Count Badge in Top-Right Corner */}
      <div className="absolute top-3.5 right-3.5 sm:top-4 sm:right-4 z-20 flex items-center gap-1.5 bg-slate-900/85 border border-slate-800/90 rounded-xl px-2.5 py-1 text-[11px] sm:text-xs text-slate-300 backdrop-blur-md shadow-sm">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <span>{peers.length} {peers.length === 1 ? 'Peer' : 'Peers'} Online</span>
      </div>
    </div>
  );
};
