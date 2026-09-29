import React from 'react';
import { TransferSession } from '../types/transfer';
import { formatBytes } from '../utils/device';
import { ShieldCheck, FileText, Check, X, ArrowDown } from 'lucide-react';

interface IncomingTransferModalProps {
  request: TransferSession | null;
  onAccept: (transferId: string) => void;
  onReject: (transferId: string) => void;
}

export const IncomingTransferModal: React.FC<IncomingTransferModalProps> = ({
  request,
  onAccept,
  onReject,
}) => {
  if (!request) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-3xl p-6 shadow-2xl">
        {/* Header Badge */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center border border-cyan-500/20">
            <ArrowDown className="w-6 h-6 animate-bounce" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 text-xs font-medium text-cyan-400">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Incoming Transfer Request</span>
            </div>
            <h3 className="text-base font-semibold text-white">
              {request.peerName || 'Remote Peer'} wants to send files
            </h3>
          </div>
        </div>

        {/* Batch Overview Box */}
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 mb-5 space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400 border-b border-slate-850 pb-2">
            <span>{request.files.length} {request.files.length === 1 ? 'file' : 'files'}</span>
            <span className="font-mono text-slate-200 font-semibold">{formatBytes(request.totalBytes)}</span>
          </div>

          <div className="max-h-40 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
            {request.files.map((file, idx) => (
              <div key={file.id || idx} className="flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <FileText className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span className="text-slate-200 truncate">{file.name}</span>
                </div>
                <span className="text-slate-400 font-mono text-[11px] shrink-0">
                  {formatBytes(file.size)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Confirmation Buttons */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => onReject(request.id)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-4 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-750 border border-slate-700 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
            <span>Decline</span>
          </button>

          <button
            type="button"
            onClick={() => onAccept(request.id)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-4 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-xl transition-colors cursor-pointer shadow-lg shadow-cyan-950/50"
          >
            <Check className="w-4 h-4" />
            <span>Accept Transfer</span>
          </button>
        </div>
      </div>
    </div>
  );
};
