# Multiplayer Cloudflare Worker + Durable Objects (tiếng Việt)

Bản này bổ sung phòng multiplayer, presence, vị trí nhân vật realtime, chat phòng và lưu sự kiện/chat vào Supabase. Mã nguồn nằm ở:
- `worker/src/index.js`: API phòng + Durable Object `WorldRoom`
- `wrangler.jsonc`: binding và migration Durable Objects
- `public/multiplayer.js`: bảng Multiplayer trong game
- `public/index.html`: nạp client multiplayer

## 1. Chuẩn bị Supabase

1. Mở đúng Supabase project đang được trang game dùng.
2. Chạy file `volamidle_multiplayer_schema.sql` trong SQL Editor. Nếu chưa có file trong repo, lấy file SQL đã tạo ở cuộc trò chuyện trước.
3. Vào Project Settings → API để lấy Project URL, anon/public key và service_role key.
4. Không bao giờ đưa service_role key vào `public/`, HTML, JavaScript phía trình duyệt, hoặc commit lên Git.

## 2. Cấu hình secrets cho Cloudflare

Từ thư mục có `wrangler.jsonc`, chạy:

```bash
npx wrangler secret put SUPABASE_URL
npx wrangler secret put SUPABASE_ANON_KEY
npx wrangler secret put SUPABASE_SERVICE_ROLE_KEY
```

Nhập lần lượt Project URL, anon/public key, service_role key khi CLI hỏi. Hai key không bí mật cũng có thể cấu hình bằng `wrangler secret`; service_role bắt buộc giữ ở server. Không cần lưu các giá trị này trong file JS.

## 3. Deploy

```bash
npx wrangler deploy
```

Lần deploy đầu sẽ áp dụng migration khai báo class Durable Object `WorldRoom`. Kiểm tra:
- `GET /api/health` phải trả `ok: true`, `durableObjects: true`, `supabaseConfigured: true`.
- Mở game, đăng nhập, nhấn nút **🌐 Multiplayer**, tạo phòng hoặc chọn phòng.
- Mở một trình duyệt/thiết bị khác bằng tài khoản khác, vào cùng phòng. Người chơi khác sẽ xuất hiện dưới dạng avatar overlay trong khu vực chiến đấu.
- WASD/phím mũi tên cập nhật vị trí realtime; chat được lưu trong `chat_messages`.

## API

- `GET /api/rooms` — danh sách phòng công khai.
- `POST /api/rooms` — tạo phòng; JSON: `{"name":"Phòng 1","max_players":50}`.
- `POST /api/rooms/:id/join` — tham gia phòng.
- `WS /api/ws/rooms/:id` — WebSocket; gói đầu tiên: `{"type":"auth","access_token":"SUPABASE_ACCESS_TOKEN"}`; sau đó hỗ trợ `move`, `chat`, `ping`.

## Lưu ý quan trọng

- Cần đăng nhập Supabase trên game và token phải có mặt trong localStorage để client tìm thấy.
- Client hiện vẽ avatar multiplayer dạng overlay độc lập trên khu vực chiến đấu. Để đồng bộ chính xác với sprite/camera/tọa độ nội bộ của engine hiện tại, cần nối sự kiện `move` với hệ thống render và tọa độ thật của game.
- Trước khi mở public, cần thêm kiểm thử tải, giới hạn chat, cơ chế reconnect, chống spam và xác nhận schema trên staging.
- SQL dùng `public.player_profiles`, `game_rooms`, `room_members`, `game_events`, `chat_messages`. Nếu database chưa chạy schema này, API sẽ trả lỗi Supabase.
