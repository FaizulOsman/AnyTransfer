import React from 'react';
import { 
  Zap, 
  Globe, 
  ShieldCheck, 
  HardDrive, 
  Radio, 
  Lock, 
  Server, 
  Cpu, 
  CheckCircle2,
  FileCheck,
  Activity,
  ArrowRight
} from 'lucide-react';

interface ArchitecturePageProps {
  onNavigateToRadar: () => void;
}

export const ArchitecturePage: React.FC<ArchitecturePageProps> = ({ onNavigateToRadar }) => {
  return (
    <div className="w-full max-w-4xl mx-auto space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs text-cyan-300 mb-2">
            <Cpu className="w-3.5 h-3.5 text-cyan-400" />
            <span>Technical Deep Dive & Security</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            How Any Transfer Works
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Zero-storage peer-to-peer file transmission powered by WebRTC SCTP, dual-transport failover, and hardware-accelerated checksums.
          </p>
        </div>

        <button
          type="button"
          onClick={onNavigateToRadar}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-xl transition-colors cursor-pointer shrink-0 shadow-md shadow-cyan-950/40"
        >
          <Radio className="w-3.5 h-3.5" />
          <span>Launch Radar</span>
        </button>
      </div>

      {/* Visual Pipeline Diagram */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 backdrop-blur-xl space-y-4">
        <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">
          Transmission Architecture Flow
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 relative">
          <div className="bg-slate-950/80 border border-cyan-500/30 rounded-2xl p-4 space-y-2">
            <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider block">Phase 1</span>
            <h4 className="text-sm font-semibold text-white">Signaling & Discovery</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Browsers connect to a lightweight signaling socket to exchange SDP session descriptions, ICE candidate candidates, and room pairings. No file payload is ever sent to signaling.
            </p>
          </div>

          <div className="bg-slate-950/80 border border-indigo-500/30 rounded-2xl p-4 space-y-2">
            <span className="text-[10px] font-mono text-indigo-400 uppercase tracking-wider block">Phase 2</span>
            <h4 className="text-sm font-semibold text-white">P2P SCTP DataChannel</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Devices establish a direct encrypted P2P data channel via STUN. If symmetric NAT restricts UDP hole punching, OpenRelay TURN or encrypted WebSocket relay automatically activates.
            </p>
          </div>

          <div className="bg-slate-950/80 border border-emerald-500/30 rounded-2xl p-4 space-y-2">
            <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-wider block">Phase 3</span>
            <h4 className="text-sm font-semibold text-white">Stream & Integrity Verification</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Files are sliced into 64 KB binary packets with backpressure management. The recipient streams directly to device memory buffers, verifying CRC32 checksums before saving.
            </p>
          </div>
        </div>
      </div>

      {/* 3 Core Capability Columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-slate-900/60 border border-slate-800/90 rounded-3xl p-5 sm:p-6 space-y-3">
          <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 border border-cyan-500/25 text-cyan-400 flex items-center justify-center">
            <Zap className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-white">Direct SCTP Streaming</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Chunked 64KB binary streams directly over native WebRTC data channels with backpressure control. Files never upload to any middleman server or cloud database.
          </p>
          <ul className="text-xs text-slate-300 space-y-1.5 pt-2 border-t border-slate-800/80">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span>Zero file size limits (GBs+)</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span>Full LAN gigabit wire speeds</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span>BufferedAmount backpressure flow</span>
            </li>
          </ul>
        </div>

        <div className="bg-slate-900/60 border border-slate-800/90 rounded-3xl p-5 sm:p-6 space-y-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/25 text-indigo-400 flex items-center justify-center">
            <Globe className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-white">Dual-Transport Engine</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Automatic STUN hole punching with global TURN fallback (<code className="text-indigo-300">openrelay.metered.ca</code>) and secondary encrypted WebSocket failover if UDP is blocked.
          </p>
          <ul className="text-xs text-slate-300 space-y-1.5 pt-2 border-t border-slate-800/80">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              <span>Cross-network cellular to Wi-Fi</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              <span>Symmetric NAT traversal</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              <span>100% connectivity reliability</span>
            </li>
          </ul>
        </div>

        <div className="bg-slate-900/60 border border-slate-800/90 rounded-3xl p-5 sm:p-6 space-y-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-white">Integrity & Zero-Storage</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            End-to-end DTLS cryptographic encryption ensures privacy in transit. Recipient must explicitly approve every transfer, and chunks are verified with CRC32 hashes.
          </p>
          <ul className="text-xs text-slate-300 space-y-1.5 pt-2 border-t border-slate-800/80">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>DTLS 1.2 / 1.3 encryption</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Manual approval prompt</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Zero server disk storage</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Protocol Specs Table */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-3">
        <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">
          Technical Specifications
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="py-2.5 pr-4 font-semibold">Parameter</th>
                <th className="py-2.5 pr-4 font-semibold">Specification</th>
                <th className="py-2.5 font-semibold">Benefit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              <tr>
                <td className="py-2.5 pr-4 font-mono text-cyan-400">Transport Protocol</td>
                <td className="py-2.5 pr-4">WebRTC RTCDataChannel (SCTP over DTLS)</td>
                <td className="py-2.5 text-slate-400">Low overhead, high throughput, end-to-end encrypted</td>
              </tr>
              <tr>
                <td className="py-2.5 pr-4 font-mono text-cyan-400">Chunk Size</td>
                <td className="py-2.5 pr-4">65,536 Bytes (64 KB)</td>
                <td className="py-2.5 text-slate-400">Optimal MTU packing without browser buffer overflow</td>
              </tr>
              <tr>
                <td className="py-2.5 pr-4 font-mono text-cyan-400">Backpressure Limit</td>
                <td className="py-2.5 pr-4">1,048,576 Bytes (1 MB)</td>
                <td className="py-2.5 text-slate-400">Prevents memory spikes on slower receiving devices</td>
              </tr>
              <tr>
                <td className="py-2.5 pr-4 font-mono text-cyan-400">Checksum Algorithm</td>
                <td className="py-2.5 pr-4">Table-driven CRC-32 (IEEE 802.3)</td>
                <td className="py-2.5 text-slate-400">Instant bit-level corruption detection with zero lag</td>
              </tr>
              <tr>
                <td className="py-2.5 pr-4 font-mono text-cyan-400">Relay Fallback</td>
                <td className="py-2.5 pr-4">Metered OpenRelay TURN + WSS Tunnel</td>
                <td className="py-2.5 text-slate-400">Guarantees delivery even on enterprise firewalls</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
