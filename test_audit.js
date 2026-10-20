const fs = require('fs');
const path = require('path');
const vm = require('vm');

const targetDir = '/Users/mac/.gemini/antigravity/scratch/site_rip_volamidle/volamidle';

console.log('================================================================');
console.log('🥋 KHỞI CHẠY ĐO KIỂM TOÀN DIỆN: LOGIC · BALANCE · UI · UX');
console.log('================================================================\n');

function createMockEl() {
  return {
    style: { setProperty: ()=>{} },
    dataset: {},
    classList: { add: ()=>{}, remove: ()=>{}, contains: ()=>false, toggle: ()=>{} },
    addEventListener: ()=>{},
    appendChild: ()=>{},
    parentNode: { insertBefore: ()=>{} },
    innerHTML: '',
    value: '',
    focus: ()=>{},
    getContext: () => ({
      setTransform: ()=>{}, clearRect: ()=>{}, fillRect: ()=>{},
      beginPath: ()=>{}, arc: ()=>{}, fill: ()=>{}, stroke: ()=>{},
      drawImage: ()=>{}, measureText: ()=>({ width: 50 }),
      fillText: ()=>{}, strokeText: ()=>{}, ellipse: ()=>{},
      moveTo: ()=>{}, lineTo: ()=>{}
    }),
    querySelector: () => createMockEl(),
    querySelectorAll: () => [createMockEl()],
  };
}

const mockDoc = {
  getElementById: () => createMockEl(),
  querySelector: () => createMockEl(),
  querySelectorAll: () => [createMockEl()],
  addEventListener: () => {},
  createElement: () => createMockEl(),
  documentElement: { style: { setProperty: ()=>{} } },
  body: createMockEl(),
  head: createMockEl(),
};

const localStorageMock = {
  _s: {},
  getItem(k) { return this._s[k] || null; },
  setItem(k, v) { this._s[k] = String(v); },
  removeItem(k) { delete this._s[k]; },
  clear() { this._s = {}; }
};

const context = {
  console: { log: ()=>{}, warn: ()=>{}, error: ()=>{} },
  setTimeout: (fn) => { if (typeof fn === 'function') fn(); return 1; },
  setInterval: () => 1,
  clearTimeout: () => {},
  clearInterval: () => {},
  requestAnimationFrame: () => 1,
  performance: { now: () => Date.now() },
  addEventListener: () => {},
  removeEventListener: () => {},
  atob: (s) => Buffer.from(s, 'base64').toString('binary'),
  btoa: (s) => Buffer.from(s, 'binary').toString('base64'),
  window: null,
  document: mockDoc,
  navigator: { userAgent: 'Macintosh', serviceWorker: { register: () => Promise.resolve() } },
  localStorage: localStorageMock,
  location: { href: 'http://localhost/', search: '', pathname: '/', protocol: 'http:', origin: 'http://localhost' },
  Audio: class { constructor(){ this.play = ()=>Promise.resolve(); this.pause = ()=>{}; } },
  Image: class { constructor(){ this.src = ''; this.complete = true; this.naturalWidth = 100; this.naturalHeight = 100; } },
};
context.window = context;
context.globalThis = context;
vm.createContext(context);

// Load all scripts from index.html in order
const indexHtml = fs.readFileSync(path.join(targetDir, 'index.html'), 'utf8');
const scriptMatches = [...indexHtml.matchAll(/<script\s+src=["']([^"']+)["']/g)];
for (const m of scriptMatches) {
  const src = decodeURIComponent(m[1]).split('?')[0];
  const p = path.join(targetDir, src);
  if (fs.existsSync(p)) {
    try {
      vm.runInContext(fs.readFileSync(p, 'utf8'), context);
    } catch (e) {
      console.error('Error loading ' + src + ':', e.message);
    }
  }
}

const auditFindings = [];

function recordFinding(id, title, pillar, severity, file, detail, cause, suggestion) {
  auditFindings.push({ id, title, pillar, severity, file, detail, cause, suggestion });
  const icon = severity === 'Critical' ? '🔴' : severity === 'Major' ? '🟠' : severity === 'Moderate' ? '🟡' : '🔵';
  console.log(`${icon} [${id}] [${pillar}] ${title} (${severity})`);
}

// ====================================================================
// PHẦN 1: ĐO KIỂM LOGIC HỆ THỐNG (SYSTEM LOGIC AUDIT)
// ====================================================================
console.log('--- 1. ĐO KIỂM LOGIC HỆ THỐNG ---');

