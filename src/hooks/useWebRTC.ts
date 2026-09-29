import { useState, useEffect, useRef, useCallback } from 'react';
import mqtt, { MqttClient } from 'mqtt';
import { IceServerConfig, PeerDevice, TransferSession } from '../types/transfer';
import { detectDevice, getAccurateDeviceModel } from '../utils/device';
import { WebRTCManager } from '../services/webrtcManager';

const MQTT_BROKER_URLS = [
  'wss://test.mosquitto.org:8081',
];

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
  const mqttClientRef = useRef<MqttClient | null>(null);
  const webrtcManagerRef = useRef<WebRTCManager | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const announceIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const pruneIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const selfIdRef = useRef<string>('');
  const currentRoomRef = useRef<string | null>(null);
  const activeSubnetRef = useRef<string>('public_global');
  const knownPeersMapRef = useRef<Map<string, PeerDevice & { lastSeen: number }>>(new Map());

  const showToast = useCallback((text: string, type: 'info' | 'success' | 'error' = 'info') => {
    const id = Math.random().toString(36).substring(2, 7);
    setToastMessage({ id, text, type });
    setTimeout(() => {
      setToastMessage((curr) => (curr?.id === id ? null : curr));
    }, 4000);
  }, []);

  const updatePeerStatus = useCallback((peerId: string, status: PeerDevice['status']) => {
    setPeers((prev) =>
      prev.map((p) => (p.id === peerId ? { ...p, status } : p))
    );
  }, []);

  // Update list of visible peers & prune inactive peers (>10s)
  const refreshPeersList = useCallback(() => {
    const now = Date.now();
    const activePeers: PeerDevice[] = [];

    for (const [id, peer] of knownPeersMapRef.current.entries()) {
      if (id === selfIdRef.current) continue;
      if (now - peer.lastSeen <= 10000) {
        activePeers.push({
          id: peer.id,
          name: peer.name,
          modelName: peer.modelName,
          avatar: peer.avatar,
          deviceType: peer.deviceType,
          os: peer.os,
          browser: peer.browser,
          roomId: peer.roomId,
          status: peer.status || 'available',
        });
      } else {
        knownPeersMapRef.current.delete(id);
      }
    }
    setPeers(activePeers);
  }, []);

  // Helper to send message over native WS or MQTT broker
  const sendSignalingMessage = useCallback((msg: any) => {
    // 1. Direct WebSocket
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(msg));
      return;
    }

    // 2. MQTT Broker
    if (mqttClientRef.current && mqttClientRef.current.connected) {
      const type = msg.type;

      if (type === 'signal' || type === 'relay_transfer') {
        const targetTopic = `anytransfer/peer/${msg.to}`;
        mqttClientRef.current.publish(targetTopic, JSON.stringify({
          type,
          from: selfIdRef.current,
          data: msg.data,
        }));
      } else if (type === 'join' || type === 'announce') {
        const announceTopic = currentRoomRef.current
          ? `anytransfer/room/${currentRoomRef.current}`
          : `anytransfer/radar/${activeSubnetRef.current}`;

        mqttClientRef.current.publish(announceTopic, JSON.stringify({
          type: 'announce',
          peer: {
            id: selfIdRef.current,
            name: msg.device?.name || selfDevice.name,
            modelName: msg.device?.modelName || selfDevice.modelName,
            avatar: msg.device?.avatar || selfDevice.avatar,
            deviceType: msg.device?.deviceType || selfDevice.deviceType,
            os: msg.device?.os || selfDevice.os,
            browser: msg.device?.browser || selfDevice.browser,
            roomId: currentRoomRef.current || undefined,
            status: 'available',
          }
        }));
      } else if (type === 'leave_room') {
        const oldRoomTopic = `anytransfer/room/${currentRoomRef.current}`;
        mqttClientRef.current.publish(oldRoomTopic, JSON.stringify({
          type: 'peer_left',
          peerId: selfIdRef.current,
        }));
      }
    }
  }, [selfDevice]);

  // Broadcast presence announce packet periodically
  const startAnnounceLoop = useCallback(() => {
    if (announceIntervalRef.current) clearInterval(announceIntervalRef.current);
    if (pruneIntervalRef.current) clearInterval(pruneIntervalRef.current);

    announceIntervalRef.current = setInterval(() => {
      if (selfIdRef.current) {
        sendSignalingMessage({
          type: 'announce',
          device: {
            name: selfDevice.name,
            modelName: selfDevice.modelName,
            avatar: selfDevice.avatar,
            deviceType: selfDevice.deviceType,
            os: selfDevice.os,
            browser: selfDevice.browser,
          }
        });
      }
    }, 2500);

    pruneIntervalRef.current = setInterval(() => {
      refreshPeersList();
    }, 3000);
  }, [refreshPeersList, selfDevice, sendSignalingMessage]);

  // Initialize MQTT Fallback Broker for Serverless (Vercel) deployments
  const connectMqttFallback = useCallback(() => {
    if (mqttClientRef.current && mqttClientRef.current.connected) return;

    const assignedId = selfIdRef.current || `peer_${Math.random().toString(36).substring(2, 10)}`;
    selfIdRef.current = assignedId;
    webrtcManagerRef.current?.setSelfId(assignedId);

    setSelfDevice((prev) => ({ ...prev, id: assignedId }));

    const brokerUrl = MQTT_BROKER_URLS[0];
    const client = mqtt.connect(brokerUrl, {
      clientId: `anytransfer_${assignedId}`,
      clean: true,
      keepalive: 30,
    });

    mqttClientRef.current = client;

    client.on('connect', () => {
      setIsConnected(true);

      // Subscribe to private peer channel & global radar channel
      const peerChannel = `anytransfer/peer/${assignedId}`;
      const radarChannel = `anytransfer/radar/${activeSubnetRef.current}`;
      
      client.subscribe([peerChannel, radarChannel], (err) => {
        if (!err) {
          // Immediately announce self
          sendSignalingMessage({ type: 'announce' });
          startAnnounceLoop();
        }
      });
    });

    client.on('message', (topic, payload) => {
      try {
        const msg = JSON.parse(payload.toString());

        if (msg.peer && msg.peer.id && msg.peer.id !== selfIdRef.current) {
          const isNew = !knownPeersMapRef.current.has(msg.peer.id);
          knownPeersMapRef.current.set(msg.peer.id, {
            ...msg.peer,
            lastSeen: Date.now(),
          });
          refreshPeersList();

          if (isNew) {
            showToast(`${msg.peer.name} appeared nearby`, 'info');
          }
        } else if (msg.type === 'peer_left' && msg.peerId) {
          knownPeersMapRef.current.delete(msg.peerId);
          refreshPeersList();
        } else if (msg.type === 'signal' && msg.from && msg.data) {
          webrtcManagerRef.current?.handleSignaling(msg.from, msg.data);
        } else if (msg.type === 'relay_transfer' && msg.from && msg.data) {
          webrtcManagerRef.current?.handleRelayMessage(msg.from, msg.data);
        }
      } catch (e) {
        console.warn('[MQTT Signaling] Packet error:', e);
      }
    });

    client.on('error', (err) => {
      console.warn('[MQTT Signaling] Broker error:', err);
    });

    client.on('close', () => {
      setIsConnected(false);
    });
  }, [refreshPeersList, sendSignalingMessage, showToast, startAnnounceLoop]);

  // Connect to Signaling (Tries local WS first, falls back to MQTT WebSocket for Vercel)
  const connectSignaling = useCallback(() => {
    if (typeof window === 'undefined') return;

    if (wsRef.current) {
      wsRef.current.close();
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;

    let wsConnected = false;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    const connectionTimeout = setTimeout(() => {
      if (!wsConnected && ws.readyState !== WebSocket.OPEN) {
        console.log('[Signaling] Native WebSocket connection timed out, enabling MQTT WebSockets engine');
        ws.close();
        connectMqttFallback();
      }
    }, 1800);

    ws.onopen = () => {
      wsConnected = true;
      clearTimeout(connectionTimeout);
      setIsConnected(true);
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    };

    ws.onerror = () => {
      if (!wsConnected) {
        clearTimeout(connectionTimeout);
        console.log('[Signaling] Native WebSocket error, enabling MQTT WebSockets engine');
        connectMqttFallback();
      }
    };

    ws.onclose = () => {
      if (wsConnected) {
        setIsConnected(false);
        reconnectTimeoutRef.current = setTimeout(() => {
          connectSignaling();
        }, 2500);
      }
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);

        switch (msg.type) {
          case 'welcome': {
            setSelfDevice((prev) => {
              const savedName = typeof window !== 'undefined' ? localStorage.getItem('aetherdrop_device_name') : null;
              const savedAvatar = typeof window !== 'undefined' ? localStorage.getItem('aetherdrop_avatar') : null;
              
              const effectiveName = savedName || prev.modelName || msg.device?.name || 'Device';
              const effectiveAvatar = savedAvatar || prev.avatar || msg.device?.avatar || 'wolf';

              const updated = {
                ...prev,
                id: msg.peerId,
                name: effectiveName,
                avatar: effectiveAvatar,
                ipSubnet: msg.device?.ipSubnet,
              };
              selfIdRef.current = msg.peerId;
              webrtcManagerRef.current?.setSelfId(msg.peerId);

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
            currentRoomRef.current = msg.room || null;
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
        console.error('[Signaling] Message error:', err);
      }
    };
  }, [connectMqttFallback, roomId, showToast]);

  // Initialize WebRTC Manager
  useEffect(() => {
    const manager = new WebRTCManager({
      onSignalingSend: (to, data) => {
        sendSignalingMessage({
          type: 'signal',
          to,
          data,
        });
      },
      onRelaySend: (to, data) => {
        sendSignalingMessage({
          type: 'relay_transfer',
          to,
          data,
        });
      },
      onIncomingTransferRequest: (transfer) => {
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
  }, [sendSignalingMessage, showToast, updatePeerStatus]);

  useEffect(() => {
    connectSignaling();
    return () => {
      if (wsRef.current) wsRef.current.close();
      if (mqttClientRef.current) mqttClientRef.current.end();
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (announceIntervalRef.current) clearInterval(announceIntervalRef.current);
      if (pruneIntervalRef.current) clearInterval(pruneIntervalRef.current);
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

  // Check Client Hints for high-accuracy device model
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

          sendSignalingMessage({
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
          });
          return updated;
        });
      }
    });
  }, [roomId, sendSignalingMessage]);

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

      sendSignalingMessage({
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
      });
      return updated;
    });
    showToast(`Device name updated to "${clean}"`, 'success');
  }, [roomId, sendSignalingMessage, showToast]);

  const updateAvatar = useCallback((newAvatar: string) => {
    setSelfDevice((prev) => {
      const updated = { ...prev, avatar: newAvatar };
      try {
        localStorage.setItem('aetherdrop_avatar', newAvatar);
      } catch (e) {
        console.warn(e);
      }

      sendSignalingMessage({
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
      });
      return updated;
    });
    showToast(`Avatar set to ${newAvatar}`, 'success');
  }, [roomId, sendSignalingMessage, showToast]);

  const createRoom = useCallback(() => {
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // Leave old room if in one
    if (currentRoomRef.current && mqttClientRef.current) {
      mqttClientRef.current.unsubscribe(`anytransfer/room/${currentRoomRef.current}`);
    }

    setRoomId(code);
    currentRoomRef.current = code;
    knownPeersMapRef.current.clear();
    setPeers([]);

    // Send via WS or MQTT
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'create_room' }));
    } else if (mqttClientRef.current && mqttClientRef.current.connected) {
      const roomTopic = `anytransfer/room/${code}`;
      mqttClientRef.current.subscribe(roomTopic, (err) => {
        if (!err) {
          showToast(`Created remote room #${code}`, 'success');
          sendSignalingMessage({ type: 'announce' });
        }
      });
    }
  }, [sendSignalingMessage, showToast]);

  const joinRoom = useCallback((code: string) => {
    const clean = code.trim().toUpperCase();
    if (!clean || clean.length < 4) return;

    if (currentRoomRef.current && mqttClientRef.current) {
      mqttClientRef.current.unsubscribe(`anytransfer/room/${currentRoomRef.current}`);
    }

    setRoomId(clean);
    currentRoomRef.current = clean;
    knownPeersMapRef.current.clear();
    setPeers([]);

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'join_room', room: clean }));
    } else if (mqttClientRef.current && mqttClientRef.current.connected) {
      const roomTopic = `anytransfer/room/${clean}`;
      mqttClientRef.current.subscribe(roomTopic, (err) => {
        if (!err) {
          showToast(`Joined remote room #${clean}`, 'success');
          sendSignalingMessage({ type: 'announce' });
        }
      });
    }
  }, [sendSignalingMessage, showToast]);

  const leaveRoom = useCallback(() => {
    if (currentRoomRef.current && mqttClientRef.current) {
      mqttClientRef.current.unsubscribe(`anytransfer/room/${currentRoomRef.current}`);
    }

    sendSignalingMessage({ type: 'leave_room' });
    setRoomId(null);
    currentRoomRef.current = null;
    knownPeersMapRef.current.clear();
    setPeers([]);
    showToast('Left remote room, returned to local radar', 'info');

    if (mqttClientRef.current && mqttClientRef.current.connected) {
      mqttClientRef.current.subscribe(`anytransfer/radar/${activeSubnetRef.current}`);
      sendSignalingMessage({ type: 'announce' });
    }
  }, [sendSignalingMessage, showToast]);

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
