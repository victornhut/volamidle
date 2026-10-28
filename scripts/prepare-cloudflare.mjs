import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const output = path.join(root, 'public');

const rootFiles = [
  'index.html', 'data.js', 'fx.js', 'fx2.js', 'fx3.js', 'jmo.js', 'jmo2.js',
  'jxlook.js', 'jxstate.js', 'rdata.js', 'setfix.js', 'setvi.js', 'sound.js',
  'style.css', 'jx1ui.css', 'jx1ui2.css', 'ui20.css', 'world.js', 'zones2.js',
  'manifest.json', 'favicon.ico', 'favicon.png', 'robots.txt'
];
const directories = ['fonts', 'fx', 'img', 'music', 'snd', 'ui'];

async function exists(p) {
  try { await fs.access(p); return true; } catch { return false; }
}
async function copyFileIfExists(name) {
  const from = path.join(root, name);
  if (!(await exists(from))) return false;
  const to = path.join(output, name);
  await fs.mkdir(path.dirname(to), { recursive: true });
  await fs.copyFile(from, to);
  return true;
}

if (!(await exists(path.join(root, 'index.html')))) {
  console.error('Không tìm thấy index.html. Hãy chạy script trong thư mục gốc repository victornhut/volamidle.');
  process.exit(1);
}

await fs.rm(output, { recursive: true, force: true });
await fs.mkdir(output, { recursive: true });
let copied = 0;
for (const file of rootFiles) if (await copyFileIfExists(file)) copied++;
for (const directory of directories) {
  const from = path.join(root, directory);
  if (!(await exists(from))) continue;
  await fs.cp(from, path.join(output, directory), { recursive: true });
  copied++;
}

// The source HTML links to a manifest; supply a minimal one if this checkout lacks it.
if (!(await exists(path.join(output, 'manifest.json')))) {
  await fs.writeFile(path.join(output, 'manifest.json'), JSON.stringify({
    name: 'Võ Lâm Idle', short_name: 'Võ Lâm Idle', start_url: '/', display: 'standalone',
    background_color: '#0e1412', theme_color: '#0e1412', icons: []
  }, null, 2) + '\n');
}

console.log(`Đã tạo dist-cf từ ${copied} nhóm file/thư mục nguồn.`);
console.log('Không đưa server.js, package.json, wrangler.jsonc, thư mục .git hoặc test scripts vào assets công khai.');
