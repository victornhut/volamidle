const JSON_HEADERS = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "no-store",
  "x-content-type-options": "nosniff"
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: JSON_HEADERS });
}

function supabaseConfig(env) {
  const url = (env.SUPABASE_URL || "").replace(/\/$/, "");
  const key = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Thiếu SUPABASE_URL hoặc SUPABASE_SERVICE_ROLE_KEY.");
  return { url, key };
}

async function db(env, path, options = {}) {
  const { url, key } = supabaseConfig(env);
  const headers = new Headers(options.headers || {});
  headers.set("apikey", key);
  headers.set("authorization", `Bearer ${key}`);
  headers.set("content-type", "application/json");
  const response = await fetch(`${url}/rest/v1/${path}`, { ...options, headers });
  const body = await response.text();
  if (!response.ok) {
    throw new Error(`Supabase REST ${response.status}: ${body.slice(0, 500)}`);
  }
  return body ? JSON.parse(body) : null;
}

async function authenticate(request, env) {
  const authorization = request.headers.get("authorization") || "";
  const token = authorization.replace(/^Bearer\s+/i, "");
  if (!token) return null;
  const { url, key } = supabaseConfig(env);
  const response = await fetch(`${url}/auth/v1/user`, {
    headers: { apikey: env.SUPABASE_ANON_KEY || key, authorization: `Bearer ${token}` }
  });
  if (!response.ok) return null;
  const user = await response.json();
  return user && user.id ? { id: user.id, token } : null;
}

function randomRoomCode() {
  const bytes = crypto.getRandomValues(new Uint8Array(5));
  return Array.from(bytes, b => (b % 36).toString(36)).join("").toUpperCase();
}

function roomStub(env, roomId) {
  return env.WORLD_ROOM.get(env.WORLD_ROOM.idFromName(roomId));
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/health" && request.method === "GET") {
      return json({
        ok: true,
        service: "volamidle",
        runtime: "cloudflare-workers",
        durableObjects: Boolean(env.WORLD_ROOM),
        supabaseConfigured: Boolean(env.SUPABASE_URL && env.SUPABASE_ANON_KEY && env.SUPABASE_SERVICE_ROLE_KEY),
        time: new Date().toISOString()
      });
    }

    if (url.pathname === "/api/ws" || url.pathname.startsWith("/api/ws/rooms/")) {
      const match = url.pathname.match(/^\/api\/ws\/rooms\/([0-9a-f-]{36})$/i);
      if (!match) return json({ ok: false, error: "INVALID_ROOM_ID" }, 400);
      if (request.headers.get("Upgrade")?.toLowerCase() !== "websocket") {
        return json({ ok: false, error: "WEBSOCKET_UPGRADE_REQUIRED" }, 426);
      }
      return roomStub(env, match[1]).fetch(request);
    }

    if (url.pathname.startsWith("/api/")) {
      try {
        const user = await authenticate(request, env);
        if (!user) return json({ ok: false, error: "UNAUTHORIZED", message: "Vui lòng đăng nhập lại." }, 401);

        if (url.pathname === "/api/rooms" && request.method === "GET") {
          const rooms = await db(env, "game_rooms?select=id,room_code,name,region,max_players,is_public,status,created_at&is_public=eq.true&status=neq.closed&order=created_at.desc&limit=50");
          return json({ ok: true, rooms });
        }

        if (url.pathname === "/api/rooms" && request.method === "POST") {
          const input = await request.json().catch(() => ({}));
          const name = typeof input.name === "string" ? input.name.trim().slice(0, 80) : "";
          const region = typeof input.region === "string" ? input.region.trim().slice(0, 40) : "default";
          const maxPlayers = Number.isInteger(input.max_players) ? Math.max(1, Math.min(500, input.max_players)) : 50;
          if (!name) return json({ ok: false, error: "ROOM_NAME_REQUIRED" }, 400);
          const created = await db(env, "game_rooms", {
            method: "POST",
            headers: { Prefer: "return=representation" },
            body: JSON.stringify([{ room_code: randomRoomCode(), name, region: region || "default", max_players: maxPlayers, created_by: user.id, is_public: true, status: "open" }])
          });
          const room = created?.[0];
          if (!room) throw new Error("Supabase không trả về phòng vừa tạo.");
          await db(env, "room_members", {
            method: "POST",
            headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
            body: JSON.stringify([{ room_id: room.id, user_id: user.id, role: "owner" }])
          });
          return json({ ok: true, room }, 201);
        }

        const joinMatch = url.pathname.match(/^\/api\/rooms\/([0-9a-f-]{36})\/join$/i);
        if (joinMatch && request.method === "POST") {
          const roomId = joinMatch[1];
          const rooms = await db(env, `game_rooms?id=eq.${roomId}&select=id,room_code,name,max_players,status&limit=1`);
          const room = rooms?.[0];
          if (!room || room.status === "closed") return json({ ok: false, error: "ROOM_NOT_FOUND" }, 404);
          const members = await db(env, `room_members?room_id=eq.${roomId}&select=user_id`);
          const isMember = (members || []).some(member => member.user_id === user.id);
          if (!isMember && (members || []).length >= room.max_players) {
            return json({ ok: false, error: "ROOM_FULL" }, 409);
          }
          await db(env, "room_members", {
            method: "POST",
            headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
            body: JSON.stringify([{ room_id: roomId, user_id: user.id, role: "player", last_seen_at: new Date().toISOString() }])
          });
          return json({ ok: true, room });
        }

        return json({ ok: false, error: "NOT_FOUND" }, 404);
      } catch (error) {
        return json({ ok: false, error: "SERVER_ERROR", message: error.message || "Lỗi máy chủ." }, 500);
      }
    }

    if (!env.ASSETS) {
      return new Response("Thiếu binding ASSETS. Kiểm tra assets.directory trong wrangler.jsonc.", {
        status: 500, headers: { "content-type": "text/plain; charset=utf-8" }
      });
    }

    const assetResponse = await env.ASSETS.fetch(request);
    const headers = new Headers(assetResponse.headers);
    headers.set("x-content-type-options", "nosniff");
    headers.set("referrer-policy", "strict-origin-when-cross-origin");
    headers.set("permissions-policy", "camera=(), microphone=(), geolocation=()");
    if (url.pathname === "/" || url.pathname.endsWith(".html")) headers.set("cache-control", "no-cache");
    return new Response(assetResponse.body, { status: assetResponse.status, statusText: assetResponse.statusText, headers });
  }
};

