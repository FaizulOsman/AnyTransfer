import React, { useState } from 'react';
import { IceServerConfig, PeerDevice } from '../types/transfer';
import { DEFAULT_ICE_SERVERS } from '../services/webrtcManager';
import { AvatarImage } from '../components/AvatarImage';
import { 
  Settings, 
  ShieldCheck, 
  Smartphone, 
  Sparkles, 
  RotateCcw, 
  Check, 
  Plus, 
  Trash2, 
  Wifi, 
  Activity, 
  Radio
} from 'lucide-react';

interface SettingsPageProps {
  selfDevice: PeerDevice;
  isConnected: boolean;
  onUpdateDeviceName: (name: string) => void;
  onUpdateAvatar: (avatar: string) => void;
  iceServers: IceServerConfig[];
  onUpdateIceServers: (servers: IceServerConfig[]) => void;
  onNavigateToRadar: () => void;
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

export const SettingsPage: React.FC<SettingsPageProps> = ({
  selfDevice,
  isConnected,
  onUpdateDeviceName,
  onUpdateAvatar,
  iceServers,
  onUpdateIceServers,
  onNavigateToRadar,
}) => {
  const [deviceName, setDeviceName] = useState(selfDevice.name);
  const [selectedAvatar, setSelectedAvatar] = useState(selfDevice.avatar || 'wolf');
  const [servers, setServers] = useState<IceServerConfig[]>(iceServers);
  const [newServerUrl, setNewServerUrl] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newCredential, setNewCredential] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);

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
    onUpdateAvatar(avatarId);
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
    <div className="w-full max-w-4xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Settings & Device Profile
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Configure your device hardware identity, creature avatar persona, and WebRTC STUN/TURN traversal servers.
          </p>
        </div>

        <button
          type="button"
          onClick={onNavigateToRadar}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-xl transition-colors cursor-pointer shrink-0 shadow-md shadow-cyan-950/40"
        >
          <Radio className="w-3.5 h-3.5" />
          <span>Save & Return to Radar</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Section 1: Creature Avatar Selection */}
        <div className="bg-slate-900/70 border border-slate-800/90 rounded-3xl p-5 sm:p-6 backdrop-blur-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-cyan-500/10 border border-cyan-500/25 flex items-center justify-center text-cyan-400">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">Creature Avatar</h3>
                <p className="text-xs text-slate-400">Your visual persona on peer radars</p>
              </div>
            </div>
            <span className="text-xs text-cyan-300 font-mono capitalize bg-cyan-950/70 border border-cyan-800/60 px-2 py-0.5 rounded-full">
              {selectedAvatar}
            </span>
          </div>

          <div className="grid grid-cols-4 gap-2.5 pt-2">
            {AVAILABLE_AVATARS.map((av) => {
              const isSelected = selectedAvatar === av.id;
              return (
                <button
                  key={av.id}
                  type="button"
                  onClick={() => handleSelectAvatar(av.id)}
                  className={`flex flex-col items-center justify-center p-2 rounded-2xl transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-cyan-500/20 border-2 border-cyan-400 ring-2 ring-cyan-500/30 scale-105 shadow-md shadow-cyan-950/50'
                      : 'bg-slate-950/70 hover:bg-slate-800/80 border border-slate-800/80 text-slate-300'
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

        {/* Section 2: Device Model Name & Identity */}
        <div className="bg-slate-900/70 border border-slate-800/90 rounded-3xl p-5 sm:p-6 backdrop-blur-xl space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-indigo-500/10 border border-indigo-500/25 flex items-center justify-center text-indigo-400">
                  <Smartphone className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">Device Identity</h3>
                  <p className="text-xs text-slate-400">Hardware model shown to nearby peers</p>
                </div>
              </div>

              {selfDevice.modelName && (
                <button
                  type="button"
                  onClick={handleUseModelName}
                  className="flex items-center gap-1 text-[11px] text-cyan-400 hover:text-cyan-300 transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset to Model</span>
                </button>
              )}
            </div>

            <form onSubmit={handleSaveName} className="space-y-2">
              <label htmlFor="device-name-input" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Display Name
              </label>
              <div className="flex gap-2">
                <input
                  id="device-name-input"
                  type="text"
                  value={deviceName}
                  maxLength={40}
                  onChange={(e) => setDeviceName(e.target.value)}
                  placeholder="e.g. Realme C35, MacBook Pro"
                  className="flex-1 px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400"
                />
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-xl transition-colors cursor-pointer shrink-0"
                >
                  {savedSuccess ? <Check className="w-3.5 h-3.5" /> : null}
                  <span>{savedSuccess ? 'Saved' : 'Update'}</span>
                </button>
              </div>
            </form>

            <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-950/80 border border-slate-800/80 p-3 rounded-xl">
              <span className="text-cyan-400 font-semibold">Detected Hardware:</span>
              <span className="text-white truncate">{selfDevice.modelName || 'Standard Device'}</span>
              <span aria-hidden="true">·</span>
              <span>{selfDevice.os}</span>
            </div>
          </div>

          <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-3.5 text-xs text-slate-400 space-y-1">
            <div className="flex items-center gap-2 text-slate-200 font-semibold">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Zero Account Required</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              No login, phone number, or email required. Names and configurations stay on your local device.
            </p>
          </div>
        </div>
      </div>

      {/* Section 3: STUN / TURN Server Configuration */}
      <div className="bg-slate-900/70 border border-slate-800/90 rounded-3xl p-5 sm:p-6 backdrop-blur-xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-white">STUN / TURN Traversal Servers</h3>
            <p className="text-xs text-slate-400">
              Configure custom STUN/TURN relays to traverse restrictive symmetric corporate firewalls.
            </p>
          </div>
          <button
            type="button"
            onClick={handleResetServers}
            title="Reset to default OpenRelay and Google STUN"
            className="flex items-center gap-1 text-xs text-slate-400 hover:text-cyan-400 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Defaults</span>
          </button>
        </div>

        {/* Existing Servers List */}
        <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
          {servers.map((srv, idx) => {
            const urlStr = Array.isArray(srv.urls) ? srv.urls.join(', ') : srv.urls;
            return (
              <div 
                key={idx} 
                className="flex items-center justify-between p-2.5 bg-slate-950 border border-slate-800/80 rounded-xl text-xs"
              >
                <div className="truncate max-w-[450px]">
                  <span className="font-mono text-cyan-300 text-[11px]">{urlStr}</span>
                  {srv.username && (
                    <span className="text-[10px] text-slate-400 ml-2">({srv.username})</span>
                  )}
                </div>
                {servers.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveServer(idx)}
                    className="text-slate-500 hover:text-rose-400 transition-colors p-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Add Custom TURN Server */}
        <div className="pt-3 border-t border-slate-800/80 space-y-2.5">
          <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
            Add Custom TURN / STUN Server
          </span>
          <input
            type="text"
            placeholder="turn:relay.example.com:3478"
            value={newServerUrl}
            onChange={(e) => setNewServerUrl(e.target.value)}
            className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-400"
          />
          <div className="grid grid-cols-2 gap-2">
            <input
              type="text"
              placeholder="Username (optional)"
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              className="px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-400"
            />
            <input
              type="password"
              placeholder="Credential (optional)"
              value={newCredential}
              onChange={(e) => setNewCredential(e.target.value)}
              className="px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-400"
            />
          </div>
          <button
            type="button"
            onClick={handleAddServer}
            disabled={!newServerUrl.trim()}
            className="flex items-center justify-center gap-1.5 w-full py-2 px-4 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-750 disabled:opacity-50 rounded-xl transition-colors cursor-pointer border border-slate-700"
          >
            <Plus className="w-4 h-4" />
            <span>Add Traversal Server</span>
          </button>
        </div>
      </div>
    </div>
  );
};
