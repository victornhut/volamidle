# Võ Lâm Idle — chạy local server trên Windows

Đây là gói được dựng từ nội dung trong `VOLAM-IDLE.zip` bạn cung cấp. Các tệp game, script, dữ liệu, hình ảnh, hiệu ứng và âm thanh được giữ lại; metadata `__MACOSX` được loại bỏ. File `server.js` được chỉnh để chạy thuận tiện trên Windows/macOS/Linux với Node.js, phục vụ đúng MIME type và hỗ trợ phát audio theo Range.

## Yêu cầu
- Windows 10/11 (có thể chạy trên macOS/Linux).
- Node.js LTS. Tải từ https://nodejs.org/ nếu máy chưa cài.
- Không cần MySQL, PHP hay cài package npm.

## Cách chạy nhanh trên Windows
1. Giải nén toàn bộ `VOLAM-IDLE-local.zip` vào một thư mục, ví dụ `C:\Games\VOLAM-IDLE`.
2. Cài Node.js LTS nếu chưa có.
3. Nhấp đúp `START-WINDOWS.bat`.
4. Trình duyệt sẽ mở `http://127.0.0.1:8080`. Nếu cổng 8080 bận, cửa sổ terminal sẽ báo cổng tiếp theo; hãy mở URL tương ứng, ví dụ `http://127.0.0.1:8081`.
5. Giữ cửa sổ terminal đang chạy trong lúc chơi. Nhấn `Ctrl+C` để tắt server.

## Chạy thủ công
Mở CMD/PowerShell tại thư mục này và chạy:

```bat
node server.js
```

Sau đó mở `http://127.0.0.1:8080`.

Có thể đổi cổng:
```bat
set PORT=9000
node server.js
```

## Lưu game
Tiến trình được lưu trong `localStorage` của trình duyệt. Hãy dùng cùng trình duyệt và cùng URL/cổng để tiếp tục save. Xóa dữ liệu trang web trong trình duyệt có thể làm mất save; dùng tính năng xuất/nhập save trong game nếu có.

## Ghi chú
- Đây là local server tĩnh: chỉ phục vụ các tệp game, không tự tạo backend tài khoản nhiều người chơi.
- Máy chủ mặc định chỉ lắng nghe `127.0.0.1`, nghĩa là chỉ máy tính này truy cập được. Không mở ra Internet công khai nếu chưa rà soát bảo mật.
- Nếu trang trống, nhấn `Ctrl+F5`; nếu thiếu tài nguyên, kiểm tra đường dẫn file và xem Console trong DevTools.
- Các tệp font có đuôi `.woff2.html` trong archive gốc có thể là trang HTML thay vì font thật; nếu trình duyệt báo lỗi font, game vẫn có thể dùng font dự phòng.
- Hãy đảm bảo bạn có quyền sử dụng và phân phối các tài nguyên hình ảnh, âm thanh, dữ liệu và mã nguồn có trong gói.