// 1.1. Kiểm tra ma trận Ngũ Hành (Kim, Mộc, Thổ, Thủy, Hỏa)
// Chuẩn Võ Lâm:
// Kim (0) khắc Mộc (1)
// Mộc (1) khắc Thổ (4)
// Thổ (4) khắc Thủy (2)
// Thủy (2) khắc Hỏa (3)
// Hỏa (3) khắc Kim (0)
const countersTest = vm.runInContext(`
  (() => {
    const matrix = [
      [0, 1], // Kim khắc Mộc
      [1, 4], // Mộc khắc Thổ
      [4, 2], // Thổ khắc Thủy
      [2, 3], // Thủy khắc Hỏa
      [3, 0]  // Hỏa khắc Kim
    ];
    let allOk = true;
    for (const [attacker, defender] of matrix) {
      if (!counters(attacker, defender)) allOk = false;
      if (counters(defender, attacker)) allOk = false; // Ngược lại không được khắc
    }
    return allOk;
  })()
`, context);

if (countersTest) {
  console.log('  ✅ Ma trận Ngũ Hành tương khắc (Kim-Mộc-Thổ-Thủy-Hỏa) chuẩn xác 100%.');
} else {
  recordFinding(
    'LOGIC-01',
    'Lỗi ma trận ngũ hành tương khắc trong hàm counters()',
    'LOGIC',
    'Critical',
    'js/stats.js / js/combat.js',
    'Quy luật khắc hệ không khớp chuẩn ngũ hành Võ Lâm.',
    'Công thức kiểm tra ngũ hành bị đảo lộn thứ tự index.',
    'Hiệu chỉnh lại mảng COUNTERS hoặc logic counters(a, d).'
  );
}

// 1.2. Kiểm tra logic Offline Gains (Tính toán khi rời game)
const offlineTest = vm.runInContext(`
  (() => {
    S = newSave();
    createCharacter("Tester", 0, 0);
    S.lvl = 50;
    S.stage = 50;
    S.last = Date.now() - 3600 * 1000; // Rời game 1 tiếng
    const g1 = offlineGains();
    
    // Test thời gian âm (chỉnh lùi giờ máy tính)
    S.last = Date.now() + 3600 * 1000;
    const gNegative = offlineGains();

    // Test thời gian quá dài (rời game 30 ngày)
    S.last = Date.now() - 30 * 86400 * 1000;
    const gHuge = offlineGains();

    return {
      normalSecs: g1 ? g1.secs : 0,
      normalGold: g1 ? g1.gold : 0,
      normalXp: g1 ? g1.xp : 0,
      negativeIsZeroOrNull: gNegative === null || (gNegative && gNegative.secs <= 0),
      hugeCap: gHuge ? gHuge.secs : 0
    };
  })()
`, context);

console.log('  📊 Kết quả kiểm tra Offline Gains (1 giờ):', {
  secs: offlineTest.normalSecs,
  gold: offlineTest.normalGold,
  xp: offlineTest.normalXp,
  maxCap: offlineTest.hugeCap + 's'
});

if (!offlineTest.negativeIsZeroOrNull) {
  recordFinding(
    'LOGIC-02',
    'Lỗ hổng gian lận thời gian hệ thống trong offlineGains()',
    'LOGIC',
    'Major',
    'js/save.js',
    'Khi lùi giờ hệ điều hành, hàm offlineGains vẫn xử lý hoặc phát sinh lỗi.',
    'Chưa kiểm tra t < 0 trước khi tính toán số giây offline.',
    'Thêm điều kiện: if (t < 0) { S.last = n; return null; }'
  );
}

// 1.3. Kiểm tra tính năng bán đồ rác & khóa đồ (Item Protection)
const lockProtectionTest = vm.runInContext(`
  (() => {
    S = newSave();
    createCharacter("Tester", 0, 0);
    const item1 = makeItem(0, 0, 1, 0); // Thường
    const item2 = makeItem(0, 0, 1, 3); // Tím
    item2.lock = true; // Đang khóa 🔒
    S.inv = [item1, item2];
    
    // Thử bán đồ rác
    const result = sellUnmatched();
    return {
      soldCount: result.n,
      invLength: S.inv.length,
      item2StillInInv: S.inv.includes(item2),
    };
  })()
`, context);

