// Ví dụ cấu trúc khởi tạo kết nối game trong index.js
const WebSocket = require('ws');
const config = require('./config.js');

console.log("Khởi động Võ Lâm Idle Client/Bot...");

// Kết nối tới Server Game qua cổng WebSocket bảo mật (WSS)
const ws = new WebSocket(config.SERVER_URL);

ws.on('open', function open() {
    console.log('Đã kết nối thành công tới server Võ Lâm Idle!');
    // Gửi gói tin đăng nhập hoặc tải thông tin nhân vật
    ws.send(JSON.stringify({ type: 'LOGIN', username: config.username, password: config.password }));
});

ws.on('message', function message(data) {
    const packet = JSON.parse(data);
    // Xử lý gói tin nhận từ server (Ví dụ: quái chết, nhận exp, rơi đồ HKMP...)
    handleGamePacket(packet);
});

function handleGamePacket(packet) {
    switch(packet.type) {
        case 'PLAYER_INFO':
            console.log(`Nhân vật: ${packet.name} - Cấp: ${packet.level}`);
            break;
        case 'DROP_ITEM':
            console.log(`Nhặt được trang bị: ${packet.itemName}`);
            break;
        default:
            break;
    }
}
