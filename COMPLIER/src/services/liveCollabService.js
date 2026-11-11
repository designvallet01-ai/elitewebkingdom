// ============================================================================
// Elite IDE - Real-Time Collaborative Live Workspace Service
// Powered by Supabase Realtime (Broadcast + Presence) with Local BroadcastChannel
// fallback so friends/teams can co-edit and run code live via shared links.
// ============================================================================

import { supabase } from '../supabase';

const PEER_COLORS = [
  '#38bdf8', // Sky Cyan
  '#34d399', // Emerald
  '#c084fc', // Violet
  '#fbbf24', // Amber
  '#f472b6', // Pink
  '#22d3ee'  // Cyan
];

// Generate a short, URL-friendly room ID
export function createLiveRoomId() {
  const chars = 'abcdefghjkmnpqrstuvwxyz23456789';
  let slug = '';
  for (let i = 0; i < 6; i++) {
    slug += chars[Math.floor(Math.random() * chars.length)];
  }
  return `ewk-${slug}`;
}

// Per-tab unique client identifier so even two local tabs can collaborate
let cachedTabClientId = null;
export function getTabClientId() {
  if (cachedTabClientId) return cachedTabClientId;
  try {
    const rand = Math.random().toString(36).slice(2, 8);
    cachedTabClientId = `peer_${Date.now().toString(36)}_${rand}`;
  } catch {
    cachedTabClientId = `peer_${Math.random().toString(36).slice(2, 10)}`;
  }
  return cachedTabClientId;
}

export function getColorIndexForPeer(clientId = '') {
  let hash = 0;
  for (let i = 0; i < clientId.length; i++) {
    hash = ((hash << 5) - hash + clientId.charCodeAt(i)) | 0;
  }
  return Math.abs(hash) % PEER_COLORS.length;
}

export function getColorForPeer(clientId = '') {
  return PEER_COLORS[getColorIndexForPeer(clientId)];
}

/**
 * Join a real-time collaborative workspace room.
 * Returns a controller with broadcast methods and leave().
 */
