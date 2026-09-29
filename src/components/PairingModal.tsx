import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { 
  X, 
  QrCode, 
  KeyRound, 
  Copy, 
  Check, 
  ArrowRight, 
  Globe, 
  LogOut,
  Smartphone,
  ExternalLink
} from 'lucide-react';

interface PairingModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomId: string | null;
  onCreateRoom: () => void;
  onJoinRoom: (code: string) => void;
  onLeaveRoom: () => void;
}

export const PairingModal: React.FC<PairingModalProps> = ({
  isOpen,
  onClose,
  roomId,
  onCreateRoom,
  onJoinRoom,
  onLeaveRoom,
}) => {
  const [activeTab, setActiveTab] = useState<'create' | 'join'>('create');
  const [inputCode, setInputCode] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Generate QR code whenever roomId changes and canvas is available
  useEffect(() => {
    if (isOpen && roomId && canvasRef.current) {
      const shareUrl = `${window.location.origin}${window.location.pathname}?room=${roomId}`;
      QRCode.toCanvas(canvasRef.current, shareUrl, {
        width: 180,
        margin: 1.5,
        color: {
          dark: '#0f172a',
          light: '#ffffff',
        },
      }).catch((err) => {
        console.error('Error rendering QR code:', err);
      });
    }
  }, [isOpen, roomId, activeTab]);

  if (!isOpen) return null;

  const handleCopyCode = () => {
    if (!roomId) return;
    navigator.clipboard.writeText(roomId);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyUrl = () => {
    if (!roomId) return;
    const shareUrl = `${window.location.origin}${window.location.pathname}?room=${roomId}`;
    navigator.clipboard.writeText(shareUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const handleJoinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputCode.trim().length >= 4) {
      onJoinRoom(inputCode.trim());
      setInputCode('');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center border border-cyan-500/20">
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Cross-Network Pairing</h3>
            <p className="text-xs text-slate-400">Connect devices across different Wi-Fi networks or mobile data</p>
          </div>
        </div>

        {/* Mode Selector Tabs */}
        <div className="flex items-center gap-1 p-1 bg-slate-950 rounded-xl mb-6 border border-slate-800">
          <button
            type="button"
            onClick={() => setActiveTab('create')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
              activeTab === 'create'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <QrCode className="w-4 h-4" />
            <span>Share Room Code / QR</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('join')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
              activeTab === 'join'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <KeyRound className="w-4 h-4" />
            <span>Join Existing Code</span>
          </button>
        </div>

        {/* Tab 1: Share / Create Room */}
        {activeTab === 'create' && (
          <div className="space-y-5">
            {roomId ? (
              <div className="flex flex-col items-center space-y-4">
                {/* QR Code Canvas */}
                <div className="p-3 bg-white rounded-2xl shadow-inner border border-slate-300">
                  <canvas ref={canvasRef} className="block rounded-lg" />
                </div>

                {/* 6-Digit Room Code Display */}
                <div className="w-full flex items-center justify-between p-3 bg-slate-950 border border-slate-800 rounded-xl">
                  <div className="flex flex-col">
                    <span className="text-[11px] text-slate-400 font-medium">Transient Room Code</span>
                    <span className="font-mono text-2xl font-bold tracking-widest text-cyan-400">
                      {roomId}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyCode}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors cursor-pointer border border-slate-700"
                  >
                    {copiedCode ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedCode ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>

                {/* Instructions */}
                <p className="text-xs text-center text-slate-400 leading-relaxed">
                  Scan this QR code with a phone camera, or share the direct link to pair instantly from anywhere on the internet.
                </p>

                {/* Actions */}
                <div className="w-full flex gap-2">
                  <button
                    type="button"
                    onClick={handleCopyUrl}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-medium bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl transition-colors cursor-pointer shadow-sm"
                  >
                    {copiedUrl ? <Check className="w-4 h-4" /> : <ExternalLink className="w-4 h-4" />}
                    <span>{copiedUrl ? 'Link Copied!' : 'Copy Direct Link'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      onLeaveRoom();
                      onClose();
                    }}
                    className="flex items-center justify-center gap-1 py-2 px-3 text-xs font-medium text-rose-400 hover:bg-rose-950/40 border border-rose-900/40 rounded-xl transition-colors cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Leave</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-4 space-y-4">
                <div className="w-16 h-16 rounded-3xl bg-slate-950 border border-slate-800 text-cyan-400 flex items-center justify-center mx-auto shadow-inner">
                  <Smartphone className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-semibold text-slate-200">No Active Remote Room</h4>
                  <p className="text-xs text-slate-400 max-w-xs mx-auto">
                    Create a transient 6-digit room code to pair with phones, coworkers, or computers outside your local Wi-Fi.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onCreateRoom}
                  className="w-full py-2.5 px-4 text-xs font-medium bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl transition-colors cursor-pointer shadow-md shadow-cyan-950/40 font-semibold"
                >
                  Generate 6-Digit Room & QR
                </button>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Join Existing Code */}
        {activeTab === 'join' && (
          <form onSubmit={handleJoinSubmit} className="space-y-5">
            <div className="space-y-2">
              <label htmlFor="room-code-input" className="text-xs font-medium text-slate-300">
                Enter 6-Digit Code
              </label>
              <input
                id="room-code-input"
                type="text"
                maxLength={8}
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                placeholder="e.g. 592810"
                className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl font-mono text-center text-xl tracking-widest text-cyan-300 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500"
                autoFocus
              />
              <p className="text-[11px] text-slate-400">
                Ask the sender for their 6-digit room code, or scan their QR code on your mobile device.
              </p>
            </div>

            <button
              type="submit"
              disabled={inputCode.trim().length < 4}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 text-xs font-medium bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 disabled:pointer-events-none text-white rounded-xl transition-colors cursor-pointer shadow-md"
            >
              <span>Join Room</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
