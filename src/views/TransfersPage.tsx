import React from 'react';
import { TransferSession } from '../types/transfer';
import { formatBytes, formatEta, formatSpeed } from '../utils/device';
import { 
  ArrowUpRight, 
  ArrowDownLeft, 
  Pause, 
  Play, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  Download, 
  FileCheck, 
  Clock, 
  RotateCcw,
  Zap,
  Globe,
  Radio,
  HardDrive,
  Activity,
  Layers,
  File
} from 'lucide-react';

interface TransfersPageProps {
  transfers: TransferSession[];
  onTogglePause: (transferId: string) => void;
  onCancel: (transferId: string) => void;
  onSaveFile: (transferId: string, fileId: string) => void;
  onRetry: (transferId: string) => void;
  onNavigateToRadar: () => void;
}

export const TransfersPage: React.FC<TransfersPageProps> = ({
  transfers,
  onTogglePause,
  onCancel,
  onSaveFile,
  onRetry,
  onNavigateToRadar,
}) => {
  const activeTransfers = transfers.filter(
    (t) => t.status === 'transferring' || t.status === 'paused' || t.status === 'connecting' || t.status === 'pending_approval'
  );

  const completedTransfers = transfers.filter((t) => t.status === 'completed');
  const failedTransfers = transfers.filter((t) => t.status === 'failed' || t.status === 'cancelled');

  const totalBytesTransferred = transfers.reduce((acc, t) => acc + (t.bytesTransferred || 0), 0);

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Transfers & Activity
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Real-time SCTP DataChannel transmission monitoring, throughput metrics, and file downloads.
          </p>
        </div>

        <button
          type="button"
          onClick={onNavigateToRadar}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-xl transition-colors cursor-pointer shrink-0 shadow-md shadow-cyan-950/40"
        >
          <Radio className="w-3.5 h-3.5" />
          <span>Go to Radar</span>
        </button>
      </div>

      {/* Metrics Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-4">
          <span className="text-[11px] text-slate-400 font-medium uppercase tracking-wider block mb-1">
            Active Now
          </span>
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-cyan-400" />
            <span className="text-xl font-bold text-white">{activeTransfers.length}</span>
          </div>
        </div>

        <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-4">
          <span className="text-[11px] text-slate-400 font-medium uppercase tracking-wider block mb-1">
            Completed
          </span>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span className="text-xl font-bold text-white">{completedTransfers.length}</span>
          </div>
        </div>

        <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-4">
          <span className="text-[11px] text-slate-400 font-medium uppercase tracking-wider block mb-1">
            Total Transferred
          </span>
          <div className="flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-indigo-400" />
            <span className="text-xl font-bold text-white truncate">{formatBytes(totalBytesTransferred)}</span>
          </div>
        </div>

        <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-4">
          <span className="text-[11px] text-slate-400 font-medium uppercase tracking-wider block mb-1">
            Total Sessions
          </span>
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-amber-400" />
            <span className="text-xl font-bold text-white">{transfers.length}</span>
          </div>
        </div>
      </div>

      {/* Active In-Flight Transfers */}
      {activeTransfers.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-cyan-300 uppercase tracking-wider flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span>Active Transfers ({activeTransfers.length})</span>
          </h2>

          <div className="space-y-3">
            {activeTransfers.map((tx) => {
              const progressPct = tx.totalBytes > 0 
                ? Math.min(100, Math.round((tx.bytesTransferred / tx.totalBytes) * 100)) 
                : 0;
              const isUpload = tx.direction === 'upload';

              return (
                <div 
                  key={tx.id}
                  className="bg-slate-900/90 border border-slate-800/90 rounded-2xl p-4 space-y-3 shadow-xl backdrop-blur-xl"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                        isUpload ? 'bg-cyan-500/10 text-cyan-400' : 'bg-emerald-500/10 text-emerald-400'
                      }`}>
                        {isUpload ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownLeft className="w-4 h-4" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-white">
                            {isUpload ? `Sending to ${tx.peerName}` : `Receiving from ${tx.peerName}`}
                          </span>
                          {tx.transport && (
                            <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono flex items-center gap-1 ${
                              tx.transport === 'webrtc' 
                                ? 'bg-cyan-950 text-cyan-300 border border-cyan-800/60' 
                                : 'bg-indigo-950 text-indigo-300 border border-indigo-800/60'
                            }`}>
                              {tx.transport === 'webrtc' ? <Zap className="w-2.5 h-2.5" /> : <Globe className="w-2.5 h-2.5" />}
                              <span>{tx.transport === 'webrtc' ? 'P2P WebRTC' : 'WebSocket Relay'}</span>
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-slate-400">
                          {tx.files.length} {tx.files.length === 1 ? 'file' : 'files'} · {formatBytes(tx.totalBytes)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-bold text-cyan-400">{progressPct}%</span>
                      <button
                        type="button"
                        onClick={() => onTogglePause(tx.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-750 transition-colors cursor-pointer"
                        title={tx.status === 'paused' ? 'Resume' : 'Pause'}
                      >
                        {tx.status === 'paused' ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
                      </button>
                      <button
                        type="button"
                        onClick={() => onCancel(tx.id)}
                        className="p-1.5 rounded-lg text-rose-400 hover:text-rose-300 bg-rose-950/40 hover:bg-rose-950/70 border border-rose-900/50 transition-colors cursor-pointer"
                        title="Cancel"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                    <div 
                      className={`h-full transition-all duration-300 ${
                        tx.status === 'paused' ? 'bg-amber-400' : 'bg-gradient-to-r from-cyan-500 to-emerald-400'
                      }`}
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>

                  {/* Speed & ETA */}
                  <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                    <span>{formatBytes(tx.bytesTransferred)} / {formatBytes(tx.totalBytes)}</span>
                    <div className="flex items-center gap-3">
                      {tx.speed > 0 && <span className="text-cyan-300">{formatSpeed(tx.speed)}</span>}
                      {tx.eta > 0 && (
                        <span className="flex items-center gap-1 text-slate-400">
                          <Clock className="w-3 h-3" />
                          <span>{formatEta(tx.eta)}</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Completed Transfers */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>Completed Files ({completedTransfers.length})</span>
        </h2>

        {completedTransfers.length > 0 ? (
          <div className="space-y-2">
            {completedTransfers.map((tx) => {
              const isUpload = tx.direction === 'upload';
              return (
                <div 
                  key={tx.id}
                  className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-3.5 sm:p-4 space-y-2"
                >
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <div className="flex items-center gap-1.5 font-medium text-slate-200">
                      {isUpload ? (
                        <ArrowUpRight className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      ) : (
                        <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      )}
                      <span>{isUpload ? `Sent to ${tx.peerName}` : `Received from ${tx.peerName}`}</span>
                    </div>
                    <span>{tx.completedAt ? new Date(tx.completedAt).toLocaleTimeString() : 'Complete'}</span>
                  </div>

                  {/* File List */}
                  <div className="space-y-1.5">
                    {tx.files.map((file) => (
                      <div 
                        key={file.id}
                        className="flex items-center justify-between p-2 rounded-xl bg-slate-950/80 border border-slate-800/70 text-xs"
                      >
                        <div className="flex items-center gap-2 min-w-0 pr-2">
                          <File className="w-4 h-4 text-cyan-400 shrink-0" />
                          <span className="font-medium text-slate-200 truncate">{file.name}</span>
                          <span className="text-[11px] text-slate-400 font-mono shrink-0">({formatBytes(file.size)})</span>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {file.sha256 && (
                            <span 
                              title={`Integrity Verified (CRC: ${file.sha256})`}
                              className="hidden sm:flex items-center gap-1 text-[10px] text-emerald-400 font-mono bg-emerald-950/60 border border-emerald-800/60 px-1.5 py-0.5 rounded-md"
                            >
                              <FileCheck className="w-3 h-3" />
                              <span>Verified</span>
                            </span>
                          )}

                          {!isUpload && (
                            <button
                              type="button"
                              onClick={() => onSaveFile(tx.id, file.id)}
                              className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-white bg-cyan-600 hover:bg-cyan-500 rounded-lg transition-colors cursor-pointer shadow-sm"
                            >
                              <Download className="w-3 h-3" />
                              <span>Save File</span>
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-slate-900/40 border border-slate-800/60 rounded-2xl p-8 text-center text-xs text-slate-500">
            No completed file transfers yet. Tap a device on the Radar to start sending!
          </div>
        )}
      </div>

      {/* Failed / Cancelled Transfers */}
      {failedTransfers.length > 0 && (
        <div className="space-y-3 pt-2">
          <h2 className="text-sm font-semibold text-rose-400 uppercase tracking-wider flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            <span>Failed & Cancelled ({failedTransfers.length})</span>
          </h2>

          <div className="space-y-2">
            {failedTransfers.map((tx) => (
              <div 
                key={tx.id}
                className="bg-slate-900/60 border border-rose-950/60 rounded-2xl p-3.5 flex items-center justify-between text-xs"
              >
                <div>
                  <div className="font-medium text-slate-200">
                    {tx.direction === 'upload' ? `Upload to ${tx.peerName}` : `Download from ${tx.peerName}`}
                  </div>
                  <span className="text-[11px] text-rose-400">{tx.error || 'Transfer cancelled'}</span>
                </div>

                {tx.direction === 'upload' && tx._rawFiles && (
                  <button
                    type="button"
                    onClick={() => onRetry(tx.id)}
                    className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-200 hover:text-white bg-slate-800 hover:bg-slate-750 border border-slate-700 rounded-lg transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Retry</span>
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
