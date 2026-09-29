import { useState, useEffect, useRef, useCallback } from 'react';
import { IceServerConfig, PeerDevice, TransferSession } from '../types/transfer';
import { detectDevice, getAccurateDeviceModel } from '../utils/device';
import { WebRTCManager } from '../services/webrtcManager';

export function useWebRTC() {
  const [isConnected, setIsConnected] = useState(false);
  const [selfDevice, setSelfDevice] = useState<PeerDevice>(() => {
    const { deviceType, os, browser, modelName } = detectDevice();
    const savedName = typeof window !== 'undefined' ? localStorage.getItem('aetherdrop_device_name') : null;
    const savedAvatar = typeof window !== 'undefined' ? localStorage.getItem('aetherdrop_avatar') : null;
    return {
      id: '',
      name: savedName || modelName || 'Device',
      modelName,
      avatar: savedAvatar || 'wolf',
      deviceType,
      os,
      browser,
      status: 'available',
      isSelf: true,
    };
  });

  const [peers, setPeers] = useState<PeerDevice[]>([]);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [incomingRequest, setIncomingRequest] = useState<TransferSession | null>(null);
  const [transfers, setTransfers] = useState<TransferSession[]>([]);
  const [toastMessage, setToastMessage] = useState<{ id: string; text: string; type: 'info' | 'success' | 'error' } | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const webrtcManagerRef = useRef<WebRTCManager | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const showToast = useCallback((text: string, type: 'info' | 'success' | 'error' = 'info') => {
    const id = Math.random().toString(36).substring(2, 7);
    setToastMessage({ id, text, type });
    setTimeout(() => {
      setToastMessage((curr) => (curr?.id === id ? null : curr));
    }, 4000);
  }, []);

  // Update peer status helper
  const updatePeerStatus = useCallback((peerId: string, status: PeerDevice['status']) => {
    setPeers((prev) =>
      prev.map((p) => (p.id === peerId ? { ...p, status } : p))
    );
  }, []);

  // Initialize WebRTC Manager
  useEffect(() => {
    const manager = new WebRTCManager({
      onSignalingSend: (to, data) => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(
            JSON.stringify({
              type: 'signal',
              to,
              data,
            })
          );
        }
      },
      onRelaySend: (to, data) => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(
            JSON.stringify({
              type: 'relay_transfer',
              to,
              data,
            })
          );
        }
      },
      onIncomingTransferRequest: (transfer) => {
        // Find sender peer name
        setPeers((currPeers) => {
          const sender = currPeers.find((p) => p.id === transfer.peerId);
          if (sender) {
            transfer.peerName = sender.name;
          }
          setIncomingRequest({ ...transfer });
          return currPeers;
        });
      },
      onTransferProgress: (updatedTransfer) => {
        setTransfers((prev) => {
          const index = prev.findIndex((t) => t.id === updatedTransfer.id);
          if (index >= 0) {
            const next = [...prev];
            next[index] = { ...updatedTransfer };
            return next;
          }
          return [updatedTransfer, ...prev];
        });
      },
      onTransferComplete: (completedTransfer) => {
        setTransfers((prev) => {
          const index = prev.findIndex((t) => t.id === completedTransfer.id);
          if (index >= 0) {
            const next = [...prev];
            next[index] = { ...completedTransfer };
            return next;
          }
          return [completedTransfer, ...prev];
        });
        showToast(
          `Transfer complete: ${completedTransfer.files.map((f) => f.name).join(', ')}`,
          'success'
        );

        // Auto download files if direction is download
        if (completedTransfer.direction === 'download' && completedTransfer.assembledBlobs) {
          for (const file of completedTransfer.files) {
            const blob = completedTransfer.assembledBlobs[file.id];
            if (blob) {
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = file.name;
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              setTimeout(() => URL.revokeObjectURL(url), 60000);
            }
          }
        }
      },
      onTransferError: (transferId, error) => {
        setTransfers((prev) =>
          prev.map((t) => (t.id === transferId ? { ...t, status: 'failed', error } : t))
        );
        showToast(`Transfer error: ${error}`, 'error');
      },
      onPeerConnectionStateChange: (peerId, state) => {
        if (state === 'connected') {
          updatePeerStatus(peerId, 'connected');
        } else if (state === 'connecting') {
          updatePeerStatus(peerId, 'connecting');
        } else {
          updatePeerStatus(peerId, 'available');
        }
      },
    });

    webrtcManagerRef.current = manager;

    return () => {
      manager.cleanup();
    };
  }, [showToast, updatePeerStatus]);

  // Connect to Signaling Server via WebSocket
  const connectSignaling = useCallback(() => {
    if (typeof window === 'undefined') return;

    if (wsRef.current) {
      wsRef.current.close();
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    };

    ws.onclose = () => {
      setIsConnected(false);
      // Auto-reconnect after 2.5s
      reconnectTimeoutRef.current = setTimeout(() => {
        connectSignaling();
      }, 2500);
    };

    ws.onerror = (err) => {
      console.warn('[Signaling] WebSocket error:', err);
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);

        switch (msg.type) {
          case 'welcome': {
            setSelfDevice((prev) => {
              const savedName = typeof window !== 'undefined' ? localStorage.getItem('aetherdrop_device_name') : null;
              const savedAvatar = typeof window !== 'undefined' ? localStorage.getItem('aetherdrop_avatar') : null;
              
              // Device model name is the primary device identity
              const effectiveName = savedName || prev.modelName || msg.device?.name || 'Device';
              const effectiveAvatar = savedAvatar || prev.avatar || msg.device?.avatar || 'wolf';

              const updated = {
                ...prev,
                id: msg.peerId,
                name: effectiveName,
                avatar: effectiveAvatar,
                ipSubnet: msg.device?.ipSubnet,
              };
              webrtcManagerRef.current?.setSelfId(msg.peerId);

              // Send join message with self info
              const { deviceType, os, browser } = detectDevice();
              ws.send(
                JSON.stringify({
                  type: 'join',
                  device: {
                    name: updated.name,
                    modelName: updated.modelName,
                    avatar: updated.avatar,
                    deviceType,
                    os,
                    browser,
                  },
                  room: roomId || undefined,
                })
              );
              return updated;
            });
            break;
          }

          case 'peer_list': {
            if (Array.isArray(msg.peers)) {
              setPeers(msg.peers);
            }
            break;
          }

          case 'peer_joined': {
            if (msg.peer) {
              setPeers((prev) => {
                const existing = prev.findIndex((p) => p.id === msg.peer.id);
                if (existing >= 0) {
                  const updated = [...prev];
                  updated[existing] = msg.peer;
                  return updated;
                }
                return [...prev, msg.peer];
              });
              showToast(`${msg.peer.name} appeared nearby`, 'info');
            }
            break;
          }

          case 'peer_left': {
            if (msg.peerId) {
              setPeers((prev) => prev.filter((p) => p.id !== msg.peerId));
            }
            break;
          }

          case 'room_created':
          case 'room_joined': {
            setRoomId(msg.room || null);
            if (msg.room) {
              showToast(`Joined remote room #${msg.room}`, 'success');
            }
            break;
          }

          case 'room_error': {
            showToast(msg.data || 'Failed to join room', 'error');
            break;
          }

          case 'signal': {
            if (msg.from && msg.data) {
              webrtcManagerRef.current?.handleSignaling(msg.from, msg.data);
            }
            break;
          }

          case 'relay_transfer': {
            if (msg.from && msg.data) {
              webrtcManagerRef.current?.handleRelayMessage(msg.from, msg.data);
            }
            break;
          }

          default:
            break;
        }
      } catch (err) {
        console.error('[Signaling] Failed to process message:', err);
      }
    };
  }, [roomId, showToast]);

  useEffect(() => {
    connectSignaling();
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [connectSignaling]);

  // Check URL params for room code on initial load (e.g. ?room=123456)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const urlRoom = params.get('room');
      if (urlRoom && urlRoom.trim().length >= 4) {
        joinRoom(urlRoom.trim());
      }
    }
  }, []);

  // Check Client Hints for high-accuracy device model (e.g. Realme C35, Galaxy S24, Pixel)
  useEffect(() => {
    getAccurateDeviceModel().then((model) => {
      if (model) {
        setSelfDevice((prev) => {
          const hasCustomName = typeof window !== 'undefined' && localStorage.getItem('aetherdrop_device_name');
          const finalName = hasCustomName || model;
          const updated = {
            ...prev,
            modelName: model,
            name: finalName,
          };

          if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(
              JSON.stringify({
                type: 'join',
                device: {
                  name: updated.name,
                  modelName: model,
                  avatar: updated.avatar,
                  deviceType: updated.deviceType,
                  os: updated.os,
                  browser: updated.browser,
                },
                room: roomId || undefined,
              })
            );
          }
          return updated;
        });
      }
    });
  }, [roomId]);

  const updateDeviceName = useCallback((newName: string) => {
    const clean = newName.trim().slice(0, 32);
    if (!clean) return;

    setSelfDevice((prev) => {
      const updated = { ...prev, name: clean };
      try {
        localStorage.setItem('aetherdrop_device_name', clean);
      } catch (e) {
        console.warn(e);
      }

      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({
            type: 'join',
            device: {
              name: clean,
              modelName: prev.modelName,
              avatar: prev.avatar,
              deviceType: prev.deviceType,
              os: prev.os,
              browser: prev.browser,
            },
            room: roomId || undefined,
          })
        );
      }
      return updated;
    });
    showToast(`Device name updated to "${clean}"`, 'success');
  }, [roomId, showToast]);

  const updateAvatar = useCallback((newAvatar: string) => {
    setSelfDevice((prev) => {
      const updated = { ...prev, avatar: newAvatar };
      try {
        localStorage.setItem('aetherdrop_avatar', newAvatar);
      } catch (e) {
        console.warn(e);
      }

      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({
            type: 'join',
            device: {
              name: prev.name,
              modelName: prev.modelName,
              avatar: newAvatar,
              deviceType: prev.deviceType,
              os: prev.os,
              browser: prev.browser,
            },
            room: roomId || undefined,
          })
        );
      }
      return updated;
    });
    showToast(`Avatar set to ${newAvatar}`, 'success');
  }, [roomId, showToast]);

  const createRoom = useCallback(() => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'create_room' }));
    }
  }, []);

  const joinRoom = useCallback((code: string) => {
    const clean = code.trim().toUpperCase();
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'join_room', room: clean }));
    }
  }, []);

  const leaveRoom = useCallback(() => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'leave_room' }));
      setRoomId(null);
      showToast('Left remote room, returned to local radar', 'info');
    }
  }, [showToast]);

  const sendFilesToPeer = useCallback(async (peer: PeerDevice, files: File[]) => {
    if (!webrtcManagerRef.current) return;
    try {
      showToast(`Initiating transfer with ${peer.name}...`, 'info');
      await webrtcManagerRef.current.sendFiles(peer, files);
    } catch (err: any) {
      showToast(err.message || 'Transfer failed to start', 'error');
    }
  }, [showToast]);

  const acceptIncomingRequest = useCallback((transferId: string) => {
    if (!webrtcManagerRef.current) return;
    webrtcManagerRef.current.acceptTransfer(transferId);
    setIncomingRequest(null);
  }, []);

  const rejectIncomingRequest = useCallback((transferId: string) => {
    if (!webrtcManagerRef.current) return;
    webrtcManagerRef.current.rejectTransfer(transferId);
    setIncomingRequest(null);
  }, []);

  const togglePauseTransfer = useCallback((transferId: string) => {
    webrtcManagerRef.current?.togglePauseTransfer(transferId);
  }, []);

  const cancelTransfer = useCallback((transferId: string) => {
    webrtcManagerRef.current?.cancelTransfer(transferId);
  }, []);

  const retryTransfer = useCallback((transferId: string) => {
    webrtcManagerRef.current?.retryTransfer(transferId);
  }, []);

  const saveFile = useCallback((transferId: string, fileId: string) => {
    const tx = transfers.find((t) => t.id === transferId);
    if (!tx || !tx.assembledBlobs) return;

    const file = tx.files.find((f) => f.id === fileId);
    const blob = tx.assembledBlobs[fileId];
    if (blob && file) {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    }
  }, [transfers]);

  const updateIceServers = useCallback((servers: IceServerConfig[]) => {
    webrtcManagerRef.current?.setCustomIceServers(servers);
    showToast('WebRTC ICE & STUN/TURN servers updated', 'success');
  }, [showToast]);

  const getIceServers = useCallback((): IceServerConfig[] => {
    return webrtcManagerRef.current?.getIceServers() || [];
  }, []);

  return {
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
  };
}