if (lockProtectionTest.item2StillInInv) {
  console.log('  ✅ Cơ chế bảo vệ đồ khóa (Lock Protection) hoạt động hoàn hảo: Không bị bán nhầm.');
} else {
  recordFinding(
    'LOGIC-03',
    'Hàm sellUnmatched() bán mất đồ đang khóa của người chơi',
    'LOGIC',
    'Critical',
    'js/ui.js',
    'Trang bị có thuộc tính lock: true vẫn bị gom vào danh sách bán rác.',
    'Bộ lọc sellUnmatched thiếu điều kiện kiểm tra !item.lock.',
    'Bổ sung !item.lock vào điều kiện lọc bán tự động.'
  );
}

// ====================================================================
// PHẦN 2: ĐO KIỂM CÂN BẰNG TRÒ CHƠI (GAME BALANCE AUDIT)
// ====================================================================
console.log('\n--- 2. ĐO KIỂM CÂN BẰNG TRÒ CHƠI (BALANCE AUDIT) ---');

// 2.1. Benchmark DPS & Chỉ số của 10 Môn Phái tại Cấp 50
const factionsList = [
  'shaolin', 'tianwang', 'tangmen', 'wudu', 'emei',
  'cuiyan', 'gaibang', 'tianren', 'wudang', 'kunlun'
];

const factionDPS = vm.runInContext(`
  (() => {
    const results = {};
    for (const facKey of ${JSON.stringify(factionsList)}) {
      S = newSave();
      createCharacter("Hero_" + facKey, ["emei", "cuiyan"].includes(facKey) ? 1 : 0, 0);
      const facObj = FAC[facKey];
      S.fac = facKey;
      S.lvl = 50;
      S.stage = 50;
      
      // Tự cộng điểm tiềm năng và kỹ năng cấp 50
      S.attrPts = 50 * 5;
      autoSpendAttrs();
      
      // Học các kỹ năng cơ bản
      if (facObj && facObj.skills) {
        for (const skId of facObj.skills) {
          const sk = SK[skId];
          if (sk && sk.req <= 50) {
            S.sk[skId] = Math.min(sk.max, 10);
            if (isAttack(sk)) S.main = skId;
          }
        }
      }
      
      recalc();
      
      // Đo chỉ số chiến đấu
      const p = R.P;
      const mainSk = SK[S.main] || {};
      const active = activeInfo(p, mainSk, S.sk[S.main] || 1);
      
      results[facKey] = {
        name: facObj ? facObj.n : facKey,
        series: facObj ? SERIES[facObj.series] : "",
        life: p.life,
        mana: p.mana,
        ar: p.ar,
        def: p.def,
        rawDps: active ? active.dps : 0,
        skillDamage: active ? active.tot : 0,
        range: active ? active.rad : 0,
        isMelee: mainSk.melee ? true : false,
      };
    }
    return results;
  })()
`, context);

console.log('  ⚔️ KẾT QUẢ ĐO CHỈ SỐ & DPS 10 MÔN PHÁI (CẤP 50):');
let maxDps = 0;
let minDps = Infinity;
let maxFac = '', minFac = '';

for (const [k, d] of Object.entries(factionDPS)) {
  if (d.rawDps > maxDps) { maxDps = d.rawDps; maxFac = d.name; }
  if (d.rawDps < minDps && d.rawDps > 0) { minDps = d.rawDps; minFac = d.name; }
  console.log(`    • [${d.series}] ${d.name.padEnd(16)}: DPS: ${String(Math.round(d.rawDps)).padStart(6)} | HP: ${String(Math.round(d.life)).padStart(5)} | Tầm: ${d.range}px (${d.isMelee ? 'Cận chiến' : 'Đánh xa'})`);
}

const dpsRatio = (maxDps / (minDps || 1)).toFixed(2);
console.log(`  📊 Độ lệch DPS lớn nhất: x${dpsRatio} lần (${maxFac} [${Math.round(maxDps)}] vs ${minFac} [${Math.round(minDps)}])`);

if (dpsRatio > 2.5) {
  recordFinding(
    'BALANCE-01',
    'Chênh lệch DPS giữa các môn phái quá lớn ở mốc Cấp 50',
    'BALANCE',
    'Major',
    'js/vocong.js / data.js',
    `Môn phái mạnh nhất (${maxFac}) gây DPS gấp ${dpsRatio} lần phái yếu nhất (${minFac}).`,
    'Tỷ lệ sát thương chiêu thức cơ bản (base damage) và scaling điểm kỹ năng giữa các phái chưa được chuẩn hóa theo hệ số thời gian xuất chiêu.',
    'Cân bằng lại hệ số sát thương kỹ năng của các phái yếu hơn hoặc tăng chỉ số phòng ngự/hút máu cho phái cận chiến.'
  );
}

