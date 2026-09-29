import React, { useState } from 'react';
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
  ChevronDown, 
  ChevronUp, 
  FileCheck, 
  Clock, 
  RotateCcw,
  Zap,
  Globe
} from 'lucide-react';

interface TransferProgressProps {
  transfers: TransferSession[];
  onTogglePause: (transferId: string) => void;
  onCancel: (transferId: string) => void;
  onSaveFile: (transferId: string, fileId: string) => void;
  onRetry?: (transferId: string) => void;
}

export const TransferProgress: React.FC<TransferProgressProps> = ({
  transfers,
  onTogglePause,
  onCancel,
  onSaveFile,
  onRetry,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  if (transfers.length === 0) return null;

  const activeTransfers = transfers.filter(
    (t) => t.status === 'transferring' || t.status === 'paused' || t.status === 'connecting' || t.status === 'pending_approval'
  );

  return (
    <div className="fixed bottom-4 right-4 z-40 w-full max-w-sm sm:max-w-md animate-in slide-in-from-bottom-5 duration-300">
      <div className="bg-slate-900/95 border border-slate-700/80 rounded-2xl shadow-2xl backdrop-blur-xl overflow-hidden text-slate-100">
        {/* Tray Header */}
        <div 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="flex items-center justify-between px-4 py-3 bg-slate-950/70 border-b border-slate-800 cursor-pointer select-none hover:bg-slate-800/50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              {activeTransfers.length > 0 ? (
                <>
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500" />
                </>
              ) : (
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
              )}
            </span>
            <span className="text-xs font-semibold text-white">
              {activeTransfers.length > 0 
                ? `Transfers Active (${activeTransfers.length})` 
                : `Transfers (${transfers.length})`}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              className="p-1 text-slate-400 hover:text-white transition-colors"
              aria-label={isCollapsed ? 'Expand transfer tray' : 'Collapse transfer tray'}
            >
              {isCollapsed ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Tray Content */}
        {!isCollapsed && (
          <div className="max-h-80 overflow-y-auto p-3 space-y-3 custom-scrollbar">
            {transfers.map((tx) => {
              const progressPct = tx.totalBytes > 0 
                ? Math.min(100, Math.round((tx.bytesTransferred / tx.totalBytes) * 100)) 
                : 0;

              const isUpload = tx.direction === 'upload';

              return (
                <div 
                  key={tx.id}
                  className="bg-slate-950/90 border border-slate-800/80 rounded-xl p-3 space-y-2.5"
                >
                  {/* Top line: Direction, Peer Name, Status badge */}
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 font-medium truncate max-w-[200px]">
                      {isUpload ? (
                        <ArrowUpRight className="w-4 h-4 text-cyan-400 shrink-0" />
                      ) : (
                        <ArrowDownLeft className="w-4 h-4 text-emerald-400 shrink-0" />
                      )}
                      <span className="text-white truncate">
                        {isUpload ? `To: ${tx.peerName}` : `From: ${tx.peerName}`}
                      </span>

                      {/* Transport badge */}
                      {tx.transport && (
                        <span 
                          title={tx.transport === 'webrtc' ? 'Direct P2P WebRTC DataChannel' : 'Encrypted WebSocket Relay Fallback'}
                          className={`text-[9px] px-1 py-0.2 rounded font-mono flex items-center gap-0.5 ${
                            tx.transport === 'webrtc' 
                              ? 'bg-cyan-950 text-cyan-300 border border-cyan-800/60' 
                              : 'bg-indigo-950 text-indigo-300 border border-indigo-800/60'
                          }`}
                        >
                          {tx.transport === 'webrtc' ? <Zap className="w-2.5 h-2.5" /> : <Globe className="w-2.5 h-2.5" />}
                          <span>{tx.transport === 'webrtc' ? 'P2P' : 'Relay'}</span>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {tx.status === 'completed' && (
                        <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Complete</span>
                        </span>
                      )}
                      {tx.status === 'transferring' && (
                        <span className="font-mono text-xs font-semibold text-cyan-400">
                          {progressPct}%
                        </span>
                      )}
                      {tx.status === 'connecting' && (
                        <span className="text-[11px] text-cyan-400/90 animate-pulse">Connecting...</span>
                      )}
                      {tx.status === 'paused' && (
                        <span className="text-[11px] text-amber-400 font-medium">Paused</span>
                      )}
                      {tx.status === 'pending_approval' && (
                        <span className="text-[11px] text-slate-400 animate-pulse">Awaiting Approval...</span>
                      )}
                      {(tx.status === 'failed' || tx.status === 'cancelled') && (
                        <div className="flex items-center gap-1.5">
                          <span className="flex items-center gap-1 text-[11px] text-rose-400">
                            <AlertCircle className="w-3.5 h-3.5" />
                            <span>{tx.status === 'cancelled' ? 'Cancelled' : 'Failed'}</span>
                          </span>
                          {onRetry && isUpload && tx._rawFiles && (
                            <button
                              type="button"
                              onClick={() => onRetry(tx.id)}
                              title="Retry transfer"
                              className="flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded transition-colors cursor-pointer"
                            >
                              <RotateCcw className="w-2.5 h-2.5" />
                              <span>Retry</span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Error hint if failed */}
                  {tx.error && (tx.status === 'failed' || tx.status === 'cancelled') && (
                    <div className="text-[11px] text-rose-400/90 bg-rose-950/30 border border-rose-900/40 rounded-lg px-2 py-1">
                      {tx.error}
                    </div>
                  )}

                  {/* Progress Bar */}
                  {(tx.status === 'transferring' || tx.status === 'paused' || tx.status === 'pending_approval') && (
                    <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-300 ${
                          tx.status === 'paused' ? 'bg-amber-400' : 'bg-gradient-to-r from-cyan-500 to-emerald-400'
                        }`}
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                  )}

                  {/* Metrics: Speed, Transferred, ETA */}
                  {(tx.status === 'transferring' || tx.status === 'paused') && (
                    <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                      <span>{formatBytes(tx.bytesTransferred)} / {formatBytes(tx.totalBytes)}</span>
                      <div className="flex items-center gap-2">
                        {tx.speed > 0 && <span>{formatSpeed(tx.speed)}</span>}
                        {tx.eta > 0 && (
                          <span className="flex items-center gap-0.5">
                            <Clock className="w-3 h-3" />
                            {formatEta(tx.eta)}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Action Controls for in-flight transfer */}
                  {(tx.status === 'transferring' || tx.status === 'paused') && (
                    <div className="flex items-center justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => onTogglePause(tx.id)}
                        className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                        title={tx.status === 'paused' ? 'Resume transfer' : 'Pause transfer'}
                      >
                        {tx.status === 'paused' ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
                      </button>
                      <button
                        type="button"
                        onClick={() => onCancel(tx.id)}
                        className="p-1 rounded-md text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 transition-colors cursor-pointer"
                        title="Cancel transfer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  {/* File List & Manual Save Button for Completed Downloads */}
                  <div className="space-y-1.5 pt-1">
                    {tx.files.map((file) => (
                      <div 
                        key={file.id}
                        className="flex items-center justify-between text-xs py-1 px-2 rounded-lg bg-slate-900/60"
                      >
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="text-slate-300 truncate max-w-[170px]">{file.name}</span>
                          <span className="text-[10px] text-slate-400 font-mono">({formatBytes(file.size)})</span>
                        </div>

                        {tx.status === 'completed' && !isUpload && (
                          <div className="flex items-center gap-1.5">
                            {file.sha256 && (
                              <span 
                                title={`Integrity verified (CRC: ${file.sha256})`}
                                className="flex items-center text-[10px] text-emerald-400/90 font-mono gap-0.5"
                              >
                                <FileCheck className="w-3 h-3" />
                                <span>Verified</span>
                              </span>
                            )}
                            <button
                              type="button"
                              onClick={() => onSaveFile(tx.id, file.id)}
                              className="flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium bg-cyan-600 hover:bg-cyan-500 text-white rounded-md transition-colors cursor-pointer"
                            >
                              <Download className="w-3 h-3" />
                              <span>Save</span>
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
