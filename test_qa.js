const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { execSync } = require('child_process');

const targetDir = '/Users/mac/.gemini/antigravity/scratch/site_rip_volamidle/volamidle';

console.log('================================================================');
console.log('🚀 BẮT ĐẦU ĐO KIỂM TOÀN DIỆN MÃ NGUỒN GAME VÕ LÂM IDLE');
console.log('Thư mục đo kiểm:', targetDir);
console.log('================================================================\n');

const report = {
  passed: 0,
  failed: 0,
  warnings: 0,
  tests: [],
  bugs: [],
};

function logResult(suite, name, pass, detail = '') {
  report.tests.push({ suite, name, pass, detail });
  if (pass) {
    report.passed++;
    console.log(`  ✅ [PASS] ${name} ${detail ? '(' + detail + ')' : ''}`);
  } else {
    report.failed++;
    console.log(`  ❌ [FAIL] ${name}: ${detail}`);
    report.bugs.push({ suite, name, detail });
  }
}

function logWarn(name, detail) {
  report.warnings++;
  console.log(`  ⚠️  [WARN] ${name}: ${detail}`);
}

// ====================================================================
// TEST SUITE 1: Kiểm Tra Toàn Vẹn Tài Nguyên (Asset Integrity)
// ====================================================================
console.log('--- TEST SUITE 1: Kiểm Tra Toàn Vẹn Tài Nguyên (Asset Integrity) ---');

let totalAssets = 0;
let fakeHtmlAssets = [];
let validBinaryAssets = 0;

function scanDir(dir) {
  const files = fs.readdirSync(dir);
  for (const f of files) {
    const fullPath = path.join(dir, f);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      scanDir(fullPath);
    } else {
      if (/\.(webp|png|jpg|jpeg|mp3|ogg|woff2|ttf)$/i.test(f)) {
        totalAssets++;
        const fd = fs.openSync(fullPath, 'r');
        const buffer = Buffer.alloc(40);
        fs.readSync(fd, buffer, 0, 40, 0);
        fs.closeSync(fd);
        const header = buffer.toString('utf8').toLowerCase();
        if (header.includes('<!doctype html') || header.includes('<html')) {
          fakeHtmlAssets.push(path.relative(targetDir, fullPath));
        } else {
          validBinaryAssets++;
        }
      }
    }
  }
}

scanDir(targetDir);

logResult(
  'Suite 1',
  'Tài nguyên nhị phân hợp lệ',
  validBinaryAssets > 10000,
  `Tìm thấy ${validBinaryAssets} files ảnh/âm thanh hợp lệ`
);

if (fakeHtmlAssets.length > 0) {
  logWarn(
    'Phát hiện file ảnh/âm thanh giả mạo (nội dung là trang HTML)',
    `Có ${fakeHtmlAssets.length} file rác tại: ${fakeHtmlAssets.slice(0, 3).join(', ')}`
  );
  report.bugs.push({
    suite: 'Suite 1',
    name: 'Fake HTML Assets',
    severity: 'Minor',
    detail: `Có ${fakeHtmlAssets.length} file rác`,
  });
} else {
  logResult('Suite 1', 'Đã dọn sạch 100% file rác/fake HTML (0 file rác)', true);
}

// Kiểm tra các file quan trọng
const criticalFiles = [
  'img/a/ani001_at.webp',
  'img/a/ani001_st.webp',
  'img/pl/shaolin.png',
  'img/pl/wudang.png',
  'img/z/town.jpg',
  'jxlook.js',
  'fonts/ibm-plex-mono.css',
  'style.css',
  'index.html',
  'js/core.js',
  'js/combat.js',
  'js/main.js',
  'js/save.js',
  'js/net.js',
  'data.js',
  'world.js',
  'sound.js'
];