export class WorldRoom {
  constructor(state, env) {
    this.state = state;
    this.env = env;
    this.players = new Map();
    this.lastMessageAt = new Map();
  }

  async fetch(request) {
    const roomMatch = new URL(request.url).pathname.match(/^\/api\/ws\/rooms\/([0-9a-f-]{36})$/i);
    if (!roomMatch) return json({ ok: false, error: "INVALID_ROOM_ID" }, 400);
    this.roomIdValue = roomMatch[1];
    if (request.headers.get("Upgrade")?.toLowerCase() !== "websocket") {
      return json({ ok: false, error: "WEBSOCKET_UPGRADE_REQUIRED" }, 426);
    }
    const pair = new WebSocketPair();
    const client = pair[0];
    const server = pair[1];
    this.state.acceptWebSocket(server);
    server.serializeAttachment({ authenticated: false, userId: null, username: null, x: 0, y: 0 });
    server.send(JSON.stringify({ type: "connected", message: "Gửi access_token bằng gói auth để tham gia phòng." }));
    return new Response(null, { status: 101, webSocket: client });
  }

  async webSocketMessage(ws, rawMessage) {
    let message;
    try {
      if (typeof rawMessage !== "string" || rawMessage.length > 5000) throw new Error("INVALID_MESSAGE");
      message = JSON.parse(rawMessage);
    } catch {
      ws.send(JSON.stringify({ type: "error", error: "INVALID_JSON" }));
      return;
    }

    let attachment = ws.deserializeAttachment() || { authenticated: false };
    if (!attachment.authenticated) {
      if (message.type !== "auth" || typeof message.access_token !== "string") {
        ws.send(JSON.stringify({ type: "error", error: "AUTH_REQUIRED" }));
        ws.close(1008, "Authentication required");
        return;
      }
      const identity = await this.authenticateToken(message.access_token);
      if (!identity) {
        ws.send(JSON.stringify({ type: "error", error: "INVALID_TOKEN" }));
        ws.close(1008, "Invalid token");
        return;
      }
      const members = await this.db(`room_members?room_id=eq.${this.roomId()}&user_id=eq.${identity.id}&select=user_id,role&limit=1`);
      if (!members?.length) {
        ws.send(JSON.stringify({ type: "error", error: "JOIN_ROOM_FIRST" }));
        ws.close(1008, "Join room first");
        return;
      }
      const profiles = await this.db(`player_profiles?user_id=eq.${identity.id}&select=username,display_name&limit=1`);
      const profile = profiles?.[0];
      attachment = {
        authenticated: true,
        userId: identity.id,
        username: profile?.display_name || profile?.username || "Người chơi",
        role: members[0].role,
        x: 0,
        y: 0
      };
      ws.serializeAttachment(attachment);
      this.players.set(identity.id, { ws, ...attachment });
      this.broadcast({ type: "player_joined", player: this.publicPlayer(attachment) }, ws);
      ws.send(JSON.stringify({ type: "ready", self: this.publicPlayer(attachment), players: this.getPlayers() }));
      await this.recordEvent(identity.id, "player_joined", { username: attachment.username });
      return;
    }

    const now = Date.now();
    const last = this.lastMessageAt.get(attachment.userId) || 0;
    if (now - last < 40) return;
    this.lastMessageAt.set(attachment.userId, now);

    if (message.type === "move") {
      const x = Number(message.x);
      const y = Number(message.y);
      if (!Number.isFinite(x) || !Number.isFinite(y) || Math.abs(x) > 100000 || Math.abs(y) > 100000) {
        ws.send(JSON.stringify({ type: "error", error: "INVALID_POSITION" }));
        return;
      }
      attachment.x = x;
      attachment.y = y;
      ws.serializeAttachment(attachment);
      this.players.set(attachment.userId, { ws, ...attachment });
      this.broadcast({ type: "player_moved", player: this.publicPlayer(attachment) }, ws);
      return;
    }

    if (message.type === "chat") {
      const text = typeof message.message === "string" ? message.message.trim().slice(0, 1000) : "";
      if (!text) return;
      const rows = await this.db("chat_messages", {
        method: "POST",
        headers: { Prefer: "return=representation" },
        body: JSON.stringify([{ room_id: this.roomId(), user_id: attachment.userId, message: text }])
      });
      const saved = rows?.[0];
      this.broadcast({ type: "chat", message: {
        id: saved?.id ?? null, user_id: attachment.userId, username: attachment.username,
        message: text, created_at: saved?.created_at || new Date().toISOString()
      }});
      return;
    }

    if (message.type === "ping") {
      ws.send(JSON.stringify({ type: "pong", time: Date.now() }));
    } else {
      ws.send(JSON.stringify({ type: "error", error: "UNKNOWN_MESSAGE_TYPE" }));
    }
  }

