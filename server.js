const http = require("http");
const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");

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