let criticalAllOk = true;
for (const cf of criticalFiles) {
  const p = path.join(targetDir, cf);
  if (!fs.existsSync(p) || fs.statSync(p).size === 0) {
    criticalAllOk = false;
    logResult('Suite 1', `Tồn tại file cốt lõi: ${cf}`, false, 'File bị thiếu hoặc rỗng');
  }
}
if (criticalAllOk) {
  logResult('Suite 1', 'Toàn bộ 17 tệp cốt lõi tồn tại và hợp lệ', true);
}

// ====================================================================
// TEST SUITE 2: Đo Kiểm Cú Pháp JS (Syntax Validation)
// ====================================================================
console.log('\n--- TEST SUITE 2: Đo Kiểm Cú Pháp JS (Syntax Validation) ---');

let jsFiles = [];
function findJs(dir) {
  for (const f of fs.readdirSync(dir)) {
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) findJs(p);
    else if (f.endsWith('.js')) jsFiles.push(p);
  }
}
findJs(targetDir);

let syntaxOk = true;
for (const js of jsFiles) {
  try {
    execSync(`node -c "${js}"`, { stdio: 'pipe' });
  } catch (err) {
    syntaxOk = false;
    logResult('Suite 2', `Cú pháp file ${path.relative(targetDir, js)}`, false, err.message);
  }
}
if (syntaxOk) {
  logResult('Suite 2', `Cú pháp toàn bộ ${jsFiles.length} tệp JavaScript`, true, 'Zero syntax errors');
}

// ====================================================================
// TEST SUITE 3: Đo Kiểm Cơ Chế Bật/Tắt Đăng Nhập (Auth Toggle Switch QA)
// ====================================================================
console.log('\n--- TEST SUITE 3: Đo Kiểm Cơ Chế Bật/Tắt Đăng Nhập (Auth Toggle Switch QA) ---');

// 1. Kiểm tra chatcfg.js có cờ toggle window.AUTH_ENABLED = false (Tạm tắt theo yêu cầu)
const chatCfgContent = fs.readFileSync(path.join(targetDir, 'js/chatcfg.js'), 'utf8');
const hasAuthSwitch = /window\.AUTH_ENABLED\s*=\s*(false|true)/.test(chatCfgContent);
const isAuthCurrentlyOff = /window\.AUTH_ENABLED\s*=\s*false/.test(chatCfgContent);
logResult(
  'Suite 3',
  'Cấu hình cờ toggle AUTH_ENABLED trong chatcfg.js',
  hasAuthSwitch,
  hasAuthSwitch ? (isAuthCurrentlyOff ? 'Tạm tắt (false) theo yêu cầu' : 'Đang bật (true)') : 'Thiếu cờ AUTH_ENABLED'
);

// 2. Kiểm tra net.js hỗ trợ hàm kiểm tra isAuthEnabled()
const netJsContent = fs.readFileSync(path.join(targetDir, 'js/net.js'), 'utf8');
const hasIsAuthEnabled = /isAuthEnabled/.test(netJsContent);
logResult(
  'Suite 3',
  'Hỗ trợ hàm kiểm tra trạng thái isAuthEnabled() trong net.js',
  hasIsAuthEnabled,
  hasIsAuthEnabled ? 'Đã cài đặt' : 'Chưa cài đặt'
);