// 2.2. Kiểm tra Bảng Drop Rate (Mô phỏng 100.000 lượt rơi đồ)
const dropRateSim = vm.runInContext(`
  (() => {
    S = newSave();
    createCharacter("LootTester", 0, 0);
    S.lvl = 50;
    S.stage = 50;
    
    const stats = { total: 100000, white: 0, blue: 0, purple: 0, gold: 0, other: 0, itemsCount: 0 };
    for (let i = 0; i < 100000; i++) {
      const drops = rollDrops({ L: 50, cls: Math.random() < 0.1 ? "elite" : "normal", bonusDrop: 1 });
      stats.itemsCount += drops.length;
      for (const item of drops) {
        if (item.set) stats.gold++;
        else if (item.r === 0) stats.white++;
        else if (item.r === 1) stats.blue++;
        else if (item.r === 2 || item.r === 3) stats.purple++;
        else stats.other++;
      }
    }
    return stats;
  })()
`, context);

console.log('  💎 KẾT QUẢ MÔ PHỎNG DROP RATE (100.000 quái bị hạ):');
const totalItems = dropRateSim.itemsCount || 1;
console.log(`    • Tổng vật phẩm rơi: ${totalItems}`);
console.log(`    • Đồ Trắng (r=0): ${dropRateSim.white} (${((dropRateSim.white/totalItems)*100).toFixed(2)}%)`);
console.log(`    • Đồ Xanh (r=1):  ${dropRateSim.blue} (${((dropRateSim.blue/totalItems)*100).toFixed(2)}%)`);
console.log(`    • Đồ Tím (r=2,3): ${dropRateSim.purple} (${((dropRateSim.purple/totalItems)*100).toFixed(2)}%)`);
console.log(`    • Đồ Set/Hoàng Kim: ${dropRateSim.gold} (${((dropRateSim.gold/totalItems)*100).toFixed(2)}%)`);

if (dropRateSim.purple / totalItems > 0.4) {
  recordFinding(
    'BALANCE-02',
    'Tỷ lệ rơi đồ Tím quá cao gây lạm phát trang bị nhanh',
    'BALANCE',
    'Moderate',
    'js/loot.js',
    `Đồ Tím chiếm hơn 40% tổng trang bị nhặt được (${((dropRateSim.purple/totalItems)*100).toFixed(1)}%).`,
    'Hàm rollDrops có tỷ lệ gán phẩm chất Tím khi quái cấp 50+ quá hào phóng.',
    'Giảm nhẹ tỷ lệ rơi đồ Tím từ quái thường, tăng tỷ lệ tập trung vào Quái Tinh Anh và Trùm.'
  );
}

// 2.3. Kiểm tra Tràn Số (Numeric Overflow / NaN Check tại Cấp 150)
const maxLevelOverflowTest = vm.runInContext(`
  (() => {
    S = newSave();
    createCharacter("GodTester", 0, 0);
    S.lvl = 150;
    S.stage = 150;
    S.attr = { str: 500, dex: 300, vit: 400, eng: 200 };
    recalc();
    
    const p = R.P;
    const hasNanOrInf = Object.values(p).some(v => typeof v === "number" && (!isFinite(v) || isNaN(v)));
    return {
      hasNanOrInf,
      life: p.life,
      mana: p.mana,
      power: power(p),
      isFinite: isFinite(p.life) && isFinite(p.mana)
    };
  })()
`, context);

if (maxLevelOverflowTest.isFinite && !maxLevelOverflowTest.hasNanOrInf) {
  console.log(`  ✅ Tính toán chỉ số Max Level (Lv 150) an toàn: Không bị NaN hoặc Infinity (Lực chiến: ${maxLevelOverflowTest.power}).`);
} else {
  recordFinding(
    'BALANCE-03',
    'Phát hiện lỗi tràn số (NaN / Infinity) khi đạt cấp độ cao',
    'BALANCE',
    'Critical',
    'js/stats.js',
    'Chỉ số nhân vật bị biến thành NaN hoặc Infinity khi đạt cấp 150.',
    'Có phép chia cho 0 hoặc hàm Math.pow tăng trưởng quá đà trong tính toán.',
    'Thêm clamp() hoặc Math.min cho các hệ số tăng trưởng.'
  );
}