  async webSocketClose(ws, code, reason) {
    await this.removeSocket(ws);
    ws.close(code, reason);
  }

  async webSocketError(ws) {
    await this.removeSocket(ws);
  }

  async removeSocket(ws) {
    const attachment = ws.deserializeAttachment() || {};
    if (!attachment.userId) return;
    const current = this.players.get(attachment.userId);
    if (current?.ws === ws) {
      this.players.delete(attachment.userId);
      this.broadcast({ type: "player_left", user_id: attachment.userId });
      await this.recordEvent(attachment.userId, "player_left", {});
    }
  }

  roomId() {
    return this.roomIdValue;
  }

  async authenticateToken(token) {
    try {
      const { url, key } = this.config();
      const response = await fetch(`${url}/auth/v1/user`, {
        headers: { apikey: this.env.SUPABASE_ANON_KEY || key, authorization: `Bearer ${token}` }
      });
      if (!response.ok) return null;
      const user = await response.json();
      if (!user?.id) return null;
      return { id: user.id };
    } catch {
      return null;
    }
  }

  config() {
    const url = (this.env.SUPABASE_URL || "").replace(/\/$/, "");
    const key = this.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) throw new Error("Supabase env vars missing");
    return { url, key };
  }

  async db(path, options = {}) {
    const { url, key } = this.config();
    const headers = new Headers(options.headers || {});
    headers.set("apikey", key);
    headers.set("authorization", `Bearer ${key}`);
    headers.set("content-type", "application/json");
    const response = await fetch(`${url}/rest/v1/${path}`, { ...options, headers });
    const body = await response.text();
    if (!response.ok) throw new Error(`Supabase REST ${response.status}: ${body.slice(0, 300)}`);
    return body ? JSON.parse(body) : null;
  }

  async recordEvent(userId, eventType, payload) {
    try {
      await this.db("game_events", {
        method: "POST",
        headers: { Prefer: "return=minimal" },
        body: JSON.stringify([{ room_id: this.roomId(), user_id: userId, event_type: eventType, payload }])
      });
    } catch {
      // Realtime presence must keep working even if audit logging is temporarily unavailable.
    }
  }

  publicPlayer(player) {
    return { user_id: player.userId, username: player.username, x: player.x || 0, y: player.y || 0 };
  }

  getPlayers() {
    return Array.from(this.players.values(), player => this.publicPlayer(player));
  }

  broadcast(payload, except = null) {
    const serialized = JSON.stringify(payload);
    for (const socket of this.state.getWebSockets()) {
      if (socket === except) continue;
      try {
        const attachment = socket.deserializeAttachment();
        if (attachment?.authenticated) socket.send(serialized);
      } catch {
        // Ignore closed sockets.
      }
    }
  }
}