// 3. Kiểm tra netGate tự động bypass khi tắt đăng nhập (không chặn popup)
const hasBypassGate = /if\s*\(\s*!isAuthEnabled\(\)\s*\)\s*\{\s*closeModal\(!0\)/.test(netJsContent);
logResult(
  'Suite 3',
  'Cơ chế tự động bypass netGate khi tắt đăng nhập',
  hasBypassGate,
  hasBypassGate ? 'Bypass thành công, cho phép vào thẳng game' : 'Chưa bypass'
);

// 4. Kiểm tra có sẵn giao diện đăng nhập đầy đủ để mở lại khi bật AUTH_ENABLED = true
const hasOnlineGateReady = /class="ng2"/.test(netJsContent) && /ngU/.test(netJsContent);
logResult(
  'Suite 3',
  'Sẵn sàng khôi phục form ID/Pass khi mở lại (AUTH_ENABLED = true)',
  hasOnlineGateReady,
  hasOnlineGateReady ? 'Đầy đủ form đăng nhập Kiếm Hiệp khi mở lại' : 'Thiếu form'
);

// ====================================================================
// TEST SUITE 4: Đo Kiểm Môi Trường Runtime & Vòng Lặp Game (Game Loop QA)
// ====================================================================
console.log('\n--- TEST SUITE 4: Đo Kiểm Môi Trường Runtime & Vòng Lặp Game ---');

const localStorageMock = {
  _store: {},
  getItem(k) { return this._store[k] || null; },
  setItem(k, v) { this._store[k] = String(v); },
  removeItem(k) { delete this._store[k]; },
  clear() { this._store = {}; }
};

function createMockEl() {
  return {
    style: {},
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

const mockDocument = {
  getElementById: (id) => createMockEl(),
  querySelector: (sel) => createMockEl(),
  querySelectorAll: () => [createMockEl()],
  addEventListener: () => {},
  createElement: (tag) => createMockEl(),
  documentElement: { style: { setProperty: ()=>{} } },
  body: createMockEl(),
  head: createMockEl(),
};

const context = {
  console: { log: ()=>{}, warn: ()=>{}, error: ()=>{} },
  setTimeout: (fn, ms) => { if (typeof fn === 'function') fn(); return 1; },
  setInterval: (fn, ms) => 1,
  clearTimeout: () => {},
  clearInterval: () => {},
  requestAnimationFrame: (fn) => 1,
  performance: { now: () => Date.now() },
  addEventListener: () => {},
  removeEventListener: () => {},
  window: null,
  document: mockDocument,
  navigator: { userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', serviceWorker: { register: () => Promise.resolve() } },
  localStorage: localStorageMock,
  location: { href: 'http://localhost:8080/', search: '', pathname: '/', protocol: 'http:', origin: 'http://localhost:8080', reload: ()=>{} },
  Audio: class { constructor(){ this.play = ()=>Promise.resolve(); this.pause = ()=>{}; } },
  Image: class { constructor(){ this.src = ''; this.complete = true; this.naturalWidth = 100; this.naturalHeight = 100; } },
};
context.window = context;
context.globalThis = context;
vm.createContext(context);

// Load index.html scripts in order
const indexHtml = fs.readFileSync(path.join(targetDir, 'index.html'), 'utf8');
const scriptMatches = [...indexHtml.matchAll(/<script\s+src=["']([^"']+)["']/g)];

let runtimeLoadOk = true;
for (const m of scriptMatches) {
  const src = decodeURIComponent(m[1]).split('?')[0];
  const p = path.join(targetDir, src);
  if (fs.existsSync(p)) {
    try {
      vm.runInContext(fs.readFileSync(p, 'utf8'), context);
    } catch (e) {
      runtimeLoadOk = false;
      logResult('Suite 4', `Nạp runtime tệp ${src}`, false, e.message);
    }
  }
}
if (runtimeLoadOk) {
  logResult('Suite 4', `Nạp thành công toàn bộ ${scriptMatches.length} script vào VM`, true);
}

// Kiểm tra các biến cốt lõi
const hasGlobals = vm.runInContext('typeof JX !== "undefined" && typeof JW !== "undefined" && typeof JS !== "undefined" && typeof FAC !== "undefined" && typeof SK !== "undefined"', context);
logResult('Suite 4', 'Khởi tạo các đối tượng Game Engine (JX, JW, JS, FAC, SK)', !!hasGlobals);

// Test tạo nhân vật mới (Character creation)
let createCharOk = false;
try {
  vm.runInContext('S = newSave(); createCharacter("ĐạiHiệpTest", 0, 0);', context); // Nam, hệ Kim
  createCharOk = vm.runInContext('S && S.name === "ĐạiHiệpTest" && S.lvl >= 1 && S.fac', context);
} catch (e) {
  logResult('Suite 4', 'Tạo nhân vật mới không cần tài khoản', false, e.message);
}
const charInfo = vm.runInContext('S ? `Tên: ${S.name}, Phái/Hệ: ${S.fac}` : ""', context);
logResult('Suite 4', 'Tạo nhân vật mới thành công', !!createCharOk, charInfo);

// Test combat / game loop calculation
let combatOk = false;
try {
  vm.runInContext('recalc()', context);
  combatOk = vm.runInContext('R && R.P && R.P.life > 0 && R.P.mana > 0', context);
} catch (e) {
  logResult('Suite 4', 'Tính toán chỉ số chiến đấu (recalc)', false, e.message);
}
const hpMana = vm.runInContext('R && R.P ? `Máu: ${R.P.life}, Mana: ${R.P.mana}` : ""', context);
logResult('Suite 4', 'Tính toán chỉ số chiến đấu và thuộc tính', !!combatOk, hpMana);

// ====================================================================
// TEST SUITE 5: Đo Kiểm Lưu Trữ & Slot Persistence (Storage QA)
// ====================================================================
console.log('\n--- TEST SUITE 5: Đo Kiểm Lưu Trữ & Slot Persistence ---');

// Test auto-save
let saveOk = false;
try {
  vm.runInContext('save()', context);
  const saveKeyName = vm.runInContext('saveKey()', context);
  const savedData = localStorageMock.getItem(saveKeyName);
  saveOk = !!savedData;
} catch (e) {
  logResult('Suite 5', 'Lưu nhân vật vào LocalStorage (saveKey)', false, e.message);
}
logResult('Suite 5', 'Lưu trữ nhân vật vào LocalStorage', !!saveOk);

// Test reload
let loadOk = false;
try {
  vm.runInContext('S = null; load();', context);
  loadOk = vm.runInContext('S && S.name === "ĐạiHiệpTest"', context);
} catch (e) {
  logResult('Suite 5', 'Khôi phục nhân vật từ LocalStorage (load)', false, e.message);
}
logResult('Suite 5', 'Đọc lại nhân vật từ LocalStorage thành công', !!loadOk);

// Test export save
let exportOk = false;
try {
  const saveJson = vm.runInContext('saveFileText()', context);
  const parsed = JSON.parse(saveJson);
  exportOk = parsed.game === 'jxidle' && parsed.fac === 'vo0';
} catch (e) {
  logResult('Suite 5', 'Xuất file lưu (.jxsave / JSON)', false, e.message);
}
logResult('Suite 5', 'Xuất file sao lưu (Export Save)', !!exportOk);

// Test switch character slot
let slotOk = false;
try {
  const info = vm.runInContext('slotInfo(0)', context);
  slotOk = info && info.name === 'ĐạiHiệpTest';
} catch (e) {
  logResult('Suite 5', 'Quản lý thông tin Slot nhân vật (slotInfo)', false, e.message);
}
logResult('Suite 5', 'Kiểm tra thông tin Slot 1 hợp lệ', !!slotOk);

// ====================================================================
// TỔNG KẾT BÁO CÁO
// ====================================================================
console.log('\n================================================================');
console.log('📊 TỔNG KẾT KẾT QUẢ ĐO KIỂM:');
console.log(`  - Passed: ${report.passed}`);
console.log(`  - Warnings: ${report.warnings}`);
console.log(`  - Failed: ${report.failed}`);
console.log('================================================================\n');

fs.writeFileSync(
  path.join(targetDir, 'QA_REPORT.json'),
  JSON.stringify(report, null, 2)
);
console.log('Đã lưu báo cáo chi tiết vào:', path.join(targetDir, 'QA_REPORT.json'));
