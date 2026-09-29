/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { useWebRTC } from './hooks/useWebRTC';
import { ConnectPage } from './pages/ConnectPage';
import { PairingPage } from './pages/PairingPage';
import { TransfersPage } from './pages/TransfersPage';
import { ArchitecturePage } from './pages/ArchitecturePage';
import { SettingsPage } from './pages/SettingsPage';
import { IncomingTransferModal } from './components/IncomingTransferModal';
import { TransferProgress } from './components/TransferProgress';
import { PeerDevice } from './types/transfer';
import { 
  Radio, 
  QrCode, 
  Settings, 
  HardDrive, 
  CheckCircle2, 
  AlertTriangle, 
  Info,
  Layers,
  Cpu,
  Globe,
  Wifi
} from 'lucide-react';
import { AvatarImage } from './components/AvatarImage';

export type AppPage = 'connect' | 'pairing' | 'transfers' | 'architecture' | 'settings';

export default function App() {
  const {
    isConnected,
    selfDevice,
    peers,
    roomId,
    incomingRequest,
    transfers,
    toastMessage,
    updateDeviceName,
    updateAvatar,
    createRoom,
    joinRoom,
    leaveRoom,
    sendFilesToPeer,
    acceptIncomingRequest,
    rejectIncomingRequest,
    togglePauseTransfer,
    cancelTransfer,
    retryTransfer,
    saveFile,
    updateIceServers,
    getIceServers,
  } = useWebRTC();

  const [activePage, setActivePage] = useState<AppPage>('connect');
  const [isDraggingOverScreen, setIsDraggingOverScreen] = useState(false);
  const fallbackFileInputRef = useRef<HTMLInputElement>(null);

  // Synchronize with URL hash navigation (#connect, #pairing, #transfers, #how-it-works, #settings)
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.toLowerCase();
      if (hash === '#pairing') setActivePage('pairing');
      else if (hash === '#transfers') setActivePage('transfers');
      else if (hash === '#how-it-works' || hash === '#architecture') setActivePage('architecture');
      else if (hash === '#settings') setActivePage('settings');
      else if (hash === '#connect' || hash === '' || hash === '#radar') setActivePage('connect');
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigateTo = (page: AppPage) => {
    setActivePage(page);
    const hashTarget = 
      page === 'connect' ? '#connect' :
      page === 'pairing' ? '#pairing' :
      page === 'transfers' ? '#transfers' :
      page === 'architecture' ? '#how-it-works' : '#settings';
    
    if (window.location.hash !== hashTarget) {
      window.location.hash = hashTarget;
    }
  };

  // Global Drag and Drop handlers
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    if (peers.length > 0) {
      setIsDraggingOverScreen(true);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.clientX <= 0 || e.clientY <= 0 || e.clientX >= window.innerWidth || e.clientY >= window.innerHeight) {
      setIsDraggingOverScreen(false);
    }
  };

  const handleGlobalDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOverScreen(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const filesArray = Array.from(e.dataTransfer.files);
      if (peers.length > 0) {
        sendFilesToPeer(peers[0], filesArray);
      }
    }
  };

  const handleSelectFilesForPeer = (peer: PeerDevice, files: File[]) => {
    sendFilesToPeer(peer, files);
  };

  const activeTransfersCount = transfers.filter(
    (t) => t.status === 'transferring' || t.status === 'paused' || t.status === 'connecting' || t.status === 'pending_approval'
  ).length;

  return (
    <div 
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleGlobalDrop}
      className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-200 pb-20 md:pb-6"
    >
      {/* Hidden file input for fallback */}
      <input
        type="file"
        ref={fallbackFileInputRef}
        multiple
        className="hidden"
      />

      {/* Top Header Navigation Bar (Fully responsive for Mobile, Tablet, and Desktop) */}
      <header className="w-full border-b border-slate-800/80 bg-slate-950/85 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 h-16 flex items-center justify-between gap-2">
          {/* Logo & Device Avatar Badge */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <button 
              type="button" 
              onClick={() => navigateTo('connect')}
              className="flex items-center gap-2 group cursor-pointer text-left outline-none"
            >
              <div className="w-8 h-8 rounded-full bg-slate-900 border border-cyan-500/40 flex items-center justify-center shadow-sm shadow-cyan-950/50 group-hover:scale-105 transition-transform shrink-0">
                <AvatarImage avatar={selfDevice.avatar} className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <span className="text-base sm:text-lg font-bold tracking-tight text-white flex items-center gap-1 group-hover:text-cyan-300 transition-colors">
                  AetherDrop
                </span>
                <span className="hidden xl:block text-[10px] text-slate-400 font-medium truncate max-w-[130px]">
                  {selfDevice.name || selfDevice.modelName || 'Device'}
                </span>
              </div>
            </button>
          </div>

          {/* Tablet & Desktop Navigation Tabs (Adaptive for 768px+ tablets and wide monitors) */}
          <nav className="hidden md:flex items-center gap-0.5 lg:gap-1 bg-slate-900/90 border border-slate-800/90 rounded-2xl p-1 text-[11px] lg:text-xs font-semibold shrink">
            <button
              type="button"
              onClick={() => navigateTo('connect')}
              className={`flex items-center gap-1.5 px-2.5 lg:px-3.5 py-1.5 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                activePage === 'connect'
                  ? 'bg-cyan-400 text-slate-950 shadow-sm font-bold'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Radio className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden xl:inline">Connection</span>
              <span className="xl:hidden">Radar</span>
            </button>

            <button
              type="button"
              onClick={() => navigateTo('pairing')}
              className={`flex items-center gap-1.5 px-2.5 lg:px-3.5 py-1.5 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                activePage === 'pairing'
                  ? 'bg-cyan-400 text-slate-950 shadow-sm font-bold'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <QrCode className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden xl:inline">Remote Pairing</span>
              <span className="xl:hidden">Pairing</span>
              {roomId && (
                <span className="text-[10px] font-mono bg-indigo-950 text-indigo-300 px-1.5 py-0.2 rounded-full border border-indigo-800/60">
                  #{roomId}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => navigateTo('transfers')}
              className={`flex items-center gap-1.5 px-2.5 lg:px-3.5 py-1.5 rounded-xl transition-all cursor-pointer relative whitespace-nowrap ${
                activePage === 'transfers'
                  ? 'bg-cyan-400 text-slate-950 shadow-sm font-bold'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Layers className="w-3.5 h-3.5 shrink-0" />
              <span>Transfers</span>
              {activeTransfersCount > 0 && (
                <span className="text-[10px] bg-cyan-950 text-cyan-300 font-bold px-1.5 py-0.2 rounded-full border border-cyan-700 animate-pulse">
                  {activeTransfersCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => navigateTo('architecture')}
              className={`flex items-center gap-1.5 px-2.5 lg:px-3.5 py-1.5 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                activePage === 'architecture'
                  ? 'bg-cyan-400 text-slate-950 shadow-sm font-bold'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Cpu className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden xl:inline">How It Works</span>
              <span className="xl:hidden">Guide</span>
            </button>

            <button
              type="button"
              onClick={() => navigateTo('settings')}
              className={`flex items-center gap-1.5 px-2.5 lg:px-3.5 py-1.5 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                activePage === 'settings'
                  ? 'bg-cyan-400 text-slate-950 shadow-sm font-bold'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Settings className="w-3.5 h-3.5 shrink-0" />
              <span>Settings</span>
            </button>
          </nav>

          {/* Quick Header Status Pill (Compact for Tablet and Desktop) */}
          <div className="flex items-center gap-2 shrink-0">
            <div 
              title={isConnected ? 'Signaling online' : 'Connecting to signaling server'}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-900 border border-slate-800 text-[11px] font-mono text-slate-300"
            >
              <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
              <span className="hidden md:inline">{isConnected ? 'Online' : 'Connecting'}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area - Page Router */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3.5 sm:px-6 lg:px-8 py-4 sm:py-6">
        {activePage === 'connect' && (
          <ConnectPage
            selfDevice={selfDevice}
            peers={peers}
            roomId={roomId}
            isConnected={isConnected}
            isDraggingOverScreen={isDraggingOverScreen}
            onSelectFilesForPeer={handleSelectFilesForPeer}
            onNavigateToPairing={() => navigateTo('pairing')}
            onNavigateToTransfers={() => navigateTo('transfers')}
          />
        )}

        {activePage === 'pairing' && (
          <PairingPage
            roomId={roomId}
            peers={peers}
            onCreateRoom={createRoom}
            onJoinRoom={joinRoom}
            onLeaveRoom={leaveRoom}
            onNavigateToRadar={() => navigateTo('connect')}
          />
        )}

        {activePage === 'transfers' && (
          <TransfersPage
            transfers={transfers}
            onTogglePause={togglePauseTransfer}
            onCancel={cancelTransfer}
            onSaveFile={saveFile}
            onRetry={retryTransfer}
            onNavigateToRadar={() => navigateTo('connect')}
          />
        )}

        {activePage === 'architecture' && (
          <ArchitecturePage
            onNavigateToRadar={() => navigateTo('connect')}
          />
        )}

        {activePage === 'settings' && (
          <SettingsPage
            selfDevice={selfDevice}
            isConnected={isConnected}
            onUpdateDeviceName={updateDeviceName}
            onUpdateAvatar={updateAvatar}
            iceServers={getIceServers()}
            onUpdateIceServers={updateIceServers}
            onNavigateToRadar={() => navigateTo('connect')}
          />
        )}
      </main>

      {/* Mobile Bottom Navigation Bar (Clean, App-like, Touch Target >= 44px) */}
      <nav 
        aria-label="Mobile navigation" 
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 border-t border-slate-800/90 backdrop-blur-xl px-2 py-1.5 flex items-center justify-around"
      >
        <button
          type="button"
          onClick={() => navigateTo('connect')}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl min-w-[56px] min-h-[44px] cursor-pointer transition-colors ${
            activePage === 'connect' ? 'text-cyan-400 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Radio className="w-4 h-4 mb-0.5" />
          <span className="text-[10px]">Radar</span>
        </button>

        <button
          type="button"
          onClick={() => navigateTo('pairing')}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl min-w-[56px] min-h-[44px] cursor-pointer transition-colors relative ${
            activePage === 'pairing' ? 'text-cyan-400 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <QrCode className="w-4 h-4 mb-0.5" />
          <span className="text-[10px]">Pairing</span>
          {roomId && (
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 absolute top-1 right-2" />
          )}
        </button>

        <button
          type="button"
          onClick={() => navigateTo('transfers')}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl min-w-[56px] min-h-[44px] cursor-pointer transition-colors relative ${
            activePage === 'transfers' ? 'text-cyan-400 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Layers className="w-4 h-4 mb-0.5" />
          <span className="text-[10px]">Transfers</span>
          {activeTransfersCount > 0 && (
            <span className="w-2 h-2 rounded-full bg-cyan-400 absolute top-1 right-2 animate-ping" />
          )}
        </button>

        <button
          type="button"
          onClick={() => navigateTo('architecture')}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl min-w-[56px] min-h-[44px] cursor-pointer transition-colors ${
            activePage === 'architecture' ? 'text-cyan-400 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Cpu className="w-4 h-4 mb-0.5" />
          <span className="text-[10px]">Tech</span>
        </button>

        <button
          type="button"
          onClick={() => navigateTo('settings')}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl min-w-[56px] min-h-[44px] cursor-pointer transition-colors ${
            activePage === 'settings' ? 'text-cyan-400 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Settings className="w-4 h-4 mb-0.5" />
          <span className="text-[10px]">Settings</span>
        </button>
      </nav>

      {/* Floating Transfer Progress Tray for active in-flight transfers */}
      {activePage !== 'transfers' && (
        <TransferProgress
          transfers={transfers}
          onTogglePause={togglePauseTransfer}
          onCancel={cancelTransfer}
          onSaveFile={saveFile}
          onRetry={retryTransfer}
        />
      )}

      {/* Global Incoming File Transfer Authorization Modal */}
      <IncomingTransferModal
        request={incomingRequest}
        onAccept={acceptIncomingRequest}
        onReject={rejectIncomingRequest}
      />

      {/* Global Toast Notification Pill */}
      {toastMessage && (
        <div className="fixed top-20 right-4 z-50 animate-in slide-in-from-top-3 duration-200">
          <div className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl border text-xs font-semibold shadow-2xl backdrop-blur-md ${
            toastMessage.type === 'success'
              ? 'bg-emerald-950/90 border-emerald-800 text-emerald-200'
              : toastMessage.type === 'error'
              ? 'bg-rose-950/90 border-rose-800 text-rose-200'
              : 'bg-slate-900/90 border-slate-700 text-slate-200'
          }`}>
            {toastMessage.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
            {toastMessage.type === 'error' && <AlertTriangle className="w-4 h-4 text-rose-400" />}
            {toastMessage.type === 'info' && <Info className="w-4 h-4 text-cyan-400" />}
            <span>{toastMessage.text}</span>
          </div>
        </div>
      )}
    </div>
  );
}
