import React, { useRef, useState } from 'react';
import { motion } from 'motion/react';
import { 
  Laptop, 
  Smartphone, 
  Tablet, 
  Monitor, 
  HelpCircle, 
  Send,
  Loader2,
  Globe
} from 'lucide-react';
import { DeviceType, PeerDevice } from '../types/transfer';
import { AvatarImage } from './AvatarImage';

interface DeviceNodeProps {
  peer: PeerDevice;
  onSelectFiles: (peer: PeerDevice, files: File[]) => void;
  isSelf?: boolean;
}

export const DeviceNode: React.FC<DeviceNodeProps> = ({
  peer,
  onSelectFiles,
  isSelf = false,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const getDeviceIcon = (type: DeviceType) => {
    switch (type) {
      case 'mobile':
        return <Smartphone className="w-3.5 h-3.5" />;
      case 'tablet':
        return <Tablet className="w-3.5 h-3.5" />;
      case 'laptop':
        return <Laptop className="w-3.5 h-3.5" />;
      case 'desktop':
        return <Monitor className="w-3.5 h-3.5" />;
      default:
        return <HelpCircle className="w-3.5 h-3.5" />;
    }
  };

  const handleNodeClick = () => {
    if (isSelf) return;
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArray = Array.from(e.target.files);
      onSelectFiles(peer, filesArray);
      e.target.value = '';
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    if (isSelf) return;
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    if (isSelf) return;
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    if (isSelf) return;
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const filesArray = Array.from(e.dataTransfer.files);
      onSelectFiles(peer, filesArray);
    }
  };

  const displayName = peer.name || peer.modelName || 'Device';
  const creatureAvatar = peer.avatar || 'wolf';

  return (
    <div className="relative group">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        multiple
        className="hidden"
      />

      <motion.button
        type="button"
        whileHover={{ scale: isSelf ? 1.02 : 1.07 }}
        whileTap={{ scale: isSelf ? 1 : 0.95 }}
        onClick={handleNodeClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative flex items-center justify-center rounded-full transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 select-none ${
          isSelf ? 'cursor-default' : 'cursor-pointer'
        }`}
      >
        {/* Remote room pairing pill */}
        {peer.roomId && (
          <div 
            title={`Remote room #${peer.roomId}`}
            className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-600/90 text-indigo-100 text-[10px] font-mono px-2 py-0.5 rounded-full flex items-center gap-1 shadow-md border border-indigo-400/30 z-20 whitespace-nowrap"
          >
            <Globe className="w-2.5 h-2.5" />
            <span>#{peer.roomId}</span>
          </div>
        )}

        {/* Central Luminous Avatar Orb (Exact Geometric Center) */}
        <div className="relative flex items-center justify-center">
          {/* Ambient Radial Soft Glow */}
          <div 
            className={`absolute -inset-2 rounded-full transition-all duration-300 blur-md ${
              isDragOver
                ? 'bg-cyan-400/60 scale-125'
                : isSelf
                ? 'bg-cyan-500/25 group-hover:bg-cyan-400/35'
                : 'bg-cyan-500/15 group-hover:bg-cyan-400/35'
            }`} 
          />

          {/* Radar ripple rings around current device */}
          {isSelf && (
            <span className="absolute -inset-2.5 rounded-full border border-cyan-400/35 animate-ping pointer-events-none" />
          )}

          {/* Sleek Floating Circular Orb */}
          <div
            className={`relative w-16 h-16 sm:w-18 sm:h-18 rounded-full flex items-center justify-center transition-all duration-300 backdrop-blur-xl border ${
              isDragOver
                ? 'bg-cyan-500/30 border-cyan-300 scale-110 shadow-2xl ring-4 ring-cyan-400/40'
                : isSelf
                ? 'bg-gradient-to-b from-slate-900/95 via-slate-900/90 to-slate-950/95 border-cyan-400/50 shadow-xl shadow-cyan-950/50 ring-2 ring-cyan-500/20'
                : 'bg-gradient-to-b from-slate-850/95 via-slate-900/90 to-slate-950/95 group-hover:from-slate-800/95 group-hover:to-slate-900/95 border-slate-700/70 group-hover:border-cyan-400/60 shadow-xl shadow-slate-950/60 group-hover:shadow-cyan-950/40'
            }`}
          >
            {peer.status === 'connecting' ? (
              <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
            ) : isDragOver ? (
              <Send className="w-8 h-8 animate-bounce text-cyan-300" />
            ) : (
              <AvatarImage 
                avatar={creatureAvatar} 
                name={displayName} 
                className="w-11 h-11 sm:w-12 sm:h-12 drop-shadow-[0_2px_8px_rgba(6,182,212,0.35)]" 
              />
            )}
          </div>
        </div>

        {/* Clean, Simple Typography (Positioned below without offsetting the orb center) */}
        <div className="absolute top-[calc(100%+8px)] left-1/2 -translate-x-1/2 flex flex-col items-center w-max max-w-[140px] sm:max-w-[160px] pointer-events-auto">
          {/* Main Title Row */}
          <div className="flex items-center gap-1.5 justify-center w-full">
            <span 
              className="text-xs font-semibold text-slate-100 truncate text-center tracking-tight group-hover:text-white transition-colors drop-shadow-sm"
              title={displayName}
            >
              {displayName}
            </span>
            {isSelf && (
              <span className="text-[10px] font-semibold text-cyan-400 bg-cyan-950/80 border border-cyan-800/60 px-1.5 py-0.2 rounded-full shrink-0 shadow-sm">
                You
              </span>
            )}
          </div>

          {/* Clean Subtitle: Form-Factor Icon + OS Name */}
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-0.5 truncate max-w-full">
            <span className="text-slate-400 group-hover:text-cyan-400 transition-colors shrink-0">
              {getDeviceIcon(peer.deviceType)}
            </span>
            <span className="truncate">{peer.os}</span>
          </div>

          {/* Action Hint on Hover */}
          {!isSelf && (
            <span className="text-[10px] font-medium text-cyan-400 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
              Click to share
            </span>
          )}
        </div>
      </motion.button>
    </div>
  );
};
