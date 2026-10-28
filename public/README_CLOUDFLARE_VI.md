# Bộ chuyển đổi deploy Cloudflare cho Võ Lâm Idle

Bộ này chuẩn bị cấu hình Worker cho source công khai https://github.com/victornhut/volamidle và tên Worker đích `volamidle-zip`.

> Đây là **bộ vá triển khai**, không chứa toàn bộ ảnh/âm thanh/dữ liệu lớn của repository gốc. Hãy áp dụng các file này vào bản checkout/giải nén của repository gốc trước khi build. Nó không tự đăng nhập hoặc triển khai vào tài khoản Cloudflare của bạn.

## Vì sao cần bộ chuyển đổi?

Source gốc là game web tĩnh được phục vụ bởi `server.js` dùng `http`, `fs`, `path` và `child_process`; cách đó không chạy trực tiếp như một Cloudflare Worker. Worker không chạy một HTTP server Node truyền thống. Bản vá thay việc phục vụ file bằng Workers Static Assets, và dùng `worker/src/index.js` làm entry point. Cấu hình cũ cũng tham chiếu entry point và thư mục assets/D1 cần được xác minh trong repository hiện tại; cấu hình mới bỏ các `database_id` cứng để tránh phụ thuộc database của tài khoản khác.

## 1. Chuẩn bị source

1. Tải ZIP repository từ https://github.com/victornhut/volamidle/archive/refs/heads/main.zip và giải nén.
2. Mở thư mục gốc vừa giải nén — nơi có `index.html`, `data.js`, `style.css`, `img/`, `fx/`.
3. Sao lưu `wrangler.jsonc` và `package.json` hiện có nếu cần.
4. Sao chép toàn bộ nội dung của bộ vá này vào thư mục gốc repository, cho phép ghi đè `wrangler.jsonc` và `package.json`; thêm thư mục `worker/` và `scripts/`.

## 2. Build và thử local

Cần Node.js 18 trở lên.

```bash
npm install
npm run check
npm run build:cf
npm run dev
```

Mở URL local do Wrangler hiển thị (thường là http://localhost:8787). Kiểm tra endpoint `http://localhost:8787/api/health`; kết quả đúng có `"ok":true`.

## 3. Deploy vào Worker `volamidle-zip`

CLI là cách trực tiếp và rõ ràng nhất để deploy đúng tên Worker:

```bash
npx wrangler login
npm run deploy
```

Lệnh này triển khai tới tài khoản Cloudflare đã đăng nhập và Worker có tên `volamidle-zip`. Kiểm tra kỹ tài khoản/Worker trong output trước khi xác nhận deploy production. Không cần tự tạo D1 cho bản static này.

## 4. Nếu deploy bằng Cloudflare Dashboard / Workers Builds

Nếu Worker `volamidle-zip` đã liên kết GitHub:

- Commit/push các file đã vá vào repository của bạn.
- Build command: `npm run build:cf`
- Deploy command: `npx wrangler deploy`
- Root directory: thư mục chứa `wrangler.jsonc`, `package.json`, `index.html` và các thư mục asset gốc.

Nếu dashboard đang trỏ tới một repository khác hoặc một subdirectory, phải đặt root directory đúng nơi chứa các file trên. Sau khi deploy, mở URL production của Worker và `/api/health`.

## Giới hạn cần biết

- Bộ này triển khai **frontend gốc** qua Static Assets; nó không biến game thành MMO server-side. Dữ liệu game hiện được quản lý bởi client/source gốc (thường là browser storage) và không tự đồng bộ giữa trình duyệt/tài khoản.
- `/api/health` chỉ là endpoint kiểm tra Worker. Những đường dẫn `/api/*` khác trả về `API_NOT_CONFIGURED`; chưa có hệ thống đăng nhập, lưu nhân vật trên cloud hay multiplayer backend.
- Nếu cần lưu tài khoản/game state trên Cloudflare, cần phát triển API và binding D1 hoặc Durable Objects riêng, đồng thời sửa frontend để gọi API đó.
- Kiểm tra license và quyền sử dụng tài nguyên của repository gốc trước khi phát hành công khai.

## File chính

- `wrangler.jsonc` — cấu hình Worker tên `volamidle-zip`, assets và entry point.
- `worker/src/index.js` — router Worker, health-check và phục vụ static assets.
- `scripts/prepare-cloudflare.mjs` — sao chép các file game cần thiết vào `dist-cf` nhưng không public `server.js`, file cấu hình hoặc test scripts.
- `package.json` — lệnh build/dev/deploy.
