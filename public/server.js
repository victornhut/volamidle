const http = require("http");
const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");

<<<<<<< Updated upstream
const DEFAULT_PORT = 8080;
const ROOT_DIR = __dirname;

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".mp3": "audio/mpeg",
  ".wav": "audio/wav",
  ".ogg": "audio/ogg",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".otf": "font/otf"
};

function createServer(port) {
  const server = http.createServer((req, res) => {
    // Decode URI path and strip query params
    const parsedUrl = new URL(req.url, `http://${req.headers.host || "localhost"}`);
    let reqPath = decodeURIComponent(parsedUrl.pathname);

    if (reqPath === "/" || reqPath === "") {
      reqPath = "/index.html";
    }

    // Prevent directory traversal
    const safePath = path.normalize(reqPath).replace(/^(\.\.[\/\\])+/, "");
    const filePath = path.join(ROOT_DIR, safePath);

    fs.stat(filePath, (err, stats) => {
      if (err || !stats.isFile()) {
        res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
        res.end("404 Not Found: " + reqPath);
        return;
      }

      const ext = path.extname(filePath).toLowerCase();
      const mime = MIME_TYPES[ext] || "application/octet-stream";

      // Support Range requests for audio
      const range = req.headers.range;
      if (range && (ext === ".mp3" || ext === ".wav" || ext === ".ogg")) {
        const parts = range.replace(/bytes=/, "").split("-");
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : stats.size - 1;
        const chunksize = end - start + 1;

        res.writeHead(206, {
          "Content-Range": `bytes ${start}-${end}/${stats.size}`,
          "Accept-Ranges": "bytes",
          "Content-Length": chunksize,
          "Content-Type": mime,
          "Cache-Control": "no-cache"
        });

        fs.createReadStream(filePath, { start, end }).pipe(res);
        return;
      }

      res.writeHead(200, {
        "Content-Length": stats.size,
        "Content-Type": mime,
        "Cache-Control": "no-cache"
      });

      fs.createReadStream(filePath).pipe(res);
    });
  });

  server.on("error", (err) => {
    if (err.code === "EADDRINUSE") {
      console.log(`⚠️  Cổng ${port} đang bận, tự động thử cổng ${port + 1}...`);
      createServer(port + 1);
    } else {
      console.error("Lỗi máy chủ:", err);
    }
  });

  server.listen(port, () => {
    const url = `http://localhost:${port}`;
    console.log("=======================================================");
    console.log("🚀 MÁY CHỦ VÕ LÂM IDLE ĐÃ KHỞI ĐỘNG THÀNH CÔNG!");
    console.log(`🌐 Đường dẫn truy cập: \x1b[36m${url}\x1b[0m`);
    console.log("📂 Thư mục gốc: " + ROOT_DIR);
    console.log("💡 Nhấn \x1b[33mCtrl + C\x1b[0m để dừng máy chủ");
    console.log("=======================================================");

    // Tự động mở trình duyệt mặc định trên macOS
    exec(`open "${url}"`, (openErr) => {
      if (openErr) {
        console.log(`Vui lòng mở trình duyệt và truy cập: ${url}`);
      }
    });
  });
}

createServer(DEFAULT_PORT);
=======
const ROOT_DIR = __dirname;
const DEFAULT_PORT = Number(process.env.PORT || 8080);
const HOST = process.env.HOST || "127.0.0.1";
const MIME_TYPES = {
  ".html":"text/html; charset=utf-8", ".htm":"text/html; charset=utf-8",
  ".css":"text/css; charset=utf-8", ".js":"application/javascript; charset=utf-8",
  ".json":"application/json; charset=utf-8", ".webmanifest":"application/manifest+json; charset=utf-8",
  ".png":"image/png", ".jpg":"image/jpeg", ".jpeg":"image/jpeg", ".webp":"image/webp",
  ".avif":"image/avif", ".gif":"image/gif", ".svg":"image/svg+xml", ".ico":"image/x-icon",
  ".mp3":"audio/mpeg", ".wav":"audio/wav", ".ogg":"audio/ogg", ".m4a":"audio/mp4",
  ".woff":"font/woff", ".woff2":"font/woff2", ".ttf":"font/ttf", ".otf":"font/otf",
  ".wasm":"application/wasm", ".txt":"text/plain; charset=utf-8"
};
function start(port) {
  const server = http.createServer((req, res) => {
    let pathname;
    try { pathname = decodeURIComponent(new URL(req.url, `http://${req.headers.host || "localhost"}`).pathname); }
    catch { res.writeHead(400); return res.end("Bad Request"); }
    if (pathname === "/") pathname = "/index.html";
    const target = path.resolve(ROOT_DIR, "." + pathname);
    if (target !== ROOT_DIR && !target.startsWith(ROOT_DIR + path.sep)) {
      res.writeHead(403, {"Content-Type":"text/plain; charset=utf-8"}); return res.end("403 Forbidden");
    }
    fs.stat(target, (err, stats) => {
      if (err || !stats.isFile()) {
        res.writeHead(404, {"Content-Type":"text/plain; charset=utf-8", "Cache-Control":"no-store"});
        return res.end("404 Not Found: " + pathname);
      }
      const ext = path.extname(target).toLowerCase();
      const headers = {
        "Content-Type": MIME_TYPES[ext] || "application/octet-stream",
        "X-Content-Type-Options": "nosniff",
        "Cache-Control": "no-cache"
      };
      const range = req.headers.range;
      if (range && /^bytes=\d*-\d*$/.test(range) && [".mp3",".wav",".ogg",".m4a"].includes(ext)) {
        const [startText,endText] = range.slice(6).split("-");
        const start = startText ? Number(startText) : 0;
        const end = endText ? Math.min(Number(endText), stats.size - 1) : stats.size - 1;
        if (start > end || start >= stats.size) {
          res.writeHead(416, {"Content-Range": `bytes */${stats.size}`}); return res.end();
        }
        res.writeHead(206, {...headers, "Accept-Ranges":"bytes", "Content-Range":`bytes ${start}-${end}/${stats.size}`, "Content-Length":end-start+1});
        fs.createReadStream(target, {start,end}).pipe(res);
        return;
      }
      res.writeHead(200, {...headers, "Content-Length":stats.size});
      if (req.method === "HEAD") return res.end();
      fs.createReadStream(target).pipe(res);
    });
  });
  server.on("error", err => {
    if (err.code === "EADDRINUSE") {
      console.log(`Cổng ${port} đang được sử dụng; thử cổng ${port + 1}...`);
      start(port + 1);
    } else {
      console.error("Không thể khởi động máy chủ:", err.message);
      process.exitCode = 1;
    }
  });
  server.listen(port, HOST, () => {
    console.log("==================================================");
    console.log(" VO LAM IDLE - LOCAL WEB SERVER");
    console.log(` URL: http://${HOST}:${port}`);
    console.log(` Thu muc: ${ROOT_DIR}`);
    console.log(" Dung server: Ctrl + C");
    console.log("==================================================");
    const url = `http://${HOST}:${port}`;
    const command = process.platform === "win32"
      ? `start "" "${url}"`
      : process.platform === "darwin" ? `open "${url}"` : `xdg-open "${url}"`;
    setTimeout(() => exec(command, () => {}), 700);
  });
}
start(DEFAULT_PORT);
>>>>>>> Stashed changes
