/* ====================================================================
 * CẤU HÌNH HỆ THỐNG MÁY CHỦ & ĐĂNG NHẬP (VÕ LÂM IDLE)
 * ====================================================================
 * 
 * 👉 CÁCH BẬT / TẮT ĐĂNG NHẬP:
 * - Tạm tắt đăng nhập (Chơi Offline / Lưu trữ cục bộ LocalStorage):
 *       window.AUTH_ENABLED = false;
 * 
 * - Mở lại đăng nhập (ID/Pass & Đồng bộ Cloud Save qua Supabase):
 *       window.AUTH_ENABLED = true;
 *       (đồng thời điền URL và Anon Key của Supabase vào CHAT_CFG bên dưới)
 */

// Đang TẠM TẮT đăng nhập ID/Pass theo yêu cầu. Đổi thành true khi cần mở lại:
window.AUTH_ENABLED = false;

window.CHAT_CFG = {
  url: "", // Điền URL Supabase tại đây khi mở lại (VD: "https://your-project.supabase.co")
  key: "", // Điền anon public key Supabase tại đây khi mở lại
};
