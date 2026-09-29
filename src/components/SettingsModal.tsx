import React, { useState } from 'react';
import { IceServerConfig, PeerDevice } from '../types/transfer';
import { DEFAULT_ICE_SERVERS } from '../services/webrtcManager';
import { AvatarImage } from './AvatarImage';
import { 
  X, 
  Settings, 
  ShieldCheck, 
  HardDrive, 
  Server, 
  Plus, 
  Trash2, 
  Check, 
  Wifi, 
  RotateCcw,
  Sparkles,
  Smartphone
} from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  selfDevice: PeerDevice;
  isConnected: boolean;
  onUpdateDeviceName: (name: string) => void;
  onUpdateAvatar?: (avatar: string) => void;
  iceServers: IceServerConfig[];
  onUpdateIceServers: (servers: IceServerConfig[]) => void;
}

const AVAILABLE_AVATARS = [
  { id: 'wolf', name: 'Neon Wolf' },
  { id: 'goblin', name: 'Cyber Goblin' },
  { id: 'tiger', name: 'Solar Tiger' },
  { id: 'falcon', name: 'Azure Falcon' },
  { id: 'fox', name: 'Emerald Fox' },
  { id: 'dolphin', name: 'Cosmic Dolphin' },
  { id: 'dragon', name: 'Mystic Dragon' },
  { id: 'bear', name: 'Obsidian Bear' },
];

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  selfDevice,
  isConnected,
  onUpdateDeviceName,
  onUpdateAvatar,
  iceServers,
  onUpdateIceServers,
}) => {
  const [deviceName, setDeviceName] = useState(selfDevice.name);
  const [selectedAvatar, setSelectedAvatar] = useState(selfDevice.avatar || 'wolf');
  const [servers, setServers] = useState<IceServerConfig[]>(iceServers);
  const [newServerUrl, setNewServerUrl] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newCredential, setNewCredential] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSaveName = (e: React.FormEvent) => {
    e.preventDefault();
    if (deviceName.trim()) {
      onUpdateDeviceName(deviceName.trim());
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2000);
    }
  };

  const handleSelectAvatar = (avatarId: string) => {
    setSelectedAvatar(avatarId);
    if (onUpdateAvatar) {
      onUpdateAvatar(avatarId);
    }
  };

  const handleUseModelName = () => {
    if (selfDevice.modelName) {
      setDeviceName(selfDevice.modelName);
      onUpdateDeviceName(selfDevice.modelName);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2000);
    }
  };

  const handleAddServer = () => {
    if (!newServerUrl.trim()) return;
    const newEntry: IceServerConfig = {
      urls: newServerUrl.trim(),
    };
    if (newUsername.trim()) newEntry.username = newUsername.trim();
    if (newCredential.trim()) newEntry.credential = newCredential.trim();

    const updated = [...servers, newEntry];
    setServers(updated);
    onUpdateIceServers(updated);
    setNewServerUrl('');
    setNewUsername('');
    setNewCredential('');
  };

  const handleRemoveServer = (index: number) => {
    const updated = servers.filter((_, i) => i !== index);
    setServers(updated);
    onUpdateIceServers(updated);
  };

  const handleResetServers = () => {
    setServers(DEFAULT_ICE_SERVERS);
    onUpdateIceServers(DEFAULT_ICE_SERVERS);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Title */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center border border-cyan-500/20">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Settings & Device Profile</h3>
            <p className="text-xs text-slate-400">Device model name, creature avatars & network configuration</p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Section 1: Creature Avatar Selection */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
                  Creature Avatar
                </h4>
              </div>
              <span className="text-[11px] text-cyan-400 font-mono capitalize">
                {selectedAvatar}
              </span>
            </div>

            <div className="grid grid-cols-4 gap-2.5">
              {AVAILABLE_AVATARS.map((av) => {
                const isSelected = selectedAvatar === av.id;
                return (
                  <button
                    key={av.id}
                    type="button"
                    onClick={() => handleSelectAvatar(av.id)}
                    className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-cyan-500/20 border-2 border-cyan-400 ring-2 ring-cyan-500/30 scale-105 shadow-md'
                        : 'bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300'
                    }`}
                  >
                    <div className="w-10 h-10 flex items-center justify-center mb-1">
                      <AvatarImage avatar={av.id} className="w-9 h-9" />
                    </div>
                    <span className="text-[10px] font-medium text-slate-200 truncate w-full text-center">
                      {av.name.split(' ')[1]}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 2: Device Name & Hardware Model */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Device Identity
              </h4>
              {selfDevice.modelName && (
                <button
                  type="button"
                  onClick={handleUseModelName}
                  className="flex items-center gap-1 text-[11px] text-cyan-400 hover:text-cyan-300 transition-colors cursor-pointer"
                >
                  <Smartphone className="w-3 h-3" />
                  <span>Reset to "{selfDevice.modelName}"</span>
                </button>
              )}
            </div>

            <form onSubmit={handleSaveName} className="flex gap-2">
              <input
                type="text"
                value={deviceName}
                maxLength={40}
                onChange={(e) => setDeviceName(e.target.value)}
                placeholder="e.g. Realme C35, MacBook Pro"
                className="flex-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
              />
              <button
                type="submit"
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-xl transition-colors cursor-pointer shrink-0"
              >
                {savedSuccess ? <Check className="w-3.5 h-3.5" /> : null}
                <span>{savedSuccess ? 'Saved' : 'Update'}</span>
              </button>
            </form>

            <div className="flex items-center gap-2 pt-1 text-[11px] text-slate-400">
              <span className="text-cyan-400 font-medium">Model: {selfDevice.modelName || 'Standard Device'}</span>
              <span aria-hidden="true">·</span>
              <span>{selfDevice.os}</span>
              <span aria-hidden="true">·</span>
              <span>{selfDevice.browser}</span>
            </div>
          </div>

          {/* Section 3: Network Diagnostics */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-2">
            <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Network Diagnostics
            </h4>
            <div className="flex items-center justify-between text-xs py-1 border-b border-slate-850">
              <span className="text-slate-400">Signaling Server</span>
              <span className="flex items-center gap-1.5 font-medium">
                <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400' : 'bg-rose-500'}`} />
                <span className={isConnected ? 'text-emerald-400' : 'text-rose-400'}>
                  {isConnected ? 'Connected (Online)' : 'Connecting...'}
                </span>
              </span>
            </div>
            <div className="flex items-center justify-between text-xs py-1 border-b border-slate-850">
              <span className="text-slate-400">Local Subnet Hash</span>
              <span className="font-mono text-cyan-300 text-[11px]">{selfDevice.ipSubnet || 'local_default'}</span>
            </div>
            <div className="flex items-center justify-between text-xs py-1">
              <span className="text-slate-400">Transport Layer</span>
              <span className="font-medium text-slate-300">Dual-Engine (WebRTC SCTP + Relay Fallback)</span>
            </div>
          </div>

          {/* Section 4: STUN / TURN Server Configuration */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  STUN / TURN Traversal
                </h4>
                <p className="text-[11px] text-slate-400">
                  Configured servers for NAT penetration and symmetric firewall traversal.
                </p>
              </div>
              <button
                type="button"
                onClick={handleResetServers}
                title="Reset to default Google & OpenRelay STUN/TURN"
                className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-cyan-400 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            </div>

            {/* Existing Servers List */}
            <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
              {servers.map((srv, idx) => {
                const urlStr = Array.isArray(srv.urls) ? srv.urls.join(', ') : srv.urls;
                return (
                  <div 
                    key={idx} 
                    className="flex items-center justify-between p-2 bg-slate-900 rounded-lg text-xs"
                  >
                    <div className="truncate max-w-[320px]">
                      <span className="font-mono text-cyan-300 text-[11px]">{urlStr}</span>
                      {srv.username && (
                        <span className="text-[10px] text-slate-400 ml-2">({srv.username})</span>
                      )}
                    </div>
                    {servers.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveServer(idx)}
                        className="text-slate-500 hover:text-rose-400 transition-colors p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Add Custom TURN Server */}
            <div className="pt-2 border-t border-slate-850 space-y-2">
              <span className="text-[11px] font-medium text-slate-300">Add Custom TURN / STUN</span>
              <input
                type="text"
                placeholder="turn:relay.example.com:3478"
                value={newServerUrl}
                onChange={(e) => setNewServerUrl(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-500"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Username (optional)"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  className="px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-500"
                />
                <input
                  type="password"
                  placeholder="Credential (optional)"
                  value={newCredential}
                  onChange={(e) => setNewCredential(e.target.value)}
                  className="px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-500"
                />
              </div>
              <button
                type="button"
                onClick={handleAddServer}
                disabled={!newServerUrl.trim()}
                className="flex items-center justify-center gap-1.5 w-full py-1.5 px-3 text-xs font-medium text-white bg-slate-800 hover:bg-slate-750 disabled:opacity-50 rounded-lg transition-colors cursor-pointer border border-slate-700"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add ICE Server</span>
              </button>
            </div>
          </div>

          {/* Section 5: Architecture & Privacy */}
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4 text-xs text-slate-400 space-y-2">
            <div className="flex items-center gap-2 text-slate-200 font-semibold">
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
              <span>Zero-Storage End-to-End Encryption</span>
            </div>
            <p className="leading-relaxed">
              Files are transferred directly between peer device memory buffers. No file payload is ever permanently stored on any central server or database.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
