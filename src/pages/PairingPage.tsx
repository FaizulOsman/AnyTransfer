import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { 
  Globe, 
  QrCode, 
  Copy, 
  Check, 
  LogOut, 
  Smartphone, 
  Laptop, 
  KeyRound, 
  ArrowRight,
  ShieldCheck,
  Share2,
  Users
} from 'lucide-react';
import { PeerDevice } from '../types/transfer';

interface PairingPageProps {
  roomId: string | null;
  peers: PeerDevice[];
  onCreateRoom: () => void;
  onJoinRoom: (code: string) => void;
  onLeaveRoom: () => void;
  onNavigateToRadar: () => void;
}

export const PairingPage: React.FC<PairingPageProps> = ({
  roomId,
  peers,
  onCreateRoom,
  onJoinRoom,
  onLeaveRoom,
  onNavigateToRadar,
}) => {
  const [inputCode, setInputCode] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Render QR code whenever roomId changes and canvas is available
  useEffect(() => {
    if (roomId && canvasRef.current) {
      const shareUrl = `${window.location.origin}${window.location.pathname}?room=${roomId}`;
      QRCode.toCanvas(canvasRef.current, shareUrl, {
        width: 190,
        margin: 1.5,
        color: {
          dark: '#020617',
          light: '#ffffff',
        },
      }).catch((err) => {
        console.error('Error rendering QR code:', err);
      });
    }
  }, [roomId]);

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
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Cross-Network Pairing
            </h1>
            {roomId && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-mono font-medium bg-indigo-950 border border-indigo-800/70 text-indigo-300">
                <Globe className="w-3 h-3 text-indigo-400" />
                <span>Room #{roomId}</span>
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Connect devices across separate Wi-Fi, cellular 5G/LTE networks, or VPNs using a transient 6-digit room code or QR code.
          </p>
        </div>

        <button
          type="button"
          onClick={onNavigateToRadar}
          className="px-3.5 py-2 text-xs font-semibold text-slate-200 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl transition-colors cursor-pointer shrink-0"
        >
          ← Back to Radar
        </button>
      </div>

      {/* Main Grid: Create / Active Room vs Join Room */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: Your Room (Host / Share) */}
        <div className="bg-slate-900/70 border border-slate-800/90 rounded-3xl p-5 sm:p-6 backdrop-blur-xl flex flex-col justify-between space-y-5">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-indigo-500/10 border border-indigo-500/25 flex items-center justify-center text-indigo-400">
                  <Globe className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">Your Remote Room</h3>
                  <p className="text-xs text-slate-400">Invite any phone, tablet, or PC to join</p>
                </div>
              </div>

              {roomId && (
                <button
                  type="button"
                  onClick={onLeaveRoom}
                  className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-rose-400 hover:text-rose-300 bg-rose-950/40 hover:bg-rose-950/70 border border-rose-900/60 rounded-xl transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Leave</span>
                </button>
              )}
            </div>

            {roomId ? (
              <div className="space-y-4">
                {/* 6-Digit Display */}
                <div className="bg-slate-950 border border-slate-800/90 rounded-2xl p-4 text-center">
                  <span className="text-xs text-slate-400 uppercase tracking-widest font-semibold block mb-1">
                    Room Code
                  </span>
                  <div className="flex items-center justify-center gap-2">
                    <span className="font-mono text-3xl sm:text-4xl font-extrabold tracking-widest text-indigo-300">
                      {roomId}
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyCode}
                      title="Copy code"
                      className="p-2 text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl transition-colors cursor-pointer"
                    >
                      {copiedCode ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* QR Code Canvas */}
                <div className="flex flex-col items-center justify-center bg-slate-950/80 border border-slate-800/80 rounded-2xl p-4">
                  <canvas ref={canvasRef} className="rounded-xl shadow-lg mb-2" />
                  <span className="text-[11px] text-slate-400 text-center">
                    Scan with any phone camera to connect immediately
                  </span>
                </div>

                {/* Share Link Button */}
                <button
                  type="button"
                  onClick={handleCopyUrl}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 text-xs font-semibold text-slate-200 hover:text-white bg-slate-800 hover:bg-slate-750 border border-slate-700/80 rounded-xl transition-colors cursor-pointer"
                >
                  {copiedUrl ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
                  <span>{copiedUrl ? 'Copied Direct Link!' : 'Copy Direct Share Link'}</span>
                </button>
              </div>
            ) : (
              <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-6 text-center space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto">
                  <QrCode className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white mb-1">No Active Room</h4>
                  <p className="text-xs text-slate-400 leading-relaxed max-w-xs mx-auto">
                    Generate an instant 6-digit room code with a QR code to securely link devices located on separate networks.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onCreateRoom}
                  className="w-full py-2.5 px-4 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-xl transition-colors cursor-pointer shadow-md shadow-cyan-950/50"
                >
                  Create 6-Digit Room Code
                </button>
              </div>
            )}
          </div>

          {/* Active Peers in this Room */}
          {roomId && (
            <div className="border-t border-slate-800/80 pt-4">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                <span className="flex items-center gap-1.5 font-medium text-slate-300">
                  <Users className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Peers in Room #{roomId} ({peers.length})</span>
                </span>
                <span className="text-[11px] text-emerald-400">Live</span>
              </div>
              {peers.length > 0 ? (
                <div className="space-y-1.5">
                  {peers.map((p) => (
                    <div 
                      key={p.id}
                      className="flex items-center justify-between p-2 rounded-xl bg-slate-950 border border-slate-800/80 text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="font-semibold text-slate-200">{p.name}</span>
                      </div>
                      <span className="text-[11px] text-slate-400">{p.os}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic py-1">
                  Waiting for another device to enter this code...
                </p>
              )}
            </div>
          )}
        </div>

        {/* Card 2: Join an Existing Room */}
        <div className="bg-slate-900/70 border border-slate-800/90 rounded-3xl p-5 sm:p-6 backdrop-blur-xl flex flex-col justify-between space-y-5">
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-cyan-500/10 border border-cyan-500/25 flex items-center justify-center text-cyan-400">
                <KeyRound className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">Join a Peer's Room</h3>
                <p className="text-xs text-slate-400">Enter the 6-digit code shown on the other device</p>
              </div>
            </div>

            <form onSubmit={handleJoinSubmit} className="space-y-3">
              <div>
                <label htmlFor="room-code-input" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  6-Digit Room Code
                </label>
                <input
                  id="room-code-input"
                  type="text"
                  maxLength={6}
                  value={inputCode}
                  onChange={(e) => setInputCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="e.g. 583921"
                  className="w-full text-center tracking-widest font-mono text-2xl px-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
                />
              </div>

              <button
                type="submit"
                disabled={inputCode.trim().length < 4}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 disabled:opacity-50 disabled:cursor-not-allowed rounded-2xl transition-colors cursor-pointer shadow-md shadow-cyan-950/50"
              >
                <span>Join Remote Room</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>

          {/* Cross-Network Guidance Box */}
          <div className="bg-slate-950/80 border border-slate-800/80 rounded-2xl p-4 text-xs text-slate-400 space-y-2.5">
            <div className="flex items-center gap-2 text-slate-200 font-semibold">
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
              <span>How Cross-Network Pairing Works</span>
            </div>
            <p className="leading-relaxed">
              When devices are on different networks (e.g. mobile cellular data vs. home Wi-Fi), our STUN and TURN relays negotiate a direct encrypted WebRTC channel between both browsers.
            </p>
            <div className="flex items-center gap-4 text-[11px] text-slate-400 pt-1">
              <div className="flex items-center gap-1">
                <Smartphone className="w-3.5 h-3.5 text-cyan-400" />
                <span>Mobile (Cellular)</span>
              </div>
              <span className="text-slate-600">⇄</span>
              <div className="flex items-center gap-1">
                <Laptop className="w-3.5 h-3.5 text-indigo-400" />
                <span>Desktop (Wi-Fi)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
