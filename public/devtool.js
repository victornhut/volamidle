/**
 * Võ Lâm Idle - Dev Control Suite v3.1
 * 1. True Draggable Floating Button (#devFloatBtn) with position memory
 * 2. Phân hệ 1: Quét Toàn Bộ Server & Lấy Đồ
 *    - Quét trực tiếp Hoàng Kim Môn Phái, Bạch Kim, Thần Mã (Ngựa), Thú Điển, Tiêu Hao & KTC, Huyền Tinh & Đá
 *    - Lấy lẻ từng món (+ Lấy) hoặc nạp nguyên bộ (+ Bộ)
 *    - Fill Full 48/48 Mã Trường, Mở Full Thú Điển, Mở Full Danh Hiệu, Quét Online
 *    - Hover Tooltip xem trước chi tiết chỉ số
 * 3. Phân hệ 2: Tăng Tốc & Hack Chiến Đấu
 *    - Tốc độ x1 - x20, 1-Hit Kill, Bất Tử God Mode, +10M Lượng, +100k KNB, Lv 90/150, Tẩy tủy
 */
(async function() {
  'use strict';

  // =========================================================================
  // TỰ ĐỘNG NẠP APP.JS NGUYÊN GỐC & INJECT BRIDGE TRONG BỘ NHỚ
  // (HOÀN TOÀN KHÔNG CHỈNH SỬA FILE app.js TRÊN Ổ ĐĨA!)
  // =========================================================================
  async function loadAppEngine() {
    if (window.__GAME) return true;
    try {
      const res = await fetch('app.js?v=753&t=' + Date.now());
      if (!res.ok) throw new Error('HTTP ' + res.status);
      let code = await res.text();

      // Hook 1-Hit Kill trong bộ nhớ (hỗ trợ cả v753 C3 và v668 ji)
      code = code.replace(
        'C3=function(A,n){n.aggro=!0,',
        'C3=function(A,n){if(window.__devOneHit&&n){n.hp=0;if(A){A.useAR=!1;A.crit=100}}n.aggro=!0,'
      );
      code = code.replace(
        'ji=function(A,n){n.aggro=!0,',
        'ji=function(A,n){if(window.__devOneHit&&n){n.hp=0;if(A){A.useAR=!1;A.crit=100}}n.aggro=!0,'
      );

      // Hook Tốc độ game trong bộ nhớ (nhân delta time n, không đụng requestAnimationFrame gốc)
      code = code.replace(
        'const n=Math.min(.25,(A-ZP)/1e3);',
        'const n=Math.min(.25,(A-ZP)/1e3)*(window.__devSpeed||1);'
      );

      // Hook Bất tử (God Mode) trong bộ nhớ (chặn trừ máu người chơi)
      code = code.replace(
        'if(c.life-=e,',
        'if(window.__devGodMode?0:(c.life-=e),'
      );

      // Hook bảo vệ Chuồng Thú: chặn RangeError nếu petBox.length > 6
      code = code.replace(
        '{length:Lt-A.petBox.length}',
        '{length:Math.max(0,Lt-A.petBox.length)}'
      );

      // Hook Hồng Bao & Đại Hồng Bao: Cho phép mở mượt mà khi chơi offline hoặc dùng đồ GM
      code = code.replace(
        'if(!X8())return M("Cần đăng nhập để mở Hồng Bao");',
        'if(!X8()||window.__openHbOffline){if(!X8()||(await window.__openHbOffline(A,n))){return;}}'
      );
      code = code.replace(
        'if(!X8()){d1("hb",0),d1("dhb",0);return}',
        'if(!X8()){return;}'
      );
      code = code.replace(
        '(O2.off=!0,d1("hb",0),d1("dhb",0))',
        '(O2.off=!0)'
      );
      code = code.replace(
        'if(a>n)for(const s of e)',
        'if(false&&a>n)for(const s of e)'
      );

      // Inject Bridge window.__GAME vào cuối closure trước })(); để GM Panel điều khiển
      const bridge = `;window.__GAME={
        get o(){return typeof D!=="undefined"?D:(typeof r!=="undefined"?r:null)},
        get l(){return typeof c!=="undefined"?c:null},
        get b(){return typeof b!=="undefined"?b:(typeof y!=="undefined"?y:null)},
        get y(){return typeof b!=="undefined"?b:(typeof y!=="undefined"?y:null)},
        get S(){return (typeof JX!=="undefined"&&JX&&JX.sets)?JX:(typeof window!=="undefined"?window.JX:null)},
        get matS(){return typeof S==="function"?S:null},
        get l0(){return typeof dA!=="undefined"?dA:(typeof f0!=="undefined"?f0:(typeof l0==="function"?l0():null))},
        get dA(){return typeof dA!=="undefined"?dA:null},
        get JX(){return typeof JX!=="undefined"?JX:null},
        k0:(...a)=>{try{if(typeof D!=="undefined"&&D&&D.fac&&typeof yA==="function")yA(...a);}catch{}try{if(typeof R1==="function")R1(...a);}catch{}},
        H:(...a)=>{if(typeof V==="function")V(...a);if(typeof Hy==="function")Hy(...a);},
        L1:(...a)=>{if(typeof k==="function")k(...a);if(typeof Ji==="function")Ji(...a);},
        tg:(...a)=>{if(typeof V==="function")V(...a);if(typeof Sy==="function")Sy(...a);},
        B:(...a)=>{if(typeof z==="function")z(...a);else if(typeof M==="function")M(...a);},
        C:(...a)=>{if(typeof z==="function")z(...a);else if(typeof W==="function")W(...a);},
        za:(...a)=>typeof un==="function"?un(...a):(typeof is==="function"?is(...a):null),
        is:(...a)=>typeof un==="function"?un(...a):(typeof is==="function"?is(...a):null),
        un:(...a)=>typeof un==="function"?un(...a):null,
        TA:(...a)=>typeof U0==="function"?U0(...a):(typeof SA==="function"?SA(...a):null),
        U0:(...a)=>typeof U0==="function"?U0(...a):null,
        U1:(...a)=>typeof U1==="function"?U1(...a):null,
        b1:(...a)=>typeof U1==="function"?U1(...a):(typeof $1==="function"?$1(...a):null),
        yA:(...a)=>typeof yA==="function"?yA(...a):null,
        V:(...a)=>typeof V==="function"?V(...a):null,
        Hy:(...a)=>typeof Hy==="function"?Hy(...a):null,
        k:(...a)=>typeof k==="function"?k(...a):null,
        z:(...a)=>typeof z==="function"?z(...a):null,
        M:(...a)=>typeof M==="function"?M(...a):null,
        U:(...a)=>typeof U==="function"?U(...a):(typeof X==="function"?X(...a):null),
        matS:(...a)=>typeof S==="function"?S(...a):null,
        Xd:(...a)=>typeof Bf==="function"?Bf(...a):(typeof Xd==="function"?Xd(...a):(typeof Ff==="function"?Ff(...a):null)),
        Ff:(...a)=>typeof Bf==="function"?Bf(...a):(typeof Ff==="function"?Ff(...a):null),
        Bf:(...a)=>typeof Bf==="function"?Bf(...a):null,
        cs:(...a)=>typeof cs==="function"?cs(...a):(typeof _i==="function"?_i(...a):null),
        Ae:(...a)=>typeof me==="function"?me(...a):null,
        W:(...a)=>typeof W==="function"?W(...a):null,
        m:(...a)=>typeof m==="function"?m(...a):null,
        Im:(...a)=>typeof Uw==="function"?Uw(...a):null,
        X:(...a)=>typeof U==="function"?U(...a):null,
        z0:(...a)=>typeof G0==="function"?G0(...a):null,
        N:(...a)=>typeof L==="function"?L(...a):null,
        get tA(){return typeof eA!=="undefined"?eA:[]},
        Hu:(...a)=>typeof Kg==="function"?Kg(...a):null,
        get Qo(){return typeof wr!=="undefined"?wr:[]},
        get A8(){return typeof K8!=="undefined"?K8:[]},
        So:(...a)=>typeof So==="function"?So(...a):null,
        Ud:(...a)=>typeof Ud==="function"?Ud(...a):null,
        ji:(...a)=>typeof ji==="function"?ji(...a):null,
        Eo:(...a)=>typeof Eo==="function"?Eo(...a):null,
        r3:(...a)=>typeof Eo==="function"?Eo(...a):null,
        ve:(...a)=>typeof Ie==="function"?Ie(...a):null,
        lA:(...a)=>typeof fA==="function"?fA(...a):null,
        get kn(){return typeof En!=="undefined"?En:[]},
        get W0(){return typeof AA!=="undefined"?AA:{}},
        u1:(...a)=>typeof i1==="function"?i1(...a):null,
        JM:(...a)=>typeof C$==="function"?C$(...a):null,
        get v8(){return typeof v8==="function"?v8():[]},
        get HA(){return typeof HA==="function"?HA():null},
        get titles(){return typeof ge!=="undefined"?ge:(typeof Ls!=="undefined"?Ls:(typeof Is!=="undefined"?Is:[]))},
        get rw(){return typeof D!=="undefined"?D.rw:(typeof r!=="undefined"?(typeof Q==="function"?Q():(typeof G==="function"?G():r.rw)):null)},
        openTitles:(...a)=>typeof H8==="function"?H8(...a):(typeof x8==="function"?x8(...a):null),
        get P(){return typeof c!=="undefined"&&c?c.P:null},
        _M:(...a)=>typeof _M==="function"?_M(...a):null,
        yu:(...a)=>typeof yu==="function"?yu(...a):null,
        R4:(...a)=>{ if(typeof nm==="function")nm(); return typeof _s==="function"?_s(...a):(typeof R4==="function"?R4(...a):null); },
        $l:(...a)=>typeof $l==="function"?$l(...a):null,
        t0:(...a)=>typeof t0==="function"?t0(...a):null,
        kT:(...a)=>typeof kT==="function"?kT(...a):null,
        get r0(){return typeof r0!=="undefined"?r0:[]},
        get uc(){return typeof uc!=="undefined"?uc:[]},
        get d8(){return typeof d8!=="undefined"?d8:{}},
        Fo:(...a)=>typeof Fo==="function"?Fo(...a):[],
        O0:(...a)=>typeof O0==="function"?O0(...a):null,
        get Z(){return typeof Z!=="undefined"?Z:{}},
        ld:(...a)=>typeof ld==="function"?ld(...a):null,
        G2:(...a)=>typeof G2==="function"?G2(...a):null,
        Z9:(...a)=>typeof Z9==="function"?Z9(...a):null,
        H6:(...a)=>typeof H6==="function"?H6(...a):null,
        Dt:(...a)=>typeof Dt==="function"?Dt(...a):null,
        Ad:(...a)=>typeof Ad==="function"?Ad(...a):null,
        de:(...a)=>typeof de==="function"?de(...a):null,
        p2:(...a)=>typeof p2==="function"?p2(...a):null
      };`;

      const idx = code.lastIndexOf('})();');
      if (idx !== -1) {
        code = code.slice(0, idx) + bridge + code.slice(idx);
      } else {
        code += bridge;
      }

      const s = document.createElement('script');
      s.textContent = code;
      document.head.appendChild(s);
      return true;
    } catch (e) {
      console.error('[GM Panel] Lỗi nạp app.js:', e);
      return false;
    }
  }

  await loadAppEngine();

  // --- OFFLINE HỒNG BAO & ĐẠI HỒNG BAO HANDLER ---
  window.__openHbOffline = function(A, n) {
    const G = window.__GAME;
    const o = G && G.o;
    if (!o || !Array.isArray(o.inv)) return false;
    const isHb = (A === 'hb');
    const isDhb = (A === 'dhb');
    if (!isHb && !isDhb) return false;

    n = Math.max(1, Math.min(10, n | 0 || 1));
    const oName = isHb ? 'Hồng Bao' : 'Đại Hồng Bao';
    const uName = isHb ? 'vạn lượng' : 'Kim Nguyên Bảo';

    let totalAmt = 0;
    for (let i = 0; i < n; i++) {
      // Hồng Bao: ngẫu nhiên 1 - 1000 vạn lượng
      // Đại Hồng Bao: ngẫu nhiên 100 - 1000 KNB
      const amt = isHb ? (Math.floor(Math.random() * 1000) + 1) : (Math.floor(Math.random() * 901) + 100);
      totalAmt += amt;
    }

    // Trừ số lượng khỏi hành trang
    const item = o.inv.find(r => r && r.ktc && r.ktc.k === A);
    if (item && item.ktc) {
      const consume = Math.min(n, item.ktc.c || 1);
      item.ktc.c -= consume;
      if (item.ktc.c <= 0) {
        const idx = o.inv.indexOf(item);
        if (idx !== -1) o.inv.splice(idx, 1);
      } else {
        const r0Def = (G.r0 || []).find(s => s.k === A);
        if (typeof G.Dt === 'function' && r0Def) {
          item.n = G.Dt(r0Def, item.ktc.c);
        } else {
          item.n = `${oName} ×${item.ktc.c}`;
        }
      }
    }

    // Cộng tài sản vào nhân vật
    if (isHb) {
      o.gold = (o.gold || 0) + totalAmt * 10000;
    } else {
      o.knb = (o.knb || 0) + totalAmt;
      if (typeof G.Ae === 'function') G.Ae(o.knb);
      if (typeof G.p2 === 'function') G.p2(+o.knb);
    }

    if (typeof G.B === 'function') {
      G.B(`🧧 Mở ${oName}${n > 1 ? ' ×' + n : ''}: nhận <b class="gold">${totalAmt.toLocaleString('vi-VN')} ${uName}!</b>`);
    }
    if (typeof G.M === 'function') {
      G.M(`Nhận +${totalAmt.toLocaleString('vi-VN')} ${uName}`);
    }

    if (G.l) G.l.dirty = true;
    try { if (typeof G.L1 === 'function') G.L1(); } catch {}
    try { if (typeof G.k === 'function') G.k(); } catch {}
    try { if (typeof G.H === 'function') G.H(); } catch {}
    try { if (typeof G.V === 'function') G.V(); } catch {}
    return true;
  };

  // --- TỰ ĐỘNG CHỮA LÀNH DỮ LIỆU NHÂN VẬT HỎNG (AUTO REPAIR CORRUPTED SAVES) ---
  function sanitizeCharacterData() {
    const G = window.__GAME;
    if (!G || !G.o) return;
    const o = G.o;
    const ha = (typeof G.O0 === 'function' ? G.O0() : null) || (o && o.rw) || o;

    let modified = false;

    // 1. Chữa lành Chuồng Thú: giới hạn tối đa 6 con để tránh RangeError
    if (ha && Array.isArray(ha.petBox) && ha.petBox.length > 6) {
      ha.petBox.length = 6;
      modified = true;
    }
    if (ha && Array.isArray(ha.petBox)) {
      ha.petBox.forEach(p => {
        if (p && p.se === undefined) {
          p.se = Math.floor(Math.random() * 5);
          modified = true;
        }
      });
    }

    // 2. Chữa lành Mã Trường: sửa r: 3 (ngựa tím hack) thành r: 2 (ngựa quý chuẩn)
    if (Array.isArray(o.stable)) {
      if (o.stable.length > 60) {
        o.stable.length = 60;
        modified = true;
      }
      o.stable.forEach(h => {
        if (h && h.d === 10 && h.r === 3 && !h.thanma) {
          h.r = 2;
          modified = true;
        }
      });
    }

    if (modified) {
      if (G.l) G.l.dirty = true;
      try { if (typeof G.k === 'function') G.k(); } catch {}
    }
  }

  // Chạy chữa lành ngay và định kỳ
  setTimeout(sanitizeCharacterData, 500);

  // --- PERSISTENT STATE ---
  window.__devSpeed = parseInt(localStorage.getItem('jx_dev_speed') || '1', 10);
  window.__devOneHit = localStorage.getItem('jx_dev_onehit') === 'true';
  window.__devGodMode = localStorage.getItem('jx_dev_godmode') === 'true';
  window.__devUnlockAllTitles = localStorage.getItem('jx_dev_unlock_all_titles') === 'true';

  let currentCategory = 'gold'; // 'gold', 'platina', 'horse', 'consumable', 'ore'
  let cachedPreviews = new Map();

  // --- FILL MÃ TRƯỜNG (48/48 LOÀI) ---
  window.__devFillStable = function() {
    const G = window.__GAME;
    if (!G || !G.o) {
      alert("Chưa vào nhân vật!");
      return;
    }
    const o = G.o;
    if (!o.stable) o.stable = [];

    const speciesMap = (typeof G.Z9 === 'function' ? G.Z9() : null);
    const S = G.S || window.JX;
    const horseList = (S && S.items && S.items[10] && S.items[10].list) || (window.JX && window.JX.items && window.JX.items[10] && window.JX.items[10].list) || [];
    const A8 = (G && Array.isArray(G.uc)) ? G.uc : [];

    const zn = (s => (s && s.n ? s.n : "").replace(/\s+\d+$/, "").toLowerCase().trim());

    const seen = new Set();
    const kept = [];
    if (o.eq && o.eq.horse && o.eq.horse.d === 10) {
      seen.add(zn(o.eq.horse));
    }
    for (const h of o.stable) {
      if (h && h.d === 10) {
        const key = zn(h);
        if (!seen.has(key)) {
          seen.add(key);
          if (h.r === 3 && !h.thanma) h.r = 2; // Sửa ngựa tím thành ngựa quý hợp lệ
          kept.push(h);
        }
      }
    }
    o.stable = kept;

    let addedCount = 0;

    if (speciesMap && speciesMap.size > 0) {
      for (const [key, [speciesName, tier]] of speciesMap) {
        if (o.stable.length >= 60) break; // Giới hạn sức chứa Mã Trường Sn = 60
        if (seen.has(key)) continue;

        const tmDef = A8.find(a => (a[2] && zn({ n: a[2] }) === key) || (a[3] && zn({ n: a[3] }) === key));
        let newHorse = null;

        // Ưu tiên tạo Thần Mã chuẩn nếu có định nghĩa
        if (tmDef && typeof G.ld === 'function') {
          newHorse = G.ld(tmDef[0]);
        }

        if (!newHorse) {
          const matches = horseList.filter(t => zn(t) === key);
          const tmpl = matches.reduce((best, cur) => ((cur.lvl || 0) > (best ? best.lvl || 0 : -1) ? cur : best), matches[0]);

          if (tmpl && typeof G.TA === 'function') {
            newHorse = G.TA(10, tmpl.k, tmpl.lvl || 10, 0);
          }

          if (!newHorse && tmpl) {
            newHorse = {
              uid: o.uid++,
              d: 10,
              k: tmpl.k,
              p: tmpl.p || 0,
              n: tmpl.n,
              ic: tmpl.ic || 'img/i/10_0.png',
              lvl: tmpl.lvl || 10,
              s: tmpl.s !== undefined ? tmpl.s : -1,
              price: tmpl.price || 10000,
              base: tmpl.base ? tmpl.base.map(c => c.slice()) : [],
              req: tmpl.req ? tmpl.req.map(c => c.slice()) : [[36, 10]],
              mag: [],
              ext: [],
              r: 2
            };
          }
        }

        if (newHorse) {
          newHorse.hlv = 20;
          newHorse.hxp = 0;
          newHorse.lock = 1;
          if (newHorse.r === 3 && !newHorse.thanma) newHorse.r = 2; // Chặn kiểm tra ngựa tím hack
          o.stable.push(newHorse);
          seen.add(key);
          addedCount++;
        }
      }
    } else {
      for (const tmpl of horseList) {
        if (o.stable.length >= 60) break;
        const key = zn(tmpl);
        if (seen.has(key)) continue;
        let newHorse = typeof G.TA === 'function' ? G.TA(10, tmpl.k, tmpl.lvl || 10, 0) : null;
        if (!newHorse) {
          newHorse = {
            uid: o.uid++,
            d: 10,
            k: tmpl.k,
            p: tmpl.p || 0,
            n: tmpl.n,
            ic: tmpl.ic || 'img/i/10_0.png',
            lvl: tmpl.lvl || 10,
            s: -1,
            price: 50000,
            base: tmpl.base ? tmpl.base.map(c => c.slice()) : [],
            req: tmpl.req ? tmpl.req.map(c => c.slice()) : [],
            mag: [],
            ext: [],
            r: 2
          };
        }
        newHorse.hlv = 20;
        newHorse.hxp = 0;
        newHorse.lock = 1;
        o.stable.push(newHorse);
        seen.add(key);
        addedCount++;
      }
    }

    if (!o.hbook) o.hbook = {};
    if (speciesMap) {
      for (const [key, [speciesName]] of speciesMap) {
        o.hbook[speciesName] = speciesName;
      }
    } else {
      for (const h of o.stable) {
        const cleanName = h.n.replace(/\s+\d+$/, '');
        o.hbook[cleanName] = cleanName;
      }
    }

    if (G.l) G.l.dirty = true;
    try { if (typeof G.k0 === 'function') G.k0(); } catch {}
    try { if (typeof G.H === 'function') G.H(); } catch {}
    try { if (typeof G.L1 === 'function') G.L1(); } catch {}
    try { if (typeof G.tg === 'function') G.tg(); } catch {}
    try { if (typeof G.k === 'function') G.k(); } catch {}

    const collection = (typeof G.Ad === 'function') ? G.Ad() : { n: seen.size, hp: seen.size, xp: seen.size * 3 };

    if (typeof G.B === 'function') {
      G.B(`🐎 ĐÃ FILL FULL ${collection.n} LOÀI MÃ TRƯỜNG! (+${collection.hp}% Máu · +${collection.xp}% EXP)`);
    }
    if (typeof G.C === 'function') {
      G.C(`🐎 <b>Bộ sưu tập Mã Trường:</b> Kích hoạt trọn vẹn <b>${collection.n} loài</b> (Tăng <b class="up">+${collection.hp}% sinh lực</b> và <b class="gold">+${collection.xp}% EXP</b>).`);
    }

    const gridTab = document.getElementById('tab-grid');
    if (gridTab && gridTab.classList.contains('active')) {
      renderActiveGrid();
    }
  };

  // --- GIVE HKMP & PLATINA SET ITEMS (EXACT MATCHING, ZERO DEVIATION) ---
  window.__giveSetItem = function(kind, target, sidOrName, itemName) {
    const G = window.__GAME;
    if (!G || !G.o) {
      alert("Chưa vào nhân vật!");
      return;
    }
    const S = G.S || window.JX;
    if (!S || !S.sets || !S.sets[kind]) {
      alert("Chưa tải xong dữ liệu bộ trang bị!");
      return;
    }

    let tmpl = null;
    if (typeof target === 'object' && target !== null && target.n) {
      // 1. Direct template object passed in (100% exact match, zero deviation)
      tmpl = target;
    } else {
      // 2. Lookup by exact name first to prevent duplicate (grp, sid) collision
      const name = itemName || (typeof sidOrName === 'string' ? sidOrName : null);
      if (name) {
        tmpl = S.sets[kind].find(x => x.n === name);
      }
      if (!tmpl && typeof target === 'number' && typeof sidOrName === 'number') {
        tmpl = S.sets[kind].find(x => x.grp === target && x.sid === sidOrName);
      }
      if (!tmpl && typeof target === 'number') {
        tmpl = S.sets[kind].find(x => x.grp === target);
      }
    }

    if (!tmpl) {
      const displayLabel = itemName || (typeof target === 'object' && target ? target.n : '') || 'Trang bị';
      if (typeof G.B === 'function') G.B(`❌ Không tìm thấy dữ liệu trang bị [${displayLabel}]!`);
      return;
    }

    const item = G.za(kind, tmpl, 10);
    if (!item) {
      if (typeof G.B === 'function') G.B(`❌ Lỗi khởi tạo trang bị!`);
      return;
    }
    if (kind === 'platina') item.plv = 10;
    item.enh = 10;

    G.o.inv.push(item);
    try { if (typeof G.k0 === 'function') G.k0(); } catch {}
    try { if (typeof G.H === 'function') G.H(); } catch {}
    try { if (typeof G.L1 === 'function') G.L1(); } catch {}
    try { if (typeof G.tg === 'function') G.tg(); } catch {}
    if (typeof G.B === 'function') G.B(`✨ Đã nhận: [${item.n} +10] vào hành trang!`);
  };

  window.__giveFullSet = function(kind, grp, sampleItem) {
    const G = window.__GAME;
    if (!G || !G.o) {
      alert("Chưa vào nhân vật!");
      return;
    }
    const S = G.S || window.JX;
    if (!S || !S.sets || !S.sets[kind]) return;

    let setPieces = [];
    if (sampleItem && sampleItem.n) {
      const targetGrp = sampleItem.grp != null ? sampleItem.grp : grp;
      const prefix = sampleItem.n.split(' ').slice(0, 2).join(' ');
      const sameGrp = S.sets[kind].filter(x => x.grp === targetGrp && !/Hạn Thời/i.test(x.n));
      const prefixMatched = sameGrp.filter(x => x.n.startsWith(prefix));
      if (prefixMatched.length >= 2) {
        setPieces = prefixMatched;
      } else if (sameGrp.length > 0) {
        setPieces = sameGrp;
      } else {
        setPieces = S.sets[kind].filter(x => x.n.startsWith(prefix) && !/Hạn Thời/i.test(x.n));
      }
    } else {
      setPieces = S.sets[kind].filter(x => x.grp === grp && !/Hạn Thời/i.test(x.n));
    }

    if (!setPieces.length) {
      if (typeof G.B === 'function') G.B(`❌ Không tìm thấy các món trong bộ!`);
      return;
    }

    let added = 0;
    for (const tmpl of setPieces) {
      const item = G.za(kind, tmpl, 10);
      if (item) {
        if (kind === 'platina') item.plv = 10;
        item.enh = 10;
        G.o.inv.push(item);
        added++;
      }
    }

    try { if (typeof G.k0 === 'function') G.k0(); } catch {}
    try { if (typeof G.H === 'function') G.H(); } catch {}
    try { if (typeof G.L1 === 'function') G.L1(); } catch {}
    try { if (typeof G.tg === 'function') G.tg(); } catch {}
    const setName = (sampleItem && sampleItem.n ? sampleItem.n.split(' ').slice(0, 2).join(' ') : (setPieces[0].n.split(' ')[0] || 'Hoàng Kim'));
    if (typeof G.B === 'function') G.B(`🎁 Đã nhận trọn bộ ${added} món [Bộ ${setName} +10]!`);
  };

  // --- ONLINE SYNC: FETCH DIRECTLY FROM VOLAMIDLE.PAGES.DEV ---
  async function devSyncOnline() {
    const G = window.__GAME;
    const btn = document.getElementById('devSyncOnlineBtn');
    const oldHtml = btn ? btn.innerHTML : '🌐 Quét Online';
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = '⏳ Đang tải...';
    }

    if (G && typeof G.B === 'function') {
      G.B('🌐 Đang kết nối volamidle.pages.dev để tải dữ liệu trang bị mới nhất...');
    }

    try {
      const now = Date.now();
      // 1. Fetch ver.json
      let verInfo = null;
      try {
        const rVer = await fetch('https://volamidle.pages.dev/ver.json?t=' + now);
        if (rVer.ok) verInfo = await rVer.json();
      } catch (e) {}

      // 2. Fetch setvi.js (Ưu tiên online, fallback sang local nếu mất mạng)
      let rSet = null;
      try {
        rSet = await fetch('https://volamidle.pages.dev/setvi.js?t=' + now);
      } catch {}
      if (!rSet || !rSet.ok) {
        rSet = await fetch('setvi.js?t=' + now);
      }
      if (!rSet.ok) throw new Error('Không thể tải setvi.js (HTTP ' + (rSet ? rSet.status : 'offline') + ')');
      const setviCode = await rSet.text();

      // 3. Fetch data.js (Ưu tiên online, fallback sang local nếu mất mạng)
      let rData = null;
      try {
        rData = await fetch('https://volamidle.pages.dev/data.js?t=' + now);
      } catch {}
      if (!rData || !rData.ok) {
        rData = await fetch('data.js?t=' + now);
      }
      if (!rData.ok) throw new Error('Không thể tải data.js (HTTP ' + (rData ? rData.status : 'offline') + ')');
      const dataCode = await rData.text();

      // 4. Update in-memory scripts
      try {
        const fnSet = new Function(setviCode);
        fnSet();
      } catch (e) {
        window.eval(setviCode);
      }

      try {
        const fnData = new Function(dataCode);
        fnData();
      } catch (e) {
        window.eval(dataCode);
      }

      // 5. Clear preview cache
      cachedPreviews.clear();

      // 6. Refresh grid
      renderActiveGrid();

      const JX = window.JX || (G && G.JX);
      const goldCount = (JX && JX.sets && JX.sets.gold && JX.sets.gold.length) || 0;
      const platCount = (JX && JX.sets && JX.sets.platina && JX.sets.platina.length) || 0;
      const verTxt = verInfo && verInfo.v ? `v${verInfo.v}` : 'mới nhất';

      if (G && typeof G.B === 'function') {
        G.B(`✅ ĐỒNG BỘ ONLINE THÀNH CÔNG (${verTxt})! ${goldCount} Hoàng Kim · ${platCount} Bạch Kim.`);
      }
      if (G && typeof G.C === 'function') {
        G.C(`🌐 <b>ĐÃ ĐỒNG BỘ ONLINE THÀNH CÔNG!</b><br>Dữ liệu đã được nạp trực tiếp từ <b>https://volamidle.pages.dev</b>.<br>Phiên bản: <b>${verTxt}</b><br>Hoàng Kim Môn Phái: <b>${goldCount}</b> món<br>Trang bị Bạch Kim: <b>${platCount}</b> món.<br>ID và tên mọi món đồ đã được đồng bộ chuẩn xác 100%!`);
      }
    } catch (err) {
      console.error('Lỗi đồng bộ online:', err);
      if (G && typeof G.B === 'function') {
        G.B('❌ Lỗi đồng bộ online: ' + (err.message || err));
      }
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = oldHtml;
      }
    }
  }
  window.__devSyncOnline = devSyncOnline;

  // --- STYLES ---
  const style = document.createElement('style');
  style.id = 'devToolStylesV3';
  style.textContent = `
    /* Draggable Floating Dev Button */
    #devFloatBtn {
      position: fixed;
      z-index: 100005;
      background: linear-gradient(135deg, #1f1b13, #3a2e16);
      color: #ffd970;
      border: 1.5px solid #e8c860;
      border-radius: 24px;
      padding: 8px 16px;
      font-size: 13px;
      font-weight: 700;
      cursor: grab;
      box-shadow: 0 4px 15px rgba(0,0,0,0.6), 0 0 12px rgba(232, 200, 96, 0.4);
      display: flex;
      align-items: center;
      gap: 6px;
      user-select: none;
      touch-action: none;
      transition: transform 0.1s, box-shadow 0.2s, background 0.2s;
    }
    #devFloatBtn:active {
      cursor: grabbing;
      transform: scale(0.96);
    }
    #devFloatBtn:hover {
      box-shadow: 0 4px 20px rgba(0,0,0,0.8), 0 0 20px rgba(232, 200, 96, 0.8);
      border-color: #fff;
    }
    #devFloatBtn .pulse-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #2ed573;
      box-shadow: 0 0 6px #2ed573;
      animation: devPulse 1.8s infinite;
    }
    @keyframes devPulse {
      0% { transform: scale(0.9); opacity: 0.7; }
      50% { transform: scale(1.3); opacity: 1; }
      100% { transform: scale(0.9); opacity: 0.7; }
    }

    /* Draggable Floating HUD Badges Bar */
    #devHudBadges {
      position: fixed;
      z-index: 99990;
      display: flex;
      gap: 6px;
      align-items: center;
      user-select: none;
      touch-action: none;
      cursor: grab;
      background: rgba(16, 14, 10, 0.92);
      border: 1.5px solid rgba(232, 200, 96, 0.6);
      box-shadow: 0 4px 18px rgba(0, 0, 0, 0.75), 0 0 10px rgba(232, 200, 96, 0.25);
      border-radius: 20px;
      padding: 4px 8px;
      backdrop-filter: blur(5px);
      transition: box-shadow 0.2s;
    }
    #devHudBadges:active {
      cursor: grabbing;
    }
    #devHudBadges .hud-drag-handle {
      color: #ffd970;
      font-size: 13px;
      padding: 0 4px 0 2px;
      opacity: 0.8;
      cursor: grab;
      user-select: none;
      line-height: 1;
    }
    .dev-badge {
      padding: 4px 10px;
      font-size: 11px;
      font-weight: 700;
      border-radius: 4px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 4px;
      transition: all 0.2s;
      border: 1px solid transparent;
      background: rgba(14, 20, 18, 0.85);
      color: #8fa099;
    }
    .dev-badge.speed {
      border-color: #ffd24a;
      color: #ffd24a;
      box-shadow: 0 0 8px rgba(255, 210, 74, 0.3);
    }
    .dev-badge.onehit.on {
      border-color: #ff4757;
      color: #ff4757;
      background: rgba(255, 71, 87, 0.15);
      box-shadow: 0 0 8px rgba(255, 71, 87, 0.5);
    }
    .dev-badge.godmode.on {
      border-color: #2ed573;
      color: #2ed573;
      background: rgba(46, 213, 115, 0.15);
      box-shadow: 0 0 8px rgba(46, 213, 115, 0.5);
    }

    /* Grid Hub / Dashboard */
    .dev-grid-hub {
      padding: 22px 18px;
      overflow-y: auto;
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .dev-hub-header {
      text-align: center;
      margin-bottom: 4px;
    }
    .dev-hub-header h2 {
      margin: 0 0 6px 0;
      color: #ffd970;
      font-size: 19px;
      letter-spacing: 0.5px;
      text-shadow: 0 0 12px rgba(255, 217, 112, 0.4);
    }
    .dev-hub-header p {
      margin: 0;
      color: #8fa099;
      font-size: 13px;
    }
    .dev-hub-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 14px;
    }
    .dev-hub-card {
      background: linear-gradient(135deg, #171f22 0%, #1e1b15 100%);
      border: 1.5px solid #453a20;
      border-radius: 12px;
      padding: 16px 18px;
      cursor: pointer;
      display: flex;
      gap: 14px;
      align-items: flex-start;
      transition: all 0.22s ease;
      position: relative;
      box-shadow: 0 4px 15px rgba(0,0,0,0.5);
    }
    .dev-hub-card:hover {
      transform: translateY(-3px);
      border-color: #ffd970;
      background: linear-gradient(135deg, #1f2a2e 0%, #2c251a 100%);
      box-shadow: 0 8px 25px rgba(0,0,0,0.7), 0 0 15px rgba(232, 200, 96, 0.35);
    }
    .dev-hub-card:active {
      transform: translateY(0);
    }
    .dev-hub-card-icon {
      font-size: 32px;
      line-height: 1;
      background: rgba(255, 217, 112, 0.08);
      border: 1px solid rgba(255, 217, 112, 0.25);
      border-radius: 10px;
      width: 52px;
      height: 52px;
      display: grid;
      place-items: center;
      flex-shrink: 0;
    }
    .dev-hub-card-info {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 5px;
    }
    .dev-hub-card-title {
      font-size: 15px;
      font-weight: 700;
      color: #ffd970;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .dev-hub-card-desc {
      font-size: 12px;
      color: #9eaba5;
      line-height: 1.45;
    }
    .dev-hub-card-badge {
      display: inline-block;
      align-self: flex-start;
      margin-top: 4px;
      font-size: 11px;
      font-weight: 700;
      padding: 2px 8px;
      border-radius: 4px;
      border: 1px solid transparent;
    }
    .dev-hub-card-badge.gold {
      background: rgba(255, 210, 74, 0.15);
      border-color: #ffd24a;
      color: #ffd24a;
    }
    .dev-hub-card-badge.blue {
      background: rgba(91, 192, 222, 0.15);
      border-color: #5bc0de;
      color: #5bc0de;
    }
    .dev-hub-card-badge.purple {
      background: rgba(192, 96, 255, 0.15);
      border-color: #c060ff;
      color: #c060ff;
    }
    .dev-hub-card-badge.green {
      background: rgba(46, 213, 115, 0.15);
      border-color: #2ed573;
      color: #2ed573;
    }
    .dev-hub-card-badge.red {
      background: rgba(255, 71, 87, 0.15);
      border-color: #ff4757;
      color: #ff4757;
    }

    /* Navigation Bar when inside an option */
    .dev-nav-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 10px 18px;
      background: #141b1d;
      border-bottom: 1.5px solid #362e1a;
    }
    .dev-back-btn {
      background: linear-gradient(135deg, #241c10, #382c16);
      color: #ffd970;
      border: 1px solid #ffd970;
      border-radius: 6px;
      padding: 7px 16px;
      font-size: 12px;
      font-weight: 700;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 6px;
      transition: all 0.2s;
    }
    .dev-back-btn:hover {
      background: linear-gradient(135deg, #3d301c, #524021);
      box-shadow: 0 0 12px rgba(255, 217, 112, 0.4);
    }
    .dev-nav-breadcrumb {
      font-size: 14px;
      font-weight: 700;
      color: #ffd970;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    /* Floating Tooltip Window */
    #devHoverTooltip {
      position: fixed;
      z-index: 100010;
      pointer-events: none;
      display: none;
      background: rgba(12, 16, 18, 0.96);
      border: 2px solid #5a4b26;
      border-radius: 8px;
      padding: 12px 14px;
      max-width: 340px;
      box-shadow: 0 8px 30px rgba(0,0,0,0.9), 0 0 15px rgba(232, 200, 96, 0.3);
      color: #e0d8c3;
      font-size: 12px;
      line-height: 1.45;
    }
    #devHoverTooltip .idet {
      display: flex;
      gap: 10px;
      align-items: center;
      margin-bottom: 8px;
      border-bottom: 1px solid #332d1d;
      padding-bottom: 8px;
    }
    #devHoverTooltip .pic {
      width: 44px;
      height: 44px;
      background: #080b0c;
      border: 1px solid #4a3e20;
      border-radius: 6px;
      display: grid;
      place-items: center;
    }
    #devHoverTooltip .pic img { width: 36px; height: 36px; object-fit: contain; }
    #devHoverTooltip h4 { margin: 0 0 3px 0; font-size: 14px; font-weight: 700; }
    #devHoverTooltip .sl { display: flex; flex-direction: column; gap: 2px; }
    #devHoverTooltip .b { color: #8fa099; }
    #devHoverTooltip .m { color: #5bc0de; }
    #devHoverTooltip .h { color: #777; }
    #devHoverTooltip .h.on { color: #e8c860; font-weight: 600; }
    #devHoverTooltip .rq { color: #ff5252; }
    #devHoverTooltip .r { color: #ffd24a; font-weight: 600; }

    /* Modal Overlay & Container */
    #devModal {
      position: fixed;
      inset: 0;
      z-index: 100000;
      background: rgba(0, 0, 0, 0.78);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
    }
    #devModal.hidden { display: none !important; }
    .dev-win {
      width: min(960px, 96vw);
      height: 90vh;
      max-height: 860px;
      background: #111618;
      border: 2px solid #5a4b26;
      border-radius: 12px;
      box-shadow: 0 0 50px rgba(0,0,0,0.9), 0 0 25px rgba(232, 200, 96, 0.25);
      display: flex;
      flex-direction: column;
      overflow: hidden;
      color: #e0d8c3;
    }
    .dev-header {
      padding: 12px 18px;
      background: #171f22;
      border-bottom: 1.5px solid #3d351e;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .dev-header h3 {
      margin: 0;
      font-size: 16px;
      color: #ffd970;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .dev-close {
      background: none;
      border: none;
      color: #aaa;
      font-size: 22px;
      cursor: pointer;
      padding: 2px 8px;
      line-height: 1;
    }
    .dev-close:hover { color: #ff5252; }

    /* Clean Single-Row Main Tabs */
    .dev-tabs {
      display: flex;
      background: #13191c;
      border-bottom: 1px solid #2d281a;
      overflow-x: auto;
      gap: 2px;
      padding: 4px 8px 0;
    }
    .dev-tab-btn {
      padding: 11px 16px;
      background: none;
      border: none;
      color: #9c8e75;
      font-size: 13px;
      font-weight: 700;
      cursor: pointer;
      border-bottom: 3px solid transparent;
      white-space: nowrap;
      transition: all 0.2s;
      border-radius: 6px 6px 0 0;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .dev-tab-btn:hover { color: #ffd970; background: rgba(255, 217, 112, 0.05); }
    .dev-tab-btn.active {
      color: #ffd970;
      border-bottom-color: #ffd970;
      background: rgba(255, 217, 112, 0.12);
    }

    .dev-body {
      padding: 16px;
      overflow-y: auto;
      flex: 1;
    }
    .dev-pane { display: none; }
    .dev-pane.active { display: block; }

    /* Category Sub-nav for Scanner (Grid Tiles) */
    .dev-subtabs {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 8px;
      margin-bottom: 12px;
    }
    .dev-subtab-btn {
      padding: 8px 14px;
      background: #182023;
      border: 1px solid #3d351e;
      border-radius: 6px;
      color: #baa472;
      font-size: 12px;
      font-weight: 700;
      cursor: pointer;
      text-align: center;
      transition: all 0.2s;
    }
    .dev-subtab-btn:hover { color: #ffd970; border-color: #ffd970; }
    .dev-subtab-btn.active {
      background: #ffd970;
      color: #111;
      border-color: #ffd970;
      font-weight: 700;
    }

    /* Search & Filter Bar */
    .dev-search-bar {
      display: flex;
      gap: 8px;
      margin-bottom: 12px;
      flex-wrap: wrap;
      align-items: center;
    }
    .dev-input, .dev-select {
      background: #0d1214;
      border: 1px solid #423820;
      color: #e8c860;
      padding: 7px 10px;
      border-radius: 4px;
      font-size: 12.5px;
    }
    .dev-input:focus, .dev-select:focus {
      outline: none;
      border-color: #ffd970;
      box-shadow: 0 0 6px rgba(255, 217, 112, 0.3);
    }
    .dev-search-bar .dev-input { flex: 2; min-width: 180px; }
    .dev-search-bar .dev-select { flex: 1; min-width: 130px; }

    /* Item Grid View */
    .dev-grid-wrap {
      max-height: 520px;
      overflow-y: auto;
      padding-right: 4px;
    }
    .dev-item-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(135px, 1fr));
      gap: 8px;
    }
    .dev-grid-card {
      background: #161c1f;
      border: 1px solid #362f1c;
      border-radius: 6px;
      padding: 8px;
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      position: relative;
      cursor: pointer;
      transition: all 0.2s;
    }
    .dev-grid-card:hover {
      background: #20282c;
      border-color: #ffd970;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0,0,0,0.5), 0 0 8px rgba(232, 200, 96, 0.2);
    }
    .dev-card-icon-frame {
      width: 44px;
      height: 44px;
      background: #0c1012;
      border: 1.5px solid #4a3e20;
      border-radius: 6px;
      display: grid;
      place-items: center;
      margin-bottom: 6px;
      position: relative;
    }
    .dev-card-icon-frame.gold { border-color: #ffd24a; box-shadow: 0 0 6px rgba(255, 210, 74, 0.4); }
    .dev-card-icon-frame.platina { border-color: #4ae0ff; box-shadow: 0 0 6px rgba(74, 224, 255, 0.4); }
    .dev-card-icon-frame.violet { border-color: #c060ff; box-shadow: 0 0 6px rgba(192, 96, 255, 0.4); }
    .dev-card-icon-frame.horse { border-color: #ffd970; box-shadow: 0 0 6px rgba(255, 217, 112, 0.4); }
    .dev-card-icon-frame.consumable { border-color: #2ed573; box-shadow: 0 0 6px rgba(46, 213, 115, 0.4); }
    .dev-card-icon-frame.ore { border-color: #b388ff; box-shadow: 0 0 6px rgba(179, 136, 255, 0.4); }
    .dev-card-icon-frame.pet { border-color: #ff4757; box-shadow: 0 0 6px rgba(255, 71, 87, 0.4); }
    .dev-card-icon-frame img { width: 36px; height: 36px; object-fit: contain; }


    .dev-card-name {
      font-size: 11.5px;
      font-weight: 700;
      color: #ffd970;
      margin-bottom: 4px;
      line-height: 1.3;
      height: 29px;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
      word-break: break-word;
    }
    .dev-card-tag {
      font-size: 10px;
      color: #8fa099;
      margin-bottom: 6px;
    }
    .dev-card-actions {
      display: flex;
      gap: 4px;
      width: 100%;
      margin-top: auto;
    }
    .dev-card-actions button {
      flex: 1;
      padding: 4px 2px;
      font-size: 10.5px;
      border-radius: 3px;
    }

    /* Common Boxes & Buttons */
    .dev-box {
      background: #161c1f;
      border: 1px solid #332d1d;
      border-radius: 8px;
      padding: 14px;
      margin-bottom: 14px;
    }
    .dev-box-title {
      font-size: 14px;
      font-weight: 700;
      color: #e8c860;
      margin-bottom: 10px;
      display: flex;
      align-items: center;
      gap: 6px;
      border-bottom: 1px solid #2b2518;
      padding-bottom: 6px;
    }
    .dev-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
      gap: 8px;
    }
    .dev-btn {
      background: #252e32;
      border: 1px solid #4a3e20;
      color: #ffd970;
      border-radius: 4px;
      padding: 7px 12px;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      text-align: center;
      transition: all 0.2s;
    }
    .dev-btn:hover { background: #39454a; border-color: #ffd970; color: #fff; }
    .dev-btn.active { background: #ffd970; color: #111; font-weight: 700; }
    .dev-btn.green { border-color: #2ed573; color: #2ed573; }
    .dev-btn.green:hover, .dev-btn.green.active { background: #2ed573; color: #111; }
    .dev-btn.red { border-color: #ff4757; color: #ff4757; }
    .dev-btn.red:hover, .dev-btn.red.active { background: #ff4757; color: #fff; }
    .dev-btn.gold { border-color: #ffd24a; color: #111; background: #ffd24a; font-weight: 700; }
    .dev-btn.gold:hover { background: #ffe285; color: #000; box-shadow: 0 0 10px rgba(255, 210, 74, 0.5); }
    .dev-btn.blue { border-color: #5bc0de; color: #111; background: #5bc0de; font-weight: 700; }
    .dev-btn.blue:hover { background: #7dd3ec; color: #000; box-shadow: 0 0 10px rgba(91, 192, 222, 0.5); }
    .dev-btn.sm { padding: 4px 8px; font-size: 11px; }
  `;
  document.head.appendChild(style);

  // --- DRAGGABLE FLOATING BUTTON ---
  function initDraggableFloatButton() {
    if (document.getElementById('devFloatBtn')) return;

    const floatBtn = document.createElement('div');
    floatBtn.id = 'devFloatBtn';
    floatBtn.title = 'Kéo thả để di chuyển vị trí · Nhấn để Mở Bảng Dev';
    floatBtn.innerHTML = '<span class="pulse-dot"></span><span>🛠️ DEV MENU</span>';

    let pos = { x: window.innerWidth - 130, y: 14 };
    try {
      const saved = JSON.parse(localStorage.getItem('jx_dev_btn_pos'));
      if (saved && saved.x >= 0 && saved.y >= 0) {
        pos.x = Math.min(window.innerWidth - 110, saved.x);
        pos.y = Math.min(window.innerHeight - 50, saved.y);
      }
    } catch {}

    floatBtn.style.left = pos.x + 'px';
    floatBtn.style.top = pos.y + 'px';
    document.body.appendChild(floatBtn);

    let isDragging = false;
    let startX = 0, startY = 0;
    let initialX = 0, initialY = 0;
    let dragDistance = 0;

    function onPointerDown(e) {
      isDragging = true;
      dragDistance = 0;
      const touch = e.touches && e.touches[0];
      startX = touch ? touch.clientX : e.clientX;
      startY = touch ? touch.clientY : e.clientY;
      initialX = floatBtn.offsetLeft;
      initialY = floatBtn.offsetTop;

      document.addEventListener('mousemove', onPointerMove, { passive: false });
      document.addEventListener('mouseup', onPointerUp);
      document.addEventListener('touchmove', onPointerMove, { passive: false });
      document.addEventListener('touchend', onPointerUp);
    }

    function onPointerMove(e) {
      if (!isDragging) return;
      const touch = e.touches && e.touches[0];
      const clientX = touch ? touch.clientX : e.clientX;
      const clientY = touch ? touch.clientY : e.clientY;
      if (clientX == null || clientY == null) return;
      if (e.cancelable && e.touches) e.preventDefault();

      const dx = clientX - startX;
      const dy = clientY - startY;
      dragDistance += Math.abs(dx) + Math.abs(dy);

      let newX = initialX + dx;
      let newY = initialY + dy;
      newX = Math.max(10, Math.min(window.innerWidth - floatBtn.offsetWidth - 10, newX));
      newY = Math.max(10, Math.min(window.innerHeight - floatBtn.offsetHeight - 10, newY));

      floatBtn.style.left = newX + 'px';
      floatBtn.style.top = newY + 'px';
    }

    function onPointerUp() {
      if (!isDragging) return;
      isDragging = false;
      document.removeEventListener('mousemove', onPointerMove);
      document.removeEventListener('mouseup', onPointerUp);
      document.removeEventListener('touchmove', onPointerMove);
      document.removeEventListener('touchend', onPointerUp);

      localStorage.setItem('jx_dev_btn_pos', JSON.stringify({
        x: floatBtn.offsetLeft,
        y: floatBtn.offsetTop
      }));

      if (dragDistance < 8) {
        clickSuppressed = true;
        setTimeout(() => { clickSuppressed = false; }, 300);
        toggleDevModal();
      }
    }

    let clickSuppressed = false;
    floatBtn.addEventListener('mousedown', onPointerDown);
    floatBtn.addEventListener('touchstart', onPointerDown, { passive: true });
    floatBtn.addEventListener('click', () => {
      if (clickSuppressed) return;
      if (dragDistance < 8) {
        toggleDevModal();
      }
    });
    window.toggleDevModal = toggleDevModal;

    // Draggable Floating HUD Badges
    initDraggableHudBadges();

    // Hover Tooltip Container
    const tooltip = document.createElement('div');
    tooltip.id = 'devHoverTooltip';
    document.body.appendChild(tooltip);
  }

  function initDraggableHudBadges() {
    if (document.getElementById('devHudBadges')) return;

    const badges = document.createElement('div');
    badges.id = 'devHudBadges';
    badges.title = 'Kéo thả để di chuyển vị trí · Nhấn các nút để Bật/Tắt tính năng';
    badges.innerHTML = `
      <span class="hud-drag-handle" title="Kéo để di chuyển">⠿</span>
      <div id="devSpeedBadge" class="dev-badge speed" title="Bấm để đổi tốc độ">⚡ x${window.__devSpeed}</div>
      <div id="devOneHitBadge" class="dev-badge onehit ${window.__devOneHit ? 'on' : ''}" title="Bấm để Bật/Tắt 1-Hit Kill">💥 1-HIT</div>
      <div id="devGodBadge" class="dev-badge godmode ${window.__devGodMode ? 'on' : ''}" title="Bấm để Bật/Tắt Bất Tử">🛡️ BẤT TỬ</div>
    `;

    let pos = { x: 12, y: 58 };
    try {
      const saved = JSON.parse(localStorage.getItem('jx_dev_hud_pos'));
      if (saved && saved.x >= 0 && saved.y >= 0) {
        pos.x = Math.min(window.innerWidth - 180, saved.x);
        pos.y = Math.min(window.innerHeight - 40, saved.y);
      }
    } catch {}

    badges.style.left = pos.x + 'px';
    badges.style.top = pos.y + 'px';
    document.body.appendChild(badges);

    let isDraggingHud = false;
    let startX = 0, startY = 0;
    let initialX = 0, initialY = 0;
    let dragDist = 0;
    let clickSuppressed = false;

    function onPointerDown(e) {
      isDraggingHud = true;
      dragDist = 0;
      const touch = e.touches && e.touches[0];
      startX = touch ? touch.clientX : e.clientX;
      startY = touch ? touch.clientY : e.clientY;
      initialX = badges.offsetLeft;
      initialY = badges.offsetTop;

      document.addEventListener('mousemove', onPointerMove, { passive: false });
      document.addEventListener('mouseup', onPointerUp);
      document.addEventListener('touchmove', onPointerMove, { passive: false });
      document.addEventListener('touchend', onPointerUp);
    }

    function onPointerMove(e) {
      if (!isDraggingHud) return;
      const touch = e.touches && e.touches[0];
      const clientX = touch ? touch.clientX : e.clientX;
      const clientY = touch ? touch.clientY : e.clientY;
      if (clientX == null || clientY == null) return;
      if (e.cancelable && e.touches) e.preventDefault();

      const dx = clientX - startX;
      const dy = clientY - startY;
      dragDist += Math.abs(dx) + Math.abs(dy);

      let newX = Math.max(4, Math.min(window.innerWidth - badges.offsetWidth - 4, initialX + dx));
      let newY = Math.max(4, Math.min(window.innerHeight - badges.offsetHeight - 4, initialY + dy));

      badges.style.left = newX + 'px';
      badges.style.top = newY + 'px';
    }

    function onPointerUp() {
      if (!isDraggingHud) return;
      isDraggingHud = false;
      document.removeEventListener('mousemove', onPointerMove);
      document.removeEventListener('mouseup', onPointerUp);
      document.removeEventListener('touchmove', onPointerMove);
      document.removeEventListener('touchend', onPointerUp);

      localStorage.setItem('jx_dev_hud_pos', JSON.stringify({
        x: badges.offsetLeft,
        y: badges.offsetTop
      }));

      if (dragDist >= 6) {
        clickSuppressed = true;
        setTimeout(() => { clickSuppressed = false; }, 300);
      }
    }

    badges.addEventListener('mousedown', onPointerDown);
    badges.addEventListener('touchstart', onPointerDown, { passive: true });

    document.getElementById('devSpeedBadge').onclick = () => {
      if (clickSuppressed || dragDist >= 6) return;
      cycleSpeed();
    };
    document.getElementById('devOneHitBadge').onclick = () => {
      if (clickSuppressed || dragDist >= 6) return;
      toggleOneHit();
    };
    document.getElementById('devGodBadge').onclick = () => {
      if (clickSuppressed || dragDist >= 6) return;
      toggleGodMode();
    };

    updateHudBadges();
  }

  function updateHudBadges() {
    const spd = document.getElementById('devSpeedBadge');
    if (spd) spd.textContent = `⚡ x${window.__devSpeed}`;
    const hit = document.getElementById('devOneHitBadge');
    if (hit) hit.className = `dev-badge onehit ${window.__devOneHit ? 'on' : ''}`;
    const god = document.getElementById('devGodBadge');
    if (god) god.className = `dev-badge godmode ${window.__devGodMode ? 'on' : ''}`;
  }

  function cycleSpeed() {
    const speeds = [1, 3, 5, 10];
    let nextIdx = (speeds.indexOf(window.__devSpeed) + 1) % speeds.length;
    setGameSpeed(speeds[nextIdx]);
  }

  function setGameSpeed(val) {
    window.__devSpeed = Math.max(1, parseInt(val, 10) || 1);
    localStorage.setItem('jx_dev_speed', window.__devSpeed);
    updateHudBadges();
    const G = window.__GAME;
    if (G && typeof G.B === 'function') G.B(`⚡ Đã chỉnh tốc độ game: x${window.__devSpeed}`);
  }

  function toggleOneHit() {
    window.__devOneHit = !window.__devOneHit;
    localStorage.setItem('jx_dev_onehit', window.__devOneHit);
    updateHudBadges();
    const G = window.__GAME;
    if (G && typeof G.B === 'function') G.B(window.__devOneHit ? '💥 ĐÃ BẬT 1-HIT KILL!' : '⚪ Đã tắt 1-Hit Kill');
  }

  function toggleGodMode() {
    window.__devGodMode = !window.__devGodMode;
    localStorage.setItem('jx_dev_godmode', window.__devGodMode);
    updateHudBadges();
    const G = window.__GAME;
    if (G && typeof G.B === 'function') G.B(window.__devGodMode ? '🛡️ ĐÃ BẬT BẤT TỬ (GOD MODE)!' : '⚪ Đã tắt Bất Tử');
  }

  setInterval(() => {
    if (window.__devGodMode) {
      const G = window.__GAME;
      if (G && G.l && G.l.P) {
        G.l.life = G.l.P.life;
        G.l.mana = G.l.P.mana;
        G.l.deadT = 0;
      }
    }
  }, 200);

  setInterval(() => {
    if (window.__devOneHit) {
      const G = window.__GAME;
      if (G && G.l && Array.isArray(G.l.enemies)) {
        for (const e of G.l.enemies) {
          if (!e.dead && (e.hitT > 0 || (e.hp > 0 && e.hp < (e.max || 1)))) {
            e.hp = 0;
          }
        }
      }
    }
  }, 50);

  // --- HOVER TOOLTIP LOGIC ---
  function showHoverTooltip(html, e) {
    const tip = document.getElementById('devHoverTooltip');
    if (!tip || !html) return;
    tip.innerHTML = html;
    tip.style.display = 'block';

    const tipW = tip.offsetWidth || 300;
    const tipH = tip.offsetHeight || 200;

    let x = e.clientX + 16;
    let y = e.clientY + 16;

    if (x + tipW > window.innerWidth - 10) {
      x = e.clientX - tipW - 16;
    }
    if (y + tipH > window.innerHeight - 10) {
      y = window.innerHeight - tipH - 10;
    }

    tip.style.left = Math.max(10, x) + 'px';
    tip.style.top = Math.max(10, y) + 'px';
  }

  function hideHoverTooltip() {
    const tip = document.getElementById('devHoverTooltip');
    if (tip) tip.style.display = 'none';
  }

  // --- UNLOCK FULL THÚ ĐIỂN ---
  function devUnlockAllPets() {
    const G = window.__GAME;
    if (!G || !G.o) {
      if (G && typeof G.B === 'function') G.B('⚠️ Chưa đăng nhập hoặc chưa chọn nhân vật!');
      return;
    }

    const ha = (typeof G.O0 === 'function' ? G.O0() : null) || (G.o && G.o.rw) || G.o;
    ha.petDex = ha.petDex || {};
    ha.petBox = ha.petBox || [];
    ha.petMat = ha.petMat || { tn: 0 };
    ha.petMat.tn = Math.max(ha.petMat.tn || 0, 9999);
    ha.petCap = 1;

    // 1. All normal beasts from G.Fo()
    const foList = (typeof G.Fo === 'function') ? G.Fo() : [];
    foList.forEach(tid => {
      ha.petDex[tid] = 1;
    });

    // 2. All 4 Rare Beasts (Dị thú) from G.d8
    const d8 = G.d8 || {
      bhv: { tid: 2, n: 'Bạch Hổ Vương' },
      hht: { tid: 10, n: 'Cửu Vĩ Hỏa Hồ' },
      kdt: { tid: 24, n: 'Kim Sí Đại Bằng' },
      stl: { tid: 8, n: 'Tuyết Lang Vương' }
    };
    Object.keys(d8).forEach(k => {
      ha.petDex['r_' + k] = 1;
      if (d8[k] && d8[k].tid != null) {
        ha.petDex[d8[k].tid] = 1;
      }
    });

    // 3. Populate petBox (Chuồng Thú) with 4 Rare Beasts 5★ (Giới hạn tối đa 6 con)
    const rarePresets = [
      { tid: 2, rare: 'bhv', name: 'Bạch Hổ Vương', sk: ['hokhieu', 'hoi', 'bao', 'xuyen'] },
      { tid: 10, rare: 'hht', name: 'Cửu Vĩ Hỏa Hồ', sk: ['hoavuc', 'hoi', 'bao', 'lien'] },
      { tid: 24, rare: 'kdt', name: 'Kim Sí Đại Bằng', sk: ['phongtoc', 'hoi', 'bao', 'tambao'] },
      { tid: 8, rare: 'stl', name: 'Tuyết Lang Vương', sk: ['hanbang', 'hoi', 'bao', 'hokhang'] }
    ];

    rarePresets.forEach(preset => {
      const exists = ha.petBox.some(p => p && p.rare === preset.rare);
      if (!exists && ha.petBox.length < 6) {
        let pInst = {
          tid: preset.tid,
          rare: preset.rare,
          lvl: 150,
          xp: 0,
          star: 5,
          sk: preset.sk,
          evo: 2,
          eq: { vong: 10, giap: 10, bua: 10 },
          se: Math.floor(Math.random() * 5)
        };
        if (typeof G.G2 === 'function') {
          pInst = G.G2(pInst);
        }
        ha.petBox.push(pInst);
      }
    });

    // Giới hạn nghiêm ngặt chuồng thú tối đa 6 con (Lt = 6)
    if (ha.petBox.length > 6) {
      ha.petBox.length = 6;
    }

    // 4. Active pet if none
    if (!ha.pet && ha.petBox.length > 0) {
      ha.pet = ha.petBox[0];
    }

    // 5. Complete milestones
    ha.petDexMs = ha.petDexMs || {};
    [5, 10, 15, 20, 30].forEach(m => {
      ha.petDexMs[m] = 1;
    });

    // 6. Save & sync
    if (G.l) G.l.dirty = true;
    try { if (typeof G.k0 === 'function') G.k0(); } catch {}
    try { if (typeof G.H === 'function') G.H(); } catch {}
    try { if (typeof G.L1 === 'function') G.L1(); } catch {}
    try { if (typeof G.tg === 'function') G.tg(); } catch {}
    try { if (typeof G.k === 'function') G.k(); } catch {}

    const totalDex = Object.keys(ha.petDex).length;
    const msg = `🐾 ĐÃ MỞ KHÓA TOÀN BỘ ${totalDex} THÚ ĐIỂN (+4 DỊ THÚ 5★ & 9999 THÚ NGỌC)!`;
    if (typeof G.B === 'function') G.B(msg);
  }
  window.__devUnlockAllPets = devUnlockAllPets;


  // --- UNLOCK FULL TOÀN BỘ DANH HIỆU ---
  function devUnlockAllTitles() {
    const G = window.__GAME;
    if (!G || !G.o) {
      if (G && typeof G.B === 'function') G.B('⚠️ Chưa đăng nhập hoặc chưa chọn nhân vật!');
      return;
    }

    window.__devUnlockAllTitles = true;
    try {
      localStorage.setItem('jx_dev_unlock_all_titles', 'true');
    } catch {}

    let rw = null;
    try { rw = G.rw; } catch {}
    if (!rw && G.o) rw = G.o.rw = G.o.rw || {};
    if (!rw) rw = {};
    rw.titles = rw.titles || {};
    rw.ach = rw.ach || {};

    const allTitleIds = [
      'xuatson', 'lv30', 'lv50', 'lv80', 'lv100', 'lv150', 'lv200',
      'cs1', 'cs3', 'cs5', 'cs10',
      'mp1', 'mp2', 'mp3', 'mp4',
      'vm1', 'vm2', 'vm3', 'vm4', 'vm5',
      'k1000', 'k10000', 'k100000', 'b50', 'b500', 'gold5', 'tower20', 'tower50',
      'dt100', 'dt1000', 'zone8', 'zone16',
      'login30', 'setfull', 'vio6', 'rich',
      'pet10', 'pet25', 'petthan', 'petrare',
      'tvld1', 'tvld2', 'tvld3',
      'ott1', 'ott2', 'ott3'
    ];

    if (Array.isArray(G.titles)) {
      G.titles.forEach(t => {
        if (t && t[0]) {
          rw.titles[t[0]] = 1;
          rw.ach[t[0]] = 1;
        }
      });
    }

    allTitleIds.forEach(id => {
      rw.titles[id] = 1;
      rw.ach[id] = 1;
    });

    try { if (G.l) G.l.dirty = true; } catch {}
    try { if (typeof G.k0 === 'function') G.k0(); } catch {}
    try { if (typeof G.H === 'function') G.H(); } catch {}
    try { if (typeof G.L1 === 'function') G.L1(); } catch {}
    try { if (typeof G.tg === 'function') G.tg(); } catch {}
    try { if (typeof G.k === 'function') G.k(); } catch {}

    const count = Object.keys(rw.titles).length;
    const msg = `🏆 ĐÃ MỞ KHÓA TOÀN BỘ ${count} DANH HIỆU! Vào [Nhân vật › Danh hiệu] để chọn đeo.`;
    if (typeof G.B === 'function') G.B(msg);
  }
  window.__devUnlockAllTitles = devUnlockAllTitles;

  // --- DEV MODAL CREATION ---
  function toggleDevModal() {
    let modal = document.getElementById('devModal');
    if (!modal) {
      modal = buildDevModal();
      document.body.appendChild(modal);
    }
    modal.classList.toggle('hidden');
    if (!modal.classList.contains('hidden')) {
      if (typeof modal._backToHub === 'function') {
        modal._backToHub();
      }
    } else {
      hideHoverTooltip();
    }
  }

  function buildDevModal() {
    const modal = document.createElement('div');
    modal.id = 'devModal';
    modal.className = 'hidden';

    modal.innerHTML = `
      <div class="dev-win">
        <div class="dev-header">
          <h3><span>🛠️</span> BẢNG ĐIỀU KHIỂN DEV - VÕ LÂM IDLE</h3>
          <button class="dev-close" id="devCloseBtn">✕</button>
        </div>

        <!-- NAV BAR FOR DETAIL PANES -->
        <div class="dev-nav-bar" id="devNavBar" style="display:none;">
          <button class="dev-back-btn" id="devBackToHubBtn">⬅ QUAY LẠI MENU CHÍNH</button>
          <div class="dev-nav-breadcrumb" id="devNavBreadcrumb">📦 Quét Toàn Bộ Server</div>
        </div>

        <div class="dev-body" id="devBodyContainer">
          <!-- MAIN GRID DASHBOARD HUB -->
          <div class="dev-grid-hub" id="devGridHub">
            <div class="dev-hub-header">
              <h2>🛠️ BẢNG ĐIỀU KHIỂN NHÀ PHÁT TRIỂN</h2>
              <p>Chọn phân hệ bên dưới để mở giao diện chức năng chi tiết:</p>
            </div>
            <div class="dev-hub-grid">


              <!-- Card 1: Quét Server -->
              <div class="dev-hub-card" data-open="tab-grid">
                <div class="dev-hub-card-icon">📦</div>
                <div class="dev-hub-card-info">
                  <div class="dev-hub-card-title">Quét Toàn Bộ Server</div>
                  <div class="dev-hub-card-desc">Quét Hoàng Kim Môn Phái, Bạch Kim, Thần Mã (Ngựa), Tiêu Hao & KTC, Huyền Tinh & Đá. Lấy lẻ từng món hoặc nạp nguyên bộ.</div>
                  <div class="dev-hub-card-badge gold">100+ Bộ Trang Bị</div>
                </div>
              </div>

              <!-- Card 2: Tăng Tốc & Hack Chiến Đấu -->
              <div class="dev-hub-card" data-open="tab-speed">
                <div class="dev-hub-card-icon">⚡</div>
                <div class="dev-hub-card-info">
                  <div class="dev-hub-card-title">Tăng Tốc & Hack Chiến Đấu</div>
                  <div class="dev-hub-card-desc">Tốc độ x1-x20, 1-Hit Kill, Bất Tử God Mode, Fill Full 48/48 Mã Trường, Mở Full Thú Điển, +10 Triệu Lượng, +100k KNB.</div>
                  <div class="dev-hub-card-badge green">Tốc Độ & Vô Địch & Thú Điển</div>
                </div>
              </div>
            </div>
          </div>

          <!-- TAB 1: GRID VIEW SCANNER -->
          <div class="dev-pane" id="tab-grid">
            <div class="dev-subtabs">
              <button class="dev-subtab-btn active" data-cat="gold">🟡 Hoàng Kim Môn Phái</button>
              <button class="dev-subtab-btn" data-cat="platina">🔵 Trang Bị Bạch Kim</button>
              <button class="dev-subtab-btn" data-cat="horse">🐎 Thần Mã (Ngựa)</button>
              <button class="dev-subtab-btn" data-cat="pet">🐾 Thú Điển (Đồng Hành)</button>
              <button class="dev-subtab-btn" data-cat="consumable">🧪 Tiêu Hao & KTC</button>
              <button class="dev-subtab-btn" data-cat="ore">🔮 Huyền Tinh & Đá</button>
            </div>


            <div class="dev-search-bar">
              <input type="text" id="devGridSearch" class="dev-input" placeholder="🔍 Tìm kiếm theo tên vật phẩm..." />
              <select id="devGridFac" class="dev-select">
                <option value="all">Tất cả môn phái</option>
                <option value="-1">Đồ Dùng Chung</option>
                <option value="0">Thiếu Lâm</option>
                <option value="1">Thiên Vương</option>
                <option value="2">Đường Môn</option>
                <option value="3">Ngũ Độc</option>
                <option value="4">Nga My</option>
                <option value="5">Thúy Yên</option>
                <option value="6">Cái Bang</option>
                <option value="7">Thiên Nhẫn</option>
                <option value="8">Võ Đang</option>
                <option value="9">Côn Lôn</option>
              </select>
              <select id="devGridSeries" class="dev-select">
                <option value="all">Tất cả hệ ngũ hành</option>
                <option value="0">Hệ Kim</option>
                <option value="1">Hệ Mộc</option>
                <option value="2">Hệ Thủy</option>
                <option value="3">Hệ Hỏa</option>
                <option value="4">Hệ Thổ</option>
              </select>
              <button class="dev-btn green" id="devFillStableGridBtn" style="display:none;white-space:nowrap;padding:7px 12px;font-weight:700;">🐎 Fill Full 48/48 Mã Trường</button>
              <button class="dev-btn gold" id="devUnlockPetsQuickBtn" style="display:none;white-space:nowrap;padding:7px 14px;font-weight:700;color:#111;">🐾 Mở Full Thú Điển</button>
              <button class="dev-btn gold" id="devUnlockTitlesQuickBtn" style="white-space:nowrap;padding:7px 14px;font-weight:700;color:#111;background:#ff9f43;border-color:#ff9f43;" title="Mở khóa ngay lập tức toàn bộ danh hiệu trong game">🏆 Mở Full Danh Hiệu</button>

              <button class="dev-btn blue" id="devSyncOnlineBtn" style="white-space:nowrap;padding:7px 14px;font-weight:700;color:#111;" title="Quét và tải trực tiếp dữ liệu trang bị từ máy chủ online về local">🌐 Quét Online</button>
            </div>

            <div class="dev-grid-wrap">
              <div class="dev-item-grid" id="devItemGridContainer">
                <!-- Cards rendered dynamically -->
              </div>
            </div>
          </div>

          <!-- TAB 2: TĂNG TỐC & CHIẾN ĐẤU -->
          <div class="dev-pane" id="tab-speed">
            <div class="dev-box">
              <div class="dev-box-title">⚡ Tốc Độ Mô Phỏng Game</div>
              <div class="dev-grid" style="grid-template-columns:repeat(5, 1fr);">
                <button class="dev-btn ${window.__devSpeed === 1 ? 'active' : ''}" data-spd="1">x1 (Chuẩn)</button>
                <button class="dev-btn ${window.__devSpeed === 3 ? 'active' : ''}" data-spd="3">⚡ x3</button>
                <button class="dev-btn ${window.__devSpeed === 5 ? 'active' : ''}" data-spd="5">⚡ x5</button>
                <button class="dev-btn ${window.__devSpeed === 10 ? 'active' : ''}" data-spd="10">⚡ x10</button>
                <button class="dev-btn ${window.__devSpeed === 20 ? 'active' : ''}" data-spd="20">⚡ x20</button>
              </div>
            </div>

            <div class="dev-box">
              <div class="dev-box-title">⚔️ Chiến Đấu Vô Địch</div>
              <div style="display:flex;gap:12px;flex-wrap:wrap;">
                <button class="dev-btn red ${window.__devOneHit ? 'active' : ''}" id="devToggleOneHit" style="flex:1;padding:12px;font-size:13px;">
                  💥 1-HIT KILL: ${window.__devOneHit ? 'ĐANG BẬT' : 'ĐANG TẮT'}
                </button>
                <button class="dev-btn green ${window.__devGodMode ? 'active' : ''}" id="devToggleGodMode" style="flex:1;padding:12px;font-size:13px;">
                  🛡️ BẤT TỬ (GOD MODE): ${window.__devGodMode ? 'ĐANG BẬT' : 'ĐANG TẮT'}
                </button>
              </div>
            </div>

            <div class="dev-box">
              <div class="dev-box-title">💰 Tiện Ích Hỗ Trợ Nhanh</div>
              <div class="dev-grid">
                <button class="dev-btn" id="devAddGold">+10 Triệu Vạn Lượng</button>
                <button class="dev-btn" id="devAddKnb">+100,000 KNB</button>
                <button class="dev-btn" id="devSetLvl90">Lên Cấp 90</button>
                <button class="dev-btn" id="devSetLvl150">Lên Cấp 150</button>
                <button class="dev-btn" id="devResetStats">Tẩy Tiềm Năng / Kỹ Năng</button>
                <button class="dev-btn green" id="devFillStableQuickBtn" style="font-weight:700;">🐎 Fill Full 48/48 Mã Trường</button>
                <button class="dev-btn gold" id="devUnlockPetsBtn" style="font-weight:700;grid-column:span 2;border-color:#ffd24a;color:#ffd24a;background:rgba(255,210,74,0.12);padding:10px;">🐾 Mở Khóa Toàn Bộ Thú Điển & 4 Dị Thú 5★ (+9999 Thú Ngọc)</button>
                <button class="dev-btn gold" id="devUnlockAllTitlesBtn" style="font-weight:700;grid-column:span 2;border-color:#ff9f43;color:#ff9f43;background:rgba(255,159,67,0.12);padding:10px;">🏆 Mở Khóa Toàn Bộ Danh Hiệu (Môn Phái, Chiến Công, Cấp Bậc...)</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    // Hub Navigation: Open selected module
    function openDevModule(tabId, titleText) {
      const hub = modal.querySelector('#devGridHub');
      const navBar = modal.querySelector('#devNavBar');
      const breadcrumb = modal.querySelector('#devNavBreadcrumb');
      if (hub) hub.style.display = 'none';
      if (navBar) navBar.style.display = 'flex';
      if (breadcrumb) breadcrumb.textContent = titleText || 'Bảng Điều Khiển Dev';

      modal.querySelectorAll('.dev-pane').forEach(p => p.classList.remove('active'));
      const target = modal.querySelector('#' + tabId);
      if (target) target.classList.add('active');

      if (tabId === 'tab-grid') {
        renderActiveGrid();
      }
    }

    // Hub Navigation: Return to main Hub menu
    function backToDevHub() {
      modal.querySelectorAll('.dev-pane').forEach(p => p.classList.remove('active'));
      const navBar = modal.querySelector('#devNavBar');
      const hub = modal.querySelector('#devGridHub');
      if (navBar) navBar.style.display = 'none';
      if (hub) hub.style.display = 'flex';
      hideHoverTooltip();
    }
    modal._backToHub = backToDevHub;

    modal.querySelectorAll('.dev-hub-card').forEach(card => {
      card.onclick = () => {
        const tabId = card.dataset.open;
        const titleEl = card.querySelector('.dev-hub-card-title');
        openDevModule(tabId, titleEl ? titleEl.textContent.trim() : 'Bảng Điều Khiển Dev');
      };
    });

    const bBack = modal.querySelector('#devBackToHubBtn');


    if (bBack) bBack.onclick = backToDevHub;

    modal.querySelector('#devCloseBtn').onclick = toggleDevModal;

    // Sub-tabs for Grid View
    modal.querySelectorAll('.dev-subtab-btn').forEach(btn => {
      btn.onclick = () => {
        modal.querySelectorAll('.dev-subtab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentCategory = btn.dataset.cat;

        // Contextual filter visibility
        const facSelect = modal.querySelector('#devGridFac');
        const serSelect = modal.querySelector('#devGridSeries');
        const fillHorseBtn = modal.querySelector('#devFillStableGridBtn');
        const unlockPetsBtn = modal.querySelector('#devUnlockPetsQuickBtn');

        if (currentCategory === 'gold' || currentCategory === 'platina') {
          if (facSelect) facSelect.style.display = '';
          if (serSelect) serSelect.style.display = '';
          if (fillHorseBtn) fillHorseBtn.style.display = 'none';
          if (unlockPetsBtn) unlockPetsBtn.style.display = 'none';
        } else if (currentCategory === 'horse') {
          if (facSelect) facSelect.style.display = 'none';
          if (serSelect) serSelect.style.display = '';
          if (fillHorseBtn) fillHorseBtn.style.display = '';
          if (unlockPetsBtn) unlockPetsBtn.style.display = 'none';
        } else if (currentCategory === 'pet') {
          if (facSelect) facSelect.style.display = 'none';
          if (serSelect) serSelect.style.display = 'none';
          if (fillHorseBtn) fillHorseBtn.style.display = 'none';
          if (unlockPetsBtn) unlockPetsBtn.style.display = '';
        } else {
          if (facSelect) facSelect.style.display = 'none';
          if (serSelect) serSelect.style.display = 'none';
          if (fillHorseBtn) fillHorseBtn.style.display = 'none';
          if (unlockPetsBtn) unlockPetsBtn.style.display = 'none';
        }


        renderActiveGrid();
      };
    });

    ['devGridSearch', 'devGridFac', 'devGridSeries'].forEach(id => {
      const el = modal.querySelector('#' + id);
      if (el) el.oninput = el.onchange = renderActiveGrid;
    });

    // Speed buttons
    modal.querySelectorAll('[data-spd]').forEach(b => {
      b.onclick = () => {
        setGameSpeed(b.dataset.spd);
        modal.querySelectorAll('[data-spd]').forEach(x => x.classList.remove('active'));
        b.classList.add('active');
      };
    });

    // Toggle 1-Hit
    const btnHit = modal.querySelector('#devToggleOneHit');
    btnHit.onclick = () => {
      toggleOneHit();
      btnHit.textContent = `💥 1-HIT KILL: ${window.__devOneHit ? 'ĐANG BẬT' : 'ĐANG TẮT'}`;
      btnHit.className = `dev-btn red ${window.__devOneHit ? 'active' : ''}`;
    };

    // Toggle God Mode
    const btnGod = modal.querySelector('#devToggleGodMode');
    btnGod.onclick = () => {
      toggleGodMode();
      btnGod.textContent = `🛡️ BẤT TỬ (GOD MODE): ${window.__devGodMode ? 'ĐANG BẬT' : 'ĐANG TẮT'}`;
      btnGod.className = `dev-btn green ${window.__devGodMode ? 'active' : ''}`;
    };

    // Cheats
    modal.querySelector('#devAddGold').onclick = () => {
      const G = window.__GAME;
      if (G && G.o) {
        G.o.gold = (G.o.gold || 0) + 10000000;
        if (typeof G.H === 'function') G.H();
        if (typeof G.tg === 'function') G.tg();
        if (typeof G.B === 'function') G.B('💰 Đã cộng +10,000,000 Vạn lượng!');
      }
    };
    modal.querySelector('#devAddKnb').onclick = () => {
      const G = window.__GAME;
      if (G && G.o) {
        G.o.knb = (G.o.knb || 0) + 100000;
        if (typeof G.Ae === 'function') G.Ae(G.o.knb);
        if (typeof G.H === 'function') G.H();
        if (typeof G.tg === 'function') G.tg();
        if (typeof G.B === 'function') G.B('💎 Đã cộng +100,000 KNB!');
      }
    };
    modal.querySelector('#devSetLvl90').onclick = () => setPlayerLevel(90);
    modal.querySelector('#devSetLvl150').onclick = () => setPlayerLevel(150);
    modal.querySelector('#devResetStats').onclick = () => {
      const G = window.__GAME;
      if (G && G.o && G.o.attr) {
        let total = 0;
        for (const k in G.o.attr) { total += G.o.attr[k]; G.o.attr[k] = 0; }
        G.o.attrPts = (G.o.attrPts || 0) + total;
        if (typeof G.k0 === 'function') G.k0();
        if (typeof G.H === 'function') G.H();
        if (typeof G.B === 'function') G.B(`🧪 Đã tẩy tủy! Hoàn lại ${total} điểm tiềm năng.`);
      }
    };

    const onFillStable = () => { window.__devFillStable(); };
    const bFill1 = modal.querySelector('#devFillStableGridBtn');
    if (bFill1) bFill1.onclick = onFillStable;
    const bFill2 = modal.querySelector('#devFillStableQuickBtn');
    if (bFill2) bFill2.onclick = onFillStable;

    const onUnlockPets = () => { devUnlockAllPets(); };
    const bPet1 = modal.querySelector('#devUnlockPetsBtn');
    if (bPet1) bPet1.onclick = onUnlockPets;
    const bPet2 = modal.querySelector('#devUnlockPetsQuickBtn');
    if (bPet2) bPet2.onclick = onUnlockPets;

    const onUnlockTitles = () => { devUnlockAllTitles(); };
    const bTitle1 = modal.querySelector('#devUnlockAllTitlesBtn');
    if (bTitle1) bTitle1.onclick = onUnlockTitles;
    const bTitle2 = modal.querySelector('#devUnlockTitlesQuickBtn');
    if (bTitle2) bTitle2.onclick = onUnlockTitles;

    const bSyncOnline = modal.querySelector('#devSyncOnlineBtn');
    if (bSyncOnline) bSyncOnline.onclick = devSyncOnline;

    return modal;
  }

  function setPlayerLevel(targetLvl) {
    const G = window.__GAME;
    if (G && G.o) {
      const diff = Math.max(0, targetLvl - (G.o.lvl || 1));
      G.o.lvl = targetLvl;
      G.o.attrPts = (G.o.attrPts || 0) + diff * 5;
      G.o.skPts = (G.o.skPts || 0) + diff;
      if (typeof G.k0 === 'function') G.k0();
      if (typeof G.H === 'function') G.H();
      if (typeof G.tg === 'function') G.tg();
      if (typeof G.B === 'function') G.B(`🆙 Đã thăng cấp lên Lv.${targetLvl}!`);
    }
  }

  // --- GRID VIEW RENDERING & DATA PROVIDERS ---
  const facNames = {
    '-1': 'Chung', '0': 'Thiếu Lâm', '1': 'Thiên Vương', '2': 'Đường Môn', '3': 'Ngũ Độc',
    '4': 'Nga My', '5': 'Thúy Yên', '6': 'Cái Bang', '7': 'Thiên Nhẫn', '8': 'Võ Đang', '9': 'Côn Lôn'
  };
  const seriesNames = ['Kim', 'Mộc', 'Thủy', 'Hỏa', 'Thổ'];

  function renderActiveGrid() {
    const container = document.getElementById('devItemGridContainer');
    if (!container) return;

    const q = (document.getElementById('devGridSearch').value || '').trim().toLowerCase();
    const facFilter = document.getElementById('devGridFac').value;
    const seriesFilter = document.getElementById('devGridSeries').value;

    let items = [];

    if (currentCategory === 'gold' || currentCategory === 'platina') {
      const JX = window.JX;
      const list = (JX && JX.sets && JX.sets[currentCategory]) || [];
      items = list.map(item => ({
        type: 'set',
        kind: currentCategory,
        data: item,
        name: item.n,
        lvl: item.lvl || 10,
        s: item.s,
        grp: item.grp,
        sid: item.sid,
        ic: item.ic || 'img/i/0_0.png',
        fac: ((item.req || []).find(r => r[0] === 39) || [0, -1])[1]
      }));
    } else if (currentCategory === 'horse') {
      const JX = window.JX;
      const G = window.__GAME;

      // 1. Thần Mã độc quyền từ G.uc
      const ucList = (G && Array.isArray(G.uc)) ? G.uc : [];
      const thanMaItems = ucList.map(tm => {
        const oTmpl = (JX && JX.items && JX.items[10] && JX.items[10].list) ? JX.items[10].list.find(p => p.k === tm[1] && (!tm[2] || p.n === tm[2])) : null;
        return {
          type: 'horse',
          subType: 'thanma',
          tmCode: tm[0],
          name: tm[3] || tm[2],
          data: tm,
          lvl: tm[4] || 90,
          s: -1,
          ic: (oTmpl && oTmpl.ic) ? oTmpl.ic : 'img/i/10_0.png',
          fac: -1,
          tagCustom: 'Thần Mã Độc Quyền',
          desc: tm[7] || 'Thần mã tối thượng không phạt né tránh, sở hữu thần lực hộ thể'
        };
      });

      // 2. Toàn bộ 330 ngựa từ JX.items[10].list
      const horseList = (JX && JX.items && JX.items[10] && JX.items[10].list) || [];
      const normalHorses = horseList.map(h => ({
        type: 'horse',
        subType: 'normal',
        data: h,
        name: h.n,
        lvl: h.lvl || 1,
        s: h.s !== undefined ? h.s : -1,
        ic: h.ic || 'img/i/10_0.png',
        fac: -1,
        tagCustom: `Chiến Mã Cấp ${h.lvl || 1}`,
        desc: `Chiến mã cấp ${h.lvl || 1} · tốc độ di chuyển +${h.p || 0}%`
      }));

      items = [...thanMaItems, ...normalHorses];
    } else if (currentCategory === 'pet') {
      const G = window.__GAME;
      const d8 = (G && G.d8) || {};
      const Z = (G && G.Z) || {};
      const foList = (G && typeof G.Fo === 'function') ? G.Fo() : [];

      // 1. 4 Dị thú cực phẩm
      const rareItems = Object.entries(d8).map(([key, beast]) => ({
        type: 'pet',
        subType: 'rare',
        rareKey: key,
        tid: beast.tid,
        name: beast.n + ' (Dị Thú)',
        desc: `Dị thú thượng cổ cực phẩm · Kỹ năng độc quyền: ${beast.sk} · Màu: ${beast.c}`,
        ic: 'img/ep/box2.png',
        beastData: beast,
        color: beast.c,
        tagCustom: '✨ Dị Thú Cực Phẩm',
        fac: -1,
        s: -1
      }));

      // 2. Toàn bộ 49 loài thú thường từ Fo()
      const normalBeastItems = foList.map(tid => {
        const mon = Z[tid] || {};
        return {
          type: 'pet',
          subType: 'normal',
          tid: tid,
          name: mon.n || `Linh Thú #${tid}`,
          desc: `Loài thú hoang dã ghi vào Thú Điển (+1% sát thương nhân vật mỗi 4 loài)`,
          ic: 'img/ep/box3.png',
          beastData: mon,
          tagCustom: '🐾 Thú Điển Hoang Dã',
          fac: -1,
          s: -1
        };
      });

      items = [...rareItems, ...normalBeastItems];
    } else if (currentCategory === 'consumable') {
      const G = window.__GAME;
      const JX = window.JX;

      // 1. Kỳ Trân Các từ G.r0
      const r0 = (G && Array.isArray(G.r0)) ? G.r0 : [];
      const ktcItems = r0.map(c => ({
        type: 'consumable',
        subType: 'ktc',
        data: c,
        name: c.n,
        k: c.k,
        desc: c.d || '',
        ic: c.ic || 'img/ep/box2.png',
        tagCustom: 'Vật Phẩm Kỳ Trân Các',
        fac: -1,
        s: -1
      }));

      // 2. Dược phẩm phục hồi từ JX.potions
      const potions = (JX && Array.isArray(JX.potions)) ? JX.potions : [];
      const potItems = potions.map((p, idx) => ({
        type: 'consumable',
        subType: 'pot',
        data: p,
        name: p.n,
        k: 'pot_' + idx,
        desc: 'Dược phẩm phục hồi · Hồi phục tức thì sinh lực hoặc nội lực trong giao chiến',
        ic: p.ic || 'img/i/pot0.png',
        tagCustom: 'Dược Phẩm Phục Hồi',
        fac: -1,
        s: -1
      }));

      // 3. Phù & Vé đặc biệt
      const extras = [
        { name: 'Thổ Địa Phù', ic: 'img/ep/bch.png', k: 'tp', desc: 'Dịch chuyển tức thời về thành thị hoặc bãi luyện công' },
        { name: 'Tống Kim Chiêu Thư', ic: 'img/ep/ldt.png', k: 'tkct', desc: 'Lệnh bài tham chiến chiến trường Tống Kim' },
        { name: 'Lệnh Bài Phong Lăng Độ', ic: 'img/ep/mys.png', k: 'pld', desc: 'Vé lên thuyền viễn chinh Phong Lăng Độ' }
      ];
      const extraItems = extras.map(e => ({
        type: 'consumable',
        subType: 'extra',
        data: e,
        name: e.name,
        k: e.k,
        desc: e.desc,
        ic: e.ic,
        tagCustom: 'Vật Phẩm Hỗ Trợ',
        fac: -1,
        s: -1
      }));

      items = [...ktcItems, ...potItems, ...extraItems];
    } else if (currentCategory === 'ore') {
      const ores = [
        { name: 'Tử Thủy Tinh', ic: 'img/ep/tsbl.png', k: 'tt_tu', desc: 'Thủy tinh thần bí màu tím dùng luyện chế trang bị' },
        { name: 'Lam Thủy Tinh', ic: 'img/ep/tt.png', k: 'tt_lam', desc: 'Thủy tinh thần bí màu lam dùng luyện chế trang bị' },
        { name: 'Lục Thủy Tinh', ic: 'img/ep/ttsp.png', k: 'tt_luc', desc: 'Thủy tinh thần bí màu lục dùng luyện chế trang bị' },
        { name: 'Thần Bí Khoáng Thạch', ic: 'img/ep/mys.png', k: 'mys', desc: 'Khoáng thạch cổ xưa dùng nâng cấp trang bị' },
        { name: 'Thiên Cương Lệnh Tinh', ic: 'img/ep/bch.png', k: 'tcl', desc: 'Vật phẩm quý hiếm dùng đổi đồ Thiên Cương' },
        { name: 'Tinh Hồng Bảo Thạch', ic: 'img/ep/hb.png', k: 'thbt', desc: 'Bảo thạch rực lửa khảm nạm trang bị' },
        { name: 'Thú Ngọc', ic: 'img/ep/tsbl.png', k: 'tn', desc: 'Ngọc dùng cường hóa trang bị đồng hành' },
        { name: 'Phúc Duyên Lộ (Tiểu)', ic: 'img/ep/tt.png', k: 'fd_s', desc: 'Tăng 10 điểm Phúc Duyên' },
        { name: 'Phúc Duyên Lộ (Trung)', ic: 'img/ep/tt.png', k: 'fd_m', desc: 'Tăng 50 điểm Phúc Duyên' },
        { name: 'Phúc Duyên Lộ (Đại)', ic: 'img/ep/ttsp.png', k: 'fd_b', desc: 'Tăng 100 điểm Phúc Duyên' }
      ];
      for (let i = 1; i <= 10; i++) {
        ores.push({ name: `Huyền Tinh Cấp ${i}`, ic: `img/ep/ht.png`, k: `ht_${i}`, htLvl: i, desc: `Huyền Tinh Khoáng Thạch Cấp ${i} dùng ép trang bị tím & cường hóa` });
        ores.push({ name: `Đá Thuộc Tính Cấp ${i}`, ic: `img/ep/da${i}.png`, k: `da_${i}`, daLvl: i, desc: `Đá khảm nạm Cấp ${i} gia tăng thuộc tính môn phái` });
      }
      items = ores.map(o => ({
        type: 'ore',
        data: o,
        name: o.name,
        htLvl: o.htLvl,
        daLvl: o.daLvl,
        k: o.k,
        desc: o.desc,
        ic: o.ic,
        tagCustom: 'Khoáng Thạch / Ép Đồ',
        fac: -1,
        s: -1
      }));
    }

    const filtered = items.filter(it => {
      if (q && !it.name.toLowerCase().includes(q)) return false;
      if (facFilter !== 'all' && (currentCategory === 'gold' || currentCategory === 'platina') && String(it.fac) !== facFilter) return false;
      if (seriesFilter !== 'all') {
        if ((currentCategory === 'gold' || currentCategory === 'platina') && it.s !== -1 && String(it.s) !== seriesFilter) return false;
        if (currentCategory === 'horse' && it.s !== -1 && String(it.s) !== seriesFilter) return false;
      }
      return true;
    });

    if (!filtered.length) {
      container.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:40px;color:#888;">Không tìm thấy vật phẩm nào phù hợp!</div>';
      return;
    }

    container.innerHTML = filtered.slice(0, 150).map((it, idx) => {
      const frameClass = currentCategory;
      const sName = it.s >= 0 && it.s < 5 ? `Hệ ${seriesNames[it.s]}` : '';
      const fName = it.fac !== undefined && it.fac !== -1 ? facNames[it.fac] : '';
      const tagText = it.tagCustom || [fName, sName].filter(Boolean).join(' · ') || (it.lvl ? `Cấp ${it.lvl}` : '');

      let actionHtml = '';
      if (it.type === 'set') {
        actionHtml = `
          <button class="dev-btn sm" onclick="window.__takeGridItem(${idx}, 'item')">+ Lấy</button>
          <button class="dev-btn sm" onclick="window.__takeGridItem(${idx}, 'set')">+ Bộ</button>
        `;
      } else if (it.type === 'horse') {
        actionHtml = `
          <button class="dev-btn sm" onclick="window.__takeGridItem(${idx}, 'inv')" title="Nhận vào hành trang">+ Túi</button>
          <button class="dev-btn sm gold" onclick="window.__takeGridItem(${idx}, 'stable')" title="Cất vào Mã Trường & Mở khóa trong Thú Điển">+ Chuồng</button>
        `;
      } else if (it.type === 'pet') {
        actionHtml = `
          <button class="dev-btn sm" onclick="window.__takeGridItem(${idx}, 'dex')" title="Mở khóa vào Thú Điển vĩnh viễn">+ Sách</button>
          <button class="dev-btn sm gold" onclick="window.__takeGridItem(${idx}, 'box')" title="Thu phục 1 con 5★ Cực Phẩm vào Chuồng để Dẫn Theo">+ Nuôi</button>
        `;
      } else if (it.type === 'consumable') {
        actionHtml = `
          <button class="dev-btn sm" onclick="window.__takeGridItem(${idx}, 10)">+ x10</button>
          <button class="dev-btn sm gold" onclick="window.__takeGridItem(${idx}, 99)">+ x99</button>
        `;
      } else if (it.type === 'ore') {
        actionHtml = `
          <button class="dev-btn sm" onclick="window.__takeGridItem(${idx}, 10)">+ x10</button>
          <button class="dev-btn sm gold" onclick="window.__takeGridItem(${idx}, 50)">+ x50</button>
        `;
      } else {
        actionHtml = `<button class="dev-btn sm" style="width:100%;" onclick="window.__takeGridItem(${idx})">+ Nhận</button>`;
      }

      return `
        <div class="dev-grid-card" data-idx="${idx}">
          <div class="dev-card-icon-frame ${frameClass}">
            <img src="${it.ic}" alt="">
          </div>
          <div class="dev-card-name" title="${it.name}">${it.name}</div>
          <div class="dev-card-tag">${tagText || '&nbsp;'}</div>
          <div class="dev-card-actions">${actionHtml}</div>
        </div>
      `;
    }).join('');

    container.querySelectorAll('.dev-grid-card').forEach(card => {
      const idx = parseInt(card.dataset.idx, 10);
      const it = filtered[idx];
      card.onmouseenter = (e) => {
        const tipHtml = getItemTooltipHtml(it);
        showHoverTooltip(tipHtml, e);
      };
      card.onmousemove = (e) => {
        const tipHtml = getItemTooltipHtml(it);
        showHoverTooltip(tipHtml, e);
      };
      card.onmouseleave = hideHoverTooltip;
    });

    window.__currentGridItems = filtered;
  }

  // --- ITEM TOOLTIP BUILDER (b1 Engine) ---
  function getItemTooltipHtml(it) {
    if (!it) return '';
    const cacheKey = it.type + '_' + it.name;
    if (cachedPreviews.has(cacheKey)) return cachedPreviews.get(cacheKey);

    const G = window.__GAME;
    let html = '';

    try {
      if (it.type === 'set' && G && G.za && G.b1) {
        const created = G.za(it.kind, it.data, 10);
        if (it.kind === 'platina') created.plv = 10;
        html = G.b1(created);
      } else if (it.type === 'horse') {
        if (it.subType === 'thanma' && G && typeof G.ld === 'function') {
          const h = G.ld(it.tmCode);
          if (h && G.b1) html = G.b1(h);
        } else if (G && G.TA && G.b1) {
          const h = G.TA(10, it.data.k, it.data.lvl || 1, 0);
          if (h) {
            h.r = 3;
            h.n = it.name;
            h.ic = it.ic;
            html = G.b1(h);
          }
        }
      } else if (it.type === 'pet') {
        const isRare = it.subType === 'rare';
        const color = isRare ? (it.color || '#ffd24a') : '#2ed573';
        const titleBadge = isRare ? 'Dị Thú Cực Phẩm (4 Loài Thượng Cổ)' : 'Loài Thú Thường (Thú Điển Võ Lâm)';
        html = `
          <div class="idet">
            <div class="pic" style="border:1.5px solid ${color};"><img src="${it.ic}" alt=""></div>
            <div>
              <h4 style="color:${color};">${it.name}</h4>
              <small class="dim">${titleBadge}</small>
            </div>
          </div>
          <div class="sl">
            <div class="m" style="color:#eee;">${it.desc || ''}</div>
            <div class="b" style="margin-top:6px;color:#2ed573;">
              📖 <b>+ Sách:</b> Mở khóa vào Thú Điển (Tăng vĩnh viễn % sát thương nhân vật & đồng hành)<br>
              🐾 <b>+ Nuôi:</b> Nhận ngay 1 con 5★ Cực Phẩm Max Cấp vào Chuồng Thú để Dẫn Theo chiến đấu!
            </div>
          </div>
        `;
      } else if (it.type === 'consumable') {
        html = `
          <div class="idet">
            <div class="pic"><img src="${it.ic}" alt=""></div>
            <div>
              <h4 style="color:#ffd970;">${it.name}</h4>
              <small class="dim">${it.subType === 'ktc' ? 'Vật phẩm Kỳ Trân Các' : (it.subType === 'pot' ? 'Dược phẩm phục hồi' : 'Vật phẩm đặc biệt')}</small>
            </div>
          </div>
          <div class="sl">
            <div class="m">${it.desc || 'Vật phẩm hỗ trợ tu luyện Võ Lâm'}</div>
            <div class="b" style="margin-top:6px;color:#2ed573;">✨ Nhận để sử dụng trực tiếp trong hành trang</div>
          </div>
        `;
      } else if (it.type === 'ore') {
        html = `
          <div class="idet">
            <div class="pic"><img src="${it.ic}" alt=""></div>
            <div>
              <h4 style="color:#b388ff;">${it.name}</h4>
              <small class="dim">Khoáng Thạch / Nguyên Liệu Ép Đồ</small>
            </div>
          </div>
          <div class="sl">
            <div class="m">${it.desc || ''}</div>
            <div class="b" style="margin-top:6px;color:#ffd970;">🔮 Nạp trực tiếp vào hành trang & kho ép đồ Lò Rèn</div>
          </div>
        `;
      }
    } catch (err) {
      html = `<h4>${it.name}</h4><p class="dim">${it.desc || ''}</p>`;
    }

    if (!html) {
      html = `<h4>${it.name}</h4><p class="dim">${it.desc || ''}</p>`;
    }

    cachedPreviews.set(cacheKey, html);
    return html;
  }

  // --- ACTIONS ON GRID ITEMS ---
  window.__takeGridItem = function(idx, mode) {
    const list = window.__currentGridItems;
    if (!list || !list[idx]) return;
    const it = list[idx];
    const G = window.__GAME;
    if (!G || !G.o) {
      alert("Chưa vào nhân vật!");
      return;
    }
    const o = G.o;

    if (it.type === 'set') {
      if (mode === 'set') {
        window.__giveFullSet(it.kind, it.grp, it.data);
      } else {
        window.__giveSetItem(it.kind, it.data, it.sid, it.name);
      }
    } else if (it.type === 'horse') {
      let h = null;
      if (it.subType === 'thanma') {
        if (typeof G.ld === 'function') h = G.ld(it.tmCode);
      } else if (typeof G.TA === 'function') {
        h = G.TA(10, it.data.k, it.data.lvl || 1, 0);
      }
      if (!h) {
        h = {
          uid: o.uid++,
          d: 10,
          k: (it.data && it.data.k) || 0,
          p: (it.data && it.data.p) || 80,
          n: it.name,
          ic: it.ic || 'img/i/10_0.png',
          lvl: it.lvl || 1,
          s: it.s !== undefined ? it.s : -1,
          price: 50000,
          base: [],
          req: [[36, it.lvl || 1]],
          mag: [],
          ext: [],
          r: it.subType === 'thanma' ? 4 : 2,
          hlv: 20,
          hxp: 0,
          lock: 1
        };
      } else {
        h.hlv = 20;
        h.hxp = 0;
        h.lock = 1;
        if (it.subType !== 'thanma' && h.r === 3) h.r = 2; // Chặn kiểm tra ngựa tím hack
      }

      if (mode === 'stable') {
        o.stable = o.stable || [];
        if (o.stable.length >= 60) {
          if (typeof G.B === 'function') G.B('⚠️ Mã Trường đã đầy (tối đa 60 con)!');
          if (typeof G.M === 'function') G.M('Mã Trường đầy (60/60)');
          return;
        }
        o.stable.push(h);
        o.hbook = o.hbook || {};
        const cleanName = h.n.replace(/\s+\d+$/, '');
        o.hbook[cleanName] = cleanName;

        if (G.l) G.l.dirty = true;
        try { if (typeof G.k0 === 'function') G.k0(); } catch {}
        try { if (typeof G.H === 'function') G.H(); } catch {}
        try { if (typeof G.L1 === 'function') G.L1(); } catch {}
        try { if (typeof G.tg === 'function') G.tg(); } catch {}
        try { if (typeof G.k === 'function') G.k(); } catch {}
        if (typeof G.B === 'function') G.B(`🐎 Đã đưa [${h.n}] vào Mã Trường (${o.stable.length}/60) & Mở khóa trong Thú Điển Ngựa!`);
      } else {
        o.inv.push(h);
        if (G.l) G.l.dirty = true;
        try { if (typeof G.k0 === 'function') G.k0(); } catch {}
        try { if (typeof G.H === 'function') G.H(); } catch {}
        try { if (typeof G.L1 === 'function') G.L1(); } catch {}
        try { if (typeof G.tg === 'function') G.tg(); } catch {}
        try { if (typeof G.k === 'function') G.k(); } catch {}
        if (typeof G.B === 'function') G.B(`🐎 Đã nhận Thần Mã: [${h.n}] vào hành trang!`);
      }
    } else if (it.type === 'pet') {
      const ha = (typeof G.O0 === 'function' ? G.O0() : null) || (o && o.rw) || o;
      ha.petDex = ha.petDex || {};
      ha.petBox = ha.petBox || [];
      ha.petMat = ha.petMat || { tn: 0 };

      if (mode === 'dex') {
        if (it.subType === 'rare') {
          ha.petDex['r_' + it.rareKey] = 1;
          ha.petDex[it.tid] = 1;
        } else {
          ha.petDex[it.tid] = 1;
        }
        if (G.l) G.l.dirty = true;
        try { if (typeof G.k0 === 'function') G.k0(); } catch {}
        try { if (typeof G.H === 'function') G.H(); } catch {}
        try { if (typeof G.L1 === 'function') G.L1(); } catch {}
        try { if (typeof G.tg === 'function') G.tg(); } catch {}
        try { if (typeof G.k === 'function') G.k(); } catch {}
        if (typeof G.B === 'function') G.B(`🐾 Đã mở khóa [${it.name}] vào Thú Điển!`);
      } else {
        // Recruit companion into petBox (Giới hạn tối đa 6 con)
        if (ha.petBox.length >= 6) {
          if (typeof G.B === 'function') G.B(`⚠️ Chuồng Thú đã đầy (tối đa 6 con)! Hãy thả bớt thú trước khi thu phục thêm.`);
          if (typeof G.M === 'function') G.M('Chuồng thú đã đầy (6/6)');
          return;
        }
        if (it.subType === 'rare') {
          ha.petDex['r_' + it.rareKey] = 1;
          ha.petDex[it.tid] = 1;
        } else {
          ha.petDex[it.tid] = 1;
        }
        const petName = it.name.replace(' (Dị Thú)', '');
        let petInst = {
          tid: it.tid,
          rare: it.subType === 'rare' ? it.rareKey : undefined,
          n: petName,
          lvl: 150,
          xp: 0,
          star: 5,
          sk: it.subType === 'rare' ? [it.beastData.sk || 'hokhieu', 'hoi', 'bao', 'xuyen'] : ['hoi', 'bao', 'xuyen', 'lien'],
          evo: 2,
          eq: { vong: 10, giap: 10, bua: 10 },
          se: Math.floor(Math.random() * 5)
        };
        if (typeof G.G2 === 'function') {
          petInst = G.G2(petInst);
        }
        ha.petBox.push(petInst);
        if (!ha.pet) ha.pet = petInst;

        if (G.l) G.l.dirty = true;
        try { if (typeof G.k0 === 'function') G.k0(); } catch {}
        try { if (typeof G.H === 'function') G.H(); } catch {}
        try { if (typeof G.L1 === 'function') G.L1(); } catch {}
        try { if (typeof G.tg === 'function') G.tg(); } catch {}
        try { if (typeof G.k === 'function') G.k(); } catch {}
        if (typeof G.B === 'function') G.B(`🐾 Đã thu phục thành công [${petName}] 5★ Cực Phẩm vào Chuồng Thú (${ha.petBox.length}/6)!`);
      }
    } else if (it.type === 'consumable') {
      const count = typeof mode === 'number' ? mode : 99;
      // Ưu tiên nạp chuẩn bằng H6 gốc của game nếu là vật phẩm KTC
      if (typeof G.H6 === 'function' && (G.r0 || []).some(s => s.k === it.k)) {
        const ok = G.H6(it.k, count);
        if (ok) {
          if (G.l) G.l.dirty = true;
          try { if (typeof G.L1 === 'function') G.L1(); } catch {}
          try { if (typeof G.k === 'function') G.k(); } catch {}
          try { if (typeof G.H === 'function') G.H(); } catch {}
          try { if (typeof G.tg === 'function') G.tg(); } catch {}
          if (typeof G.B === 'function') G.B(`🧪 Đã nhận x${count} [${it.name}] vào hành trang!`);
          return;
        }
      }

      const r0Def = (G.r0 || []).find(s => s.k === it.k);
      const itemName = (typeof G.Dt === 'function' && r0Def) ? G.Dt(r0Def, count) : `${it.name}${count > 1 ? ' ×' + count : ''}`;
      const itemUid = o.uid++;
      o.inv.push({
        uid: itemUid,
        n: itemName,
        d: 99,
        k: 0,
        lvl: 1,
        s: -1,
        r: 2,
        ic: it.ic,
        price: 0,
        base: [],
        req: [],
        mag: [],
        ext: [],
        ktc: { k: it.k, c: count }
      });
      if (typeof G.U === 'function') G.U('misc', it.k, count);
      if (G.l) G.l.dirty = true;
      try { if (typeof G.k0 === 'function') G.k0(); } catch {}
      try { if (typeof G.H === 'function') G.H(); } catch {}
      try { if (typeof G.L1 === 'function') G.L1(); } catch {}
      try { if (typeof G.tg === 'function') G.tg(); } catch {}
      try { if (typeof G.k === 'function') G.k(); } catch {}
      if (typeof G.B === 'function') G.B(`🧪 Đã nhận x${count} [${it.name}] vào hành trang!`);
    } else if (it.type === 'ore') {
      const count = typeof mode === 'number' ? mode : 50;
      const itemUid = o.uid++;
      o.inv.push({
        uid: itemUid,
        n: `${it.name}${count > 1 ? ' ×' + count : ''}`,
        d: 99,
        k: 0,
        lvl: 1,
        s: -1,
        r: 2,
        ic: it.ic,
        price: 0,
        base: [],
        req: [],
        mag: [],
        ext: [],
        ktc: { k: it.k || it.name, c: count }
      });
      if (it.htLvl && typeof G.U === 'function') {
        G.U('ht', it.htLvl, count);
      } else if (it.daLvl && typeof G.U === 'function') {
        G.U('ore', it.daLvl, count);
      } else if (typeof G.U === 'function') {
        G.U('misc', it.k, count);
      }
      if (G.l) G.l.dirty = true;
      try { if (typeof G.k0 === 'function') G.k0(); } catch {}
      try { if (typeof G.H === 'function') G.H(); } catch {}
      try { if (typeof G.L1 === 'function') G.L1(); } catch {}
      try { if (typeof G.tg === 'function') G.tg(); } catch {}
      try { if (typeof G.k === 'function') G.k(); } catch {}
      if (typeof G.B === 'function') G.B(`🔮 Đã nhận x${count} [${it.name}] vào hành trang & kho ép đồ!`);
    }
  };


  window.__takeGridSet = function(idx) {
    const list = window.__currentGridItems;
    if (!list || !list[idx] || list[idx].type !== 'set') return;
    const it = list[idx];
    window.__giveFullSet(it.kind, it.grp, it.data);
  };

  // --- INITIALIZE DOM ---
  function initAll() {
    initDraggableFloatButton();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAll);
  } else {
    initAll();
  }
})();