export function joinLiveWorkspace({
  roomId,
  userName = 'Developer',
  onRemoteCodePatch,
  onSyncRequest,
  onRemoteCursor,
  onRemoteRunOutput,
  onPeersChange,
  onStatusChange
}) {
  if (!roomId) return null;

  const clientId = getTabClientId();
  const colorIdx = getColorIndexForPeer(clientId);
  const color = PEER_COLORS[colorIdx];
  const displayName = (userName || 'Developer').trim() || 'Developer';

  let closed = false;
  let patchTimer = null;
  let cursorTimer = null;
  let pendingPatch = null;
  let pendingCursor = null;

  const seenEventIds = new Set();
  const trackSeen = (eventId) => {
    if (!eventId) return true;
    if (seenEventIds.has(eventId)) return false;
    seenEventIds.add(eventId);
    if (seenEventIds.size > 200) {
      const first = seenEventIds.values().next().value;
      seenEventIds.delete(first);
    }
    return true;
  };

  onStatusChange?.('connecting');

  // 1. Local BroadcastChannel for instant multi-tab sync in same browser
  let bc = null;
  try {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      bc = new BroadcastChannel(`elite_live_ws_${roomId}`);
      bc.onmessage = (evt) => {
        if (closed) return;
        const msg = evt.data;
        if (!msg || !msg.event || !msg.payload) return;
        handleIncomingEvent(msg.event, msg.payload);
      };
    }
  } catch {
    bc = null;
  }

  // 2. Supabase Realtime Channel (Broadcast + Presence)
  let channel = null;
  const localPeersMap = new Map();
  localPeersMap.set(clientId, {
    clientId,
    name: displayName,
    color,
    colorIdx,
    line: 1,
    col: 1,
    isSelf: true
  });

  const emitPeers = (presenceState = null) => {
    const merged = new Map();
    if (presenceState && typeof presenceState === 'object') {
      Object.values(presenceState).forEach((entries) => {
        if (!Array.isArray(entries)) return;
        entries.forEach((entry) => {
          if (!entry || !entry.clientId) return;
          merged.set(entry.clientId, {
            clientId: entry.clientId,
            name: entry.name || 'Collaborator',
            color: entry.color || getColorForPeer(entry.clientId),
            colorIdx: entry.colorIdx ?? getColorIndexForPeer(entry.clientId),
            line: entry.line || 1,
            col: entry.col || 1,
            isSelf: entry.clientId === clientId
          });
        });
      });
    }
    // Ensure self + any recent BroadcastChannel peers are visible
    localPeersMap.forEach((peer, id) => {
      if (!merged.has(id)) merged.set(id, peer);
    });
    onPeersChange?.(Array.from(merged.values()));
  };

  function handleIncomingEvent(event, payload) {
    if (closed || !payload || payload.senderId === clientId) return;
    if (!trackSeen(payload.eventId)) return;

    // Keep track of peer in local fallback map (helps same-browser tabs / before presence settles)
    if (payload.senderId && !localPeersMap.has(payload.senderId)) {
      localPeersMap.set(payload.senderId, {
        clientId: payload.senderId,
        name: payload.senderName || 'Collaborator',
        color: payload.color || getColorForPeer(payload.senderId),
        colorIdx: payload.colorIdx ?? getColorIndexForPeer(payload.senderId),
        line: payload.line || 1,
        col: payload.col || 1,
        isSelf: false
      });
      emitPeers(channel?.presenceState?.());
    }

    if (event === 'code_patch' || event === 'sync_state') {
      onRemoteCodePatch?.(payload);
    } else if (event === 'request_sync') {
      onSyncRequest?.(payload);
    } else if (event === 'cursor_move') {
      const existing = localPeersMap.get(payload.senderId);
      if (existing) {
        existing.line = payload.line;
        existing.col = payload.col;
      }
      onRemoteCursor?.({
        clientId: payload.senderId,
        name: payload.senderName || 'Collaborator',
        color: payload.color || getColorForPeer(payload.senderId),
        colorIdx: payload.colorIdx ?? getColorIndexForPeer(payload.senderId),
        line: payload.line || 1,
        col: payload.col || 1
      });
    } else if (event === 'run_output') {
      onRemoteRunOutput?.(payload);
    } else if (event === 'peer_leave') {
      localPeersMap.delete(payload.senderId);
      emitPeers(channel?.presenceState?.());
      onRemoteCursor?.({ clientId: payload.senderId, remove: true });
    }
  }

  const sendEvent = (event, payload) => {
    if (closed) return;
    const enriched = {
      ...payload,
      senderId: clientId,
      senderName: displayName,
      color,
      colorIdx,
      eventId: `${clientId}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
    };
    try {
      bc?.postMessage({ event, payload: enriched });
    } catch {}
    try {
      channel?.send({
        type: 'broadcast',
        event,
        payload: enriched
      });
    } catch {}
  };

  try {
    if (supabase) {
      channel = supabase.channel(`elite_live_ws_${roomId}`, {
        config: {
          broadcast: { self: false },
          presence: { key: clientId }
        }
      });

      channel
        .on('broadcast', { event: 'code_patch' }, ({ payload }) => handleIncomingEvent('code_patch', payload))
        .on('broadcast', { event: 'sync_state' }, ({ payload }) => handleIncomingEvent('sync_state', payload))
        .on('broadcast', { event: 'request_sync' }, ({ payload }) => handleIncomingEvent('request_sync', payload))
        .on('broadcast', { event: 'cursor_move' }, ({ payload }) => handleIncomingEvent('cursor_move', payload))
        .on('broadcast', { event: 'run_output' }, ({ payload }) => handleIncomingEvent('run_output', payload))
        .on('broadcast', { event: 'peer_leave' }, ({ payload }) => handleIncomingEvent('peer_leave', payload))
        .on('presence', { event: 'sync' }, () => {
          emitPeers(channel.presenceState());
        })
        .subscribe(async (status) => {
          if (closed) return;
          if (status === 'SUBSCRIBED') {
            onStatusChange?.('connected');
            try {
              await channel.track({
                clientId,
                name: displayName,
                color,
                colorIdx,
                line: 1,
                col: 1,
                joinedAt: Date.now()
              });
            } catch {}
            // Request latest workspace buffer from any peer already in the room
            sendEvent('request_sync', { ts: Date.now() });
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            // BroadcastChannel still works locally even if offline
            onStatusChange?.(bc ? 'connected' : 'error');
          }
        });
    } else {
      onStatusChange?.('connected');
    }
  } catch (err) {
    console.warn('Live workspace init error:', err);
    onStatusChange?.('error');
  }

  // Also request sync via local BroadcastChannel right away
  setTimeout(() => {
    if (!closed) {
      emitPeers(channel?.presenceState?.());
      sendEvent('request_sync', { ts: Date.now() });
    }
  }, 150);

  return {
    clientId,
    roomId,
    color,
    colorIdx,
    broadcastCodePatch(data) {
      pendingPatch = { ...data, ts: Date.now() };
      if (patchTimer) return;
      patchTimer = setTimeout(() => {
        patchTimer = null;
        if (pendingPatch && !closed) {
          const toSend = pendingPatch;
          pendingPatch = null;
          sendEvent('code_patch', toSend);
        }
      }, 110);
    },
    broadcastSyncState(data) {
      sendEvent('sync_state', { ...data, ts: Date.now() });
    },
    broadcastCursor({ line, col }) {
      pendingCursor = { line, col };
      if (cursorTimer) return;
      cursorTimer = setTimeout(() => {
        cursorTimer = null;
        if (pendingCursor && !closed) {
          const toSend = pendingCursor;
          pendingCursor = null;
          sendEvent('cursor_move', toSend);
        }
      }, 140);
    },
    broadcastRunOutput(data) {
      sendEvent('run_output', { ...data, ts: Date.now() });
    },
    updateUserName(newName) {
      const clean = (newName || 'Developer').trim() || 'Developer';
      const self = localPeersMap.get(clientId);
      if (self) self.name = clean;
      try {
        channel?.track({
          clientId,
          name: clean,
          color,
          colorIdx,
          line: self?.line || 1,
          col: self?.col || 1,
          joinedAt: Date.now()
        });
      } catch {}
    },
    leave() {
      if (closed) return;
      sendEvent('peer_leave', { ts: Date.now() });
      closed = true;
      if (patchTimer) clearTimeout(patchTimer);
      if (cursorTimer) clearTimeout(cursorTimer);
      try {
        bc?.close();
      } catch {}
      try {
        if (channel && supabase) {
          supabase.removeChannel(channel);
        }
      } catch {}
    }
  };
}

