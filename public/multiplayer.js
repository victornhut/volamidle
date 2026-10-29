(() => {
  "use strict";
  const API = "/api";
  const state = { token: null, rooms: [], room: null, socket: null, self: null, players: new Map(), x: 0, y: 0 };
  const style = document.createElement("style");
  style.textContent = `
    #mp-panel{position:fixed;z-index:99999;right:12px;top:72px;width:min(330px,calc(100vw - 24px));max-height:75vh;overflow:auto;background:#101a18f5;color:#f4e8c7;border:1px solid #b58b42;border-radius:10px;padding:12px;font:13px system-ui;box-shadow:0 8px 30px #0009}
    #mp-panel *{box-sizing:border-box} #mp-panel h3{margin:0 0 8px;font-size:16px;color:#f6d78c} #mp-panel input,#mp-panel button{font:inherit;border-radius:6px;padding:7px;border:1px solid #7b693f}
    #mp-panel input{background:#0b1210;color:#fff;width:100%;margin:3px 0} #mp-panel button{background:#3b3320;color:#ffe6a5;cursor:pointer;margin:3px 2px 3px 0}
    #mp-status{color:#b9d7a1;margin:6px 0} #mp-rooms button{display:block;width:100%;text-align:left} #mp-toggle{position:fixed;z-index:100000;right:12px;top:36px;background:#342915;color:#ffe3a0;border:1px solid #b58b42;border-radius:8px;padding:7px 10px;cursor:pointer}
    #mp-world{position:absolute;inset:0;pointer-events:none;z-index:30;overflow:hidden} .mp-avatar{position:absolute;transform:translate(-50%,-50%);text-align:center;color:#ffe6a5;text-shadow:0 1px 3px #000;font:12px system-ui;white-space:nowrap}
    .mp-avatar i{display:block;margin:auto auto 2px;width:18px;height:24px;border-radius:45% 45% 4px 4px;background:linear-gradient(#f5d28a,#9b2c22);border:1px solid #fff0b3;box-shadow:0 2px 4px #0008}
  `;
  document.head.appendChild(style);
  const toggle = document.createElement("button"); toggle.id = "mp-toggle"; toggle.textContent = "🌐 Multiplayer";
  document.body.appendChild(toggle);
  const panel = document.createElement("section"); panel.id = "mp-panel"; panel.hidden = true;
  panel.innerHTML = `<h3>Giang hồ nhiều người</h3><div id="mp-status">Đang tìm phiên đăng nhập…</div>
    <label>Tên phòng <input id="mp-room-name" maxlength="80" placeholder="Ví dụ: Võ Đang - 01"></label>
    <button id="mp-create">+ Tạo phòng</button><button id="mp-refresh">↻ Tải phòng</button>
    <div id="mp-rooms"></div><div id="mp-current"></div>
    <label>Chat phòng <input id="mp-chat-text" maxlength="1000" placeholder="Nhập tin nhắn…"></label><button id="mp-send">Gửi chat</button>
    <p style="opacity:.8;margin-bottom:0">Khi đã vào phòng, nhấn WASD hoặc phím mũi tên để cập nhật vị trí multiplayer.</p>`;
  document.body.appendChild(panel);
  const $ = id => document.getElementById(id);
  function status(text) { $("mp-status").textContent = text; }
  function getSessionToken() {
    try {
      for (let i=0;i<localStorage.length;i++) {
        const key = localStorage.key(i);
        if (!key || !key.endsWith("-auth-token")) continue;
        const value = JSON.parse(localStorage.getItem(key) || "null");
        const token = value?.access_token || value?.currentSession?.access_token || value?.session?.access_token;
        if (token) return token;
      }
    } catch {}
    return null;
  }
  async function api(path, options={}) {
    state.token = getSessionToken();
    if (!state.token) throw new Error("Không tìm thấy phiên Supabase. Hãy đăng nhập tài khoản trong game rồi mở lại.");
    const response = await fetch(API + path, { ...options, headers: {
      "content-type":"application/json", "authorization":"Bearer " + state.token, ...(options.headers || {})
    }});
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.message || data.error || "Yêu cầu thất bại");
    return data;
  }
  function drawPlayers() {
    let world = document.getElementById("mp-world");
    if (!world) {
      world = document.createElement("div"); world.id = "mp-world";
      const battle = document.getElementById("battle");
      if (battle) { if (getComputedStyle(battle).position === "static") battle.style.position = "relative"; battle.appendChild(world); }
      else document.body.appendChild(world);
    }
    world.innerHTML = "";
    const rect = world.getBoundingClientRect();
    for (const p of state.players.values()) {
      const el = document.createElement("div"); el.className = "mp-avatar";
      const x = Math.max(24, Math.min(Math.max(24, rect.width-24), rect.width/2 + Number(p.x || 0)));
      const y = Math.max(30, Math.min(Math.max(30, rect.height-30), rect.height/2 + Number(p.y || 0)));
      el.style.left = x + "px"; el.style.top = y + "px";
      const sprite = document.createElement("i"); el.appendChild(sprite);
      const name = document.createElement("span"); name.textContent = p.username || "Người chơi"; el.appendChild(name);
      world.appendChild(el);
    }
  }
  function connect(room) {
    if (state.socket) state.socket.close();
    state.room = room; state.players.clear(); state.x=0; state.y=0;
    const scheme = location.protocol === "https:" ? "wss:" : "ws:";
    const ws = new WebSocket(scheme + "//" + location.host + API + "/ws/rooms/" + room.id);
    state.socket = ws;
    ws.onopen = () => { ws.send(JSON.stringify({type:"auth", access_token:getSessionToken()})); status("Đang xác thực và vào " + room.name + "…"); };
    ws.onmessage = event => {
      let msg; try { msg=JSON.parse(event.data); } catch { return; }
      if (msg.type === "error") { status("Lỗi: " + msg.error); return; }
      if (msg.type === "ready") {
        state.self = msg.self; state.players.clear(); (msg.players || []).forEach(p => state.players.set(p.user_id,p));
        status("Đã vào phòng: " + room.name + " · " + state.players.size + " người");
        $("mp-current").textContent = "Phòng: " + room.name + " (" + room.room_code + ")";
        drawPlayers(); return;
      }
      if (msg.type === "player_joined" || msg.type === "player_moved") state.players.set(msg.player.user_id,msg.player);
      if (msg.type === "player_left") state.players.delete(msg.user_id);
      if (msg.type === "chat") {
        const line = document.createElement("div"); line.textContent = (msg.message.username || "Người chơi") + ": " + msg.message.message;
        $("mp-current").appendChild(line);
      }
      drawPlayers();
    };
    ws.onclose = () => { if (state.socket === ws) status("Đã ngắt kết nối phòng."); };
    ws.onerror = () => status("Không kết nối được WebSocket. Kiểm tra cấu hình Worker.");
  }
  async function loadRooms() {
    const data = await api("/rooms");
    state.rooms = data.rooms || [];
    const root = $("mp-rooms"); root.innerHTML = "";
    if (!state.rooms.length) { root.textContent = "Chưa có phòng công khai."; return; }
    state.rooms.forEach(room => {
      const b = document.createElement("button");
      b.textContent = room.name + " · " + room.room_code + " · " + room.status;
      b.onclick = async () => {
        try { await api("/rooms/" + room.id + "/join", {method:"POST",body:"{}"}); connect(room); }
        catch(e) { status(e.message); }
      };
      root.appendChild(b);
    });
  }
  toggle.onclick = () => { panel.hidden = !panel.hidden; if (!panel.hidden) refresh(); };
  async function refresh() {
    try { state.token=getSessionToken(); if (!state.token) { status("Chưa tìm thấy phiên đăng nhập Supabase. Đăng nhập game trước."); return; } await loadRooms(); status("Đã kết nối API. Chọn phòng hoặc tạo phòng."); }
    catch(e) { status(e.message); }
  }
  $("mp-refresh").onclick = refresh;
  $("mp-create").onclick = async () => {
    try {
      const name = $("mp-room-name").value.trim();
      const data = await api("/rooms", {method:"POST",body:JSON.stringify({name:name || "Giang hồ " + Math.floor(Math.random()*900+100)})});
      await loadRooms(); connect(data.room);
    } catch(e) { status(e.message); }
  };
  $("mp-send").onclick = () => {
    const text = $("mp-chat-text").value.trim();
    if (text && state.socket?.readyState === WebSocket.OPEN) {
      state.socket.send(JSON.stringify({type:"chat",message:text})); $("mp-chat-text").value="";
    } else if (!state.room) status("Hãy vào phòng trước.");
  };
  $("mp-chat-text").addEventListener("keydown", e => { if(e.key==="Enter") $("mp-send").click(); });
  window.addEventListener("keydown", e => {
    if (panel.hidden || !state.room || !state.socket || state.socket.readyState !== WebSocket.OPEN || /INPUT|TEXTAREA/.test(e.target.tagName)) return;
    const k=e.key.toLowerCase(); const step=12;
    if (k==="arrowleft"||k==="a") state.x-=step;
    else if (k==="arrowright"||k==="d") state.x+=step;
    else if (k==="arrowup"||k==="w") state.y-=step;
    else if (k==="arrowdown"||k==="s") state.y+=step;
    else return;
    e.preventDefault(); state.socket.send(JSON.stringify({type:"move",x:state.x,y:state.y}));
  });
  window.addEventListener("resize",drawPlayers);
})();