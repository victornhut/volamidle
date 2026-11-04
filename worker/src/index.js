const JSON_HEADERS = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "no-store",
  "x-content-type-options": "nosniff"
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: JSON_HEADERS });
}

// Chuẩn hóa SUPABASE_URL: chỉ lấy phần gốc (https://xxx.supabase.co), bỏ mọi đường dẫn thừa như /rest/v1.
function normalizeSupabaseUrl(raw) {
  const text = String(raw || "").trim();
  if (!text) return "";
  try {
    return new URL(/^https?:\/\//i.test(text) ? text : `https://${text}`).origin;
  } catch {
    return text.replace(/\/+$/, "");
  }
}

function supabaseConfig(env) {
  const url = normalizeSupabaseUrl(env.SUPABASE_URL);
  const key = (env.SUPABASE_SERVICE_ROLE_KEY || "").trim();
  if (!url || !key) throw new Error("Thiếu SUPABASE_URL hoặc SUPABASE_SERVICE_ROLE_KEY.");
  return { url, key };
}

async function db(env, path, options = {}) {
  const { url, key } = supabaseConfig(env);
  const headers = new Headers(options.headers || {});
  headers.set("apikey", key);
  if (key.startsWith("eyJ")) headers.set("authorization", `Bearer ${key}`);
  headers.set("content-type", "application/json");
  const response = await fetch(`${url}/rest/v1/${path}`, { ...options, headers });
  const body = await response.text();
  if (!response.ok) {
    throw new Error(`Supabase REST ${response.status}: ${body.slice(0, 500)}`);
  }
  return body ? JSON.parse(body) : null;
}

async function checkToken(env, token) {
  const { url, key } = supabaseConfig(env);
  const anon = (env.SUPABASE_ANON_KEY || "").trim();
  const candidates = [...new Set([anon, key].filter(Boolean))];
  let detail = "";
  for (const apikey of candidates) {
    try {
      const response = await fetch(`${url}/auth/v1/user`, {
        headers: { apikey, authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const user = await response.json();
        if (user && user.id) return { id: user.id, token };
        detail = "auth/v1/user không trả về id";
      } else {
        detail = `auth/v1/user ${response.status}: ${(await response.text()).slice(0, 200)}`;
      }
    } catch (error) {
      detail = `không gọi được Supabase: ${error.message || error}`;
    }
  }
  return { fail: detail || "không có khóa Supabase" };
}

async function authenticate(request, env) {
  const authorization = request.headers.get("authorization") || "";
  const token = authorization.replace(/^Bearer\s+/i, "").trim();
  if (!token) return { fail: "thiếu access token trong yêu cầu" };
  return checkToken(env, token);
}

function randomRoomCode() {
  const bytes = crypto.getRandomValues(new Uint8Array(5));
  return Array.from(bytes, b => (b % 36).toString(36)).join("").toUpperCase();
}

const WORLD_ROOM_ID = "00000000-0000-4000-8000-0000000a11d0";
let worldRoomReady = false;

// Phòng chung cho cả thế giới: tự tạo nếu chưa có, và thêm người chơi vào phòng.
async function ensureWorldRoom(env, userId) {
  if (!worldRoomReady) {
    await db(env, "game_rooms?on_conflict=id", {
      method: "POST",
      headers: { Prefer: "resolution=ignore-duplicates,return=minimal" },
      body: JSON.stringify([{
        id: WORLD_ROOM_ID, room_code: "WORLD", name: "Giang hồ", region: "default",
        max_players: 500, created_by: userId, is_public: false, status: "open"
      }])
    });
    worldRoomReady = true;
  }
  await db(env, "room_members?on_conflict=room_id,user_id", {
    method: "POST",
    headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
    body: JSON.stringify([{ room_id: WORLD_ROOM_ID, user_id: userId, role: "player", last_seen_at: new Date().toISOString() }])
  });
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
        version: "pk-1",
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
        if (!user || user.fail) {
          return json({ ok: false, error: "UNAUTHORIZED", message: "Vui lòng đăng nhập lại.", detail: user?.fail || "" }, 401);
        }

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

        if (url.pathname === "/api/world/join" && request.method === "POST") {
          await ensureWorldRoom(env, user.id);
          return json({ ok: true, room_id: WORLD_ROOM_ID });
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

// PK: cấp tối thiểu, tầm đánh tối đa (server cho phép), thời gian bất khả xâm phạm sau khi chết.
const PK_MIN_LV = 30;
const PK_RANGE = 380;
const PK_SAFE_MS = 8000;

export class WorldRoom {
  constructor(state, env) {
    this.state = state;
    this.env = env;
    this.lastMessageAt = new Map();
    this.pkHitAt = new Map();
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
    server.serializeAttachment({ authenticated: false, roomId: this.roomIdValue });
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
    if (attachment.roomId) this.roomIdValue = attachment.roomId;

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
      // Một tài khoản chỉ giữ một kết nối: đóng kết nối cũ nếu có.
      for (const other of this.state.getWebSockets()) {
        if (other === ws) continue;
        const a = other.deserializeAttachment();
        if (a?.authenticated && a.userId === identity.id) {
          try { other.close(1000, "Replaced by a new connection"); } catch {}
        }
      }
      attachment = {
        authenticated: true,
        roomId: this.roomId(),
        userId: identity.id,
        username: "Người chơi",
        role: members[0].role,
        map: "", x: 0, y: 0, name: "", f: "", sx: 0, lvl: 1, dir: 0, mv: 0, j: null,
        pk: 0, hp: 100, safeUntil: 0, lastAtk: "", lastAtkAt: 0
      };
      ws.serializeAttachment(attachment);
      ws.send(JSON.stringify({ type: "ready", self: this.publicPlayer(attachment), players: [] }));
      await this.recordEvent(identity.id, "player_joined", {});
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
      const clean = (value, max) => typeof value === "string"
        ? value.replace(/[\u0000-\u001f\u007f<>]/g, "").trim().slice(0, max) : "";
      const int = (value, min, max, fallback) => {
        const n = Math.trunc(Number(value));
        return Number.isFinite(n) ? Math.max(min, Math.min(max, n)) : fallback;
      };

      const oldMap = attachment.map || "";
      const newMap = clean(message.map, 60);
      attachment.map = newMap;
      attachment.x = x;
      attachment.y = y;
      attachment.name = clean(message.name, 24) || attachment.name || "Vô danh";
      const fac = clean(message.f, 24);
      if (/^[A-Za-z0-9_]{1,24}$/.test(fac)) attachment.f = fac;
      attachment.sx = int(message.sx, 0, 1, attachment.sx || 0);
      attachment.lvl = int(message.lvl, 1, 999, attachment.lvl || 1);
      attachment.dir = int(message.dir, 0, 15, 0);
      attachment.mv = int(message.mv, 0, 1, 0);
      attachment.pk = message.pk && attachment.lvl >= PK_MIN_LV && newMap ? 1 : 0;
      attachment.hp = int(message.hp, 0, 100, 100);
      if (message.j === null) {
        attachment.j = null;
      } else if (message.j && typeof message.j === "object") {
        const text = JSON.stringify(message.j);
        if (text.length <= 400) attachment.j = message.j;
      }
      ws.serializeAttachment(attachment);

      if (oldMap && oldMap !== newMap) {
        this.broadcast({ type: "player_left", user_id: attachment.userId }, ws, oldMap);
      }
      if (newMap && oldMap !== newMap) {
        ws.send(JSON.stringify({ type: "players", map: newMap, players: this.getPlayers(newMap, ws) }));
      }
      if (newMap) {
        this.broadcast({ type: "player_moved", player: { ...this.publicPlayer(attachment), at: int(message.at, 0, 1, 0) } }, ws, newMap);
      }
      return;
    }

    if (message.type === "pk_hit") {
      this.handlePkHit(attachment, message, now);
      return;
    }

    if (message.type === "pk_res") {
      await this.handlePkRes(ws, attachment, message, now);
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
        id: saved?.id ?? null, user_id: attachment.userId, username: attachment.name || attachment.username,
        message: text, created_at: saved?.created_at || new Date().toISOString()
      }}, null, attachment.map || null);
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
    try { ws.close(code && code >= 1000 && code < 1005 ? code : 1000, reason); } catch {}
  }

  async webSocketError(ws) {
    await this.removeSocket(ws);
  }

  async removeSocket(ws) {
    const attachment = ws.deserializeAttachment() || {};
    if (!attachment.userId) return;
    if (attachment.map) {
      this.broadcast({ type: "player_left", user_id: attachment.userId }, ws, attachment.map);
    }
    await this.recordEvent(attachment.userId, "player_left", {});
  }

  findSocket(userId, map) {
    for (const socket of this.state.getWebSockets()) {
      try {
        const a = socket.deserializeAttachment();
        if (a?.authenticated && a.userId === userId && a.map === map) return { socket, a };
      } catch {
        // Ignore closed sockets.
      }
    }
    return null;
  }

  // Người tấn công báo một đòn đánh. Worker kiểm tra điều kiện rồi chuyển cho nạn nhân tự tính sát thương.
  handlePkHit(me, message, now) {
    const toId = typeof message.to === "string" ? message.to.slice(0, 40) : "";
    if (!toId || toId === me.userId) return;
    if (!me.pk || !me.map || me.lvl < PK_MIN_LV || (me.safeUntil || 0) > now) return;
    const target = this.findSocket(toId, me.map);
    if (!target) return;
    const t = target.a;
    if (!t.pk || t.lvl < PK_MIN_LV || (t.safeUntil || 0) > now) return;
    if (Math.hypot((t.x || 0) - (me.x || 0), (t.y || 0) - (me.y || 0)) > PK_RANGE) return;
    const dps = Number(message.dps);
    if (!Number.isFinite(dps) || dps <= 0) return;

    const key = `${me.userId}>${toId}`;
    if (now - (this.pkHitAt.get(key) || 0) < 350) return;
    if (this.pkHitAt.size > 2000) this.pkHitAt.clear();
    this.pkHitAt.set(key, now);

    t.lastAtk = me.userId;
    t.lastAtkAt = now;
    target.socket.serializeAttachment(t);
    target.socket.send(JSON.stringify({
      type: "pk_hit", from: me.userId, name: me.name || "Vô danh", lvl: me.lvl, dps: Math.min(dps, 1e12)
    }));
  }

  // Nạn nhân báo kết quả (sát thương đã nhận, có chết không). Chỉ chấp nhận nếu vừa bị đúng người đó đánh.
  async handlePkRes(ws, me, message, now) {
    const toId = typeof message.to === "string" ? message.to.slice(0, 40) : "";
    if (!toId || me.lastAtk !== toId || now - (me.lastAtkAt || 0) > 5000) return;
    const d = Math.max(0, Math.min(1e12, Math.round(Number(message.d) || 0)));
    const dead = message.dead ? 1 : 0;
    const attacker = this.findSocket(toId, me.map);
    if (attacker) {
      attacker.socket.send(JSON.stringify({ type: "pk_res", from: me.userId, d, dead }));
    }
    if (dead && (me.safeUntil || 0) <= now) {
      me.safeUntil = now + PK_SAFE_MS;
      me.lastAtk = "";
      me.hp = 0;
      ws.serializeAttachment(me);
      this.broadcast({
        type: "pk_kill",
        killer: attacker?.a.name || "Vô danh",
        victim: me.name || "Vô danh",
        killer_id: toId,
        victim_id: me.userId
      }, null, me.map);
      await this.recordEvent(me.userId, "pk_death", { killer: toId, map: me.map });
    }
  }

  roomId() {
    return this.roomIdValue;
  }

  async authenticateToken(token) {
    try {
      const result = await checkToken(this.env, token);
      return result.id ? { id: result.id } : null;
    } catch {
      return null;
    }
  }

  config() {
    const url = normalizeSupabaseUrl(this.env.SUPABASE_URL);
    const key = (this.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();
    if (!url || !key) throw new Error("Supabase env vars missing");
    return { url, key };
  }

  async db(path, options = {}) {
    const { url, key } = this.config();
    const headers = new Headers(options.headers || {});
    headers.set("apikey", key);
    if (key.startsWith("eyJ")) headers.set("authorization", `Bearer ${key}`);
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
    return {
      user_id: player.userId,
      name: player.name || player.username || "Vô danh",
      x: player.x || 0, y: player.y || 0,
      map: player.map || "",
      f: player.f || "", sx: player.sx || 0, lvl: player.lvl || 1,
      dir: player.dir || 0, mv: player.mv || 0,
      j: player.j || null,
      pk: player.pk || 0,
      hp: player.hp ?? 100,
      safe: (player.safeUntil || 0) > Date.now() ? 1 : 0
    };
  }

  // Danh sách người chơi trong cùng một bản đồ (trừ chính socket yêu cầu).
  getPlayers(map, except = null) {
    const players = [];
    for (const socket of this.state.getWebSockets()) {
      if (socket === except) continue;
      try {
        const a = socket.deserializeAttachment();
        if (a?.authenticated && a.map && a.map === map) players.push(this.publicPlayer(a));
      } catch {
        // Ignore closed sockets.
      }
    }
    return players;
  }

  // Gửi cho tất cả socket đã đăng nhập; nếu có `map` thì chỉ gửi cho người cùng bản đồ.
  broadcast(payload, except = null, map = null) {
    const serialized = JSON.stringify(payload);
    for (const socket of this.state.getWebSockets()) {
      if (socket === except) continue;
      try {
        const a = socket.deserializeAttachment();
        if (!a?.authenticated) continue;
        if (map && a.map !== map) continue;
        socket.send(serialized);
      } catch {
        // Ignore closed sockets.
      }
    }
  }
}