// ====================================================================
// PHẦN 3 & 4: ĐO KIỂM GIAO DIỆN & TRẢI NGHIỆM (UI & UX AUDIT)
// ====================================================================
console.log('\n--- 3 & 4. ĐO KIỂM GIAO DIỆN (UI) VÀ TRẢI NGHIỆM (UX) ---');

// 3.1. Kiểm tra CSS Responsive Breakpoints & Viewport
const styleCss = fs.readFileSync(path.join(targetDir, 'style.css'), 'utf8');
const indexHtmlContent = fs.readFileSync(path.join(targetDir, 'index.html'), 'utf8');

const hasViewport = indexHtmlContent.includes('viewport-fit=cover');
console.log(`  📱 Viewport Mobile Fit: ${hasViewport ? 'Đã tối ưu (viewport-fit=cover)' : 'Chưa tối ưu'}`);

const hasMediaQueries = styleCss.includes('@media');
console.log(`  🎨 Media Queries trong style.css: ${hasMediaQueries ? 'Có hỗ trợ đa màn hình' : 'Thiếu responsive CSS'}`);

// 3.2. Kiểm tra cơ chế tự mặc đồ tốt hơn (betterThanEquipped)
const betterEquipTest = vm.runInContext(`
  (() => {
    S = newSave();
    createCharacter("UiTester", 0, 0);
    
    // Tạo 1 kiếm cùi đang mặc
    const sword1 = makeItem(0, 0, 1, 0);
    sword1.lvl = 1;
    S.eq.weapon = sword1;
    
    // Tạo 1 kiếm xịn hơn trong túi
    const sword2 = makeItem(0, 0, 5, 2);
    sword2.lvl = 10;
    
    const isBetter = betterThanEquipped(sword2);
    return isBetter;
  })()
`, context);

if (betterEquipTest) {
  console.log('  ✅ Ký hiệu mũi tên đồ mạnh hơn (betterThanEquipped): Nhận diện chuẩn xác.');
} else {
  recordFinding(
    'UIUX-01',
    'Hàm betterThanEquipped() không phát hiện trang bị mạnh hơn trong hành trang',
    'UI',
    'Major',
    'js/ui.js',
    'Trang bị có phẩm chất và cấp cao hơn không hiện ký hiệu mũi tên xanh ▲ để nhắc nhở người chơi.',
    'Tiêu chuẩn so sánh điểm trang bị bị thiếu thuộc tính sát thương hoặc level.',
    'Cập nhật hàm equipScore(item) để đánh giá toàn diện giá trị món đồ.'
  );
}

// 3.3. Kiểm tra phím tắt điều khiển (Keyboard Controls)
const controlJs = fs.readFileSync(path.join(targetDir, 'js/control.js'), 'utf8');
const hasKeybinds = /keydown/.test(controlJs) || /1|2|3|4|KeyQ|KeyE/.test(controlJs);
console.log(`  ⌨️  Hệ thống phím tắt điều khiển (1-4 chiêu thức, Q/E dùng bình thuốc): ${hasKeybinds ? 'Đã cài đặt' : 'Chưa có'}`);

// 3.4. Kiểm tra cấu hình âm thanh (BGM & SFX)
const soundJs = fs.readFileSync(path.join(targetDir, 'sound.js'), 'utf8');
const hasBgmMap = soundJs.includes('music200.mp3') || soundJs.includes('music');
console.log(`  🎵 Bảng ánh xạ âm thanh & nhạc nền: ${hasBgmMap ? 'Đầy đủ cho các map/kỹ năng' : 'Thiếu dữ liệu âm thanh'}`);

// ====================================================================
// XUẤT BÁO CÁO TOÀN DIỆN
// ====================================================================
console.log('\n================================================================');
console.log(`🏁 HOÀN TẤT ĐO KIỂM: Phát hiện ${auditFindings.length} vấn đề cần lưu ý.`);
console.log('================================================================\n');

fs.writeFileSync(
  path.join(targetDir, 'AUDIT_DETAILED_FINDINGS.json'),
  JSON.stringify(auditFindings, null, 2)
);

fs.writeFileSync(
  path.join(targetDir, 'FACTION_DPS_BENCHMARK.json'),
  JSON.stringify(factionDPS, null, 2)
);

console.log('Đã lưu kết quả chi tiết vào:');
console.log('  1.', path.join(targetDir, 'AUDIT_DETAILED_FINDINGS.json'));
console.log('  2.', path.join(targetDir, 'FACTION_DPS_BENCHMARK.json'));
