# Discord AI Bot — hướng dẫn tiếng Việt

Bot này chỉ bắt đầu trả lời khi được tag. Sau đó có thể tiếp tục hội thoại bằng cách **reply** vào tin nhắn bot.

## Có gì?
- Trò chuyện tiếng Việt bằng Gemini.
- Đọc ảnh đính kèm (PNG, JPG, WEBP, GIF; tối đa 8 MB).
- Hỗ trợ hỏi bài, viết văn, giải thích và sửa code.
- Tạo ảnh khi nhắn yêu cầu có cụm như `tạo ảnh ...`.
- Lưu ngữ cảnh tạm thời theo người dùng + kênh trong lúc bot đang chạy.

## 1. Chuẩn bị Discord
1. Mở Discord Developer Portal → chọn ứng dụng bot → **Bot**.
2. Trong **Privileged Gateway Intents**, bật **Message Content Intent**.
3. Đảm bảo bot đã được mời vào server với quyền View Channels, Send Messages, Read Message History, Attach Files.
4. Không gửi Discord Token cho bất kỳ ai.

## 2. Chuẩn bị API key
Dùng API key đã tạo trong Google AI Studio. Không đăng key vào kênh Discord, không dán key vào đoạn chat AI, và không đưa file `.env` lên GitHub.

## 3. Chạy project
Cần Node.js 20 trở lên.
1. Giải nén ZIP.
2. Đổi tên `.env.example` thành `.env`.
3. Điền `DISCORD_TOKEN` và `GEMINI_API_KEY` vào `.env`.
4. Mở Terminal trong thư mục project và chạy:
   ```bash
   npm install
   npm start
   ```

## 4. Cách dùng
- `@TênBot chào bạn` → bắt đầu trò chuyện.
- Gửi ảnh kèm `@TênBot ảnh này là gì?` → bot phân tích ảnh.
- `@TênBot tạo ảnh một chú mèo nằm trên mặt trăng` → bot tạo ảnh.
- Để nói tiếp không cần tag, hãy dùng **Reply/Trả lời** vào tin nhắn gần nhất của bot.

## 5. Lưu ý quan trọng
- Bot không chạy 24/7 chỉ vì đã tạo code. Cần triển khai lên một máy chủ/hosting luôn hoạt động.
- Lịch sử chat hiện được lưu trong RAM; khi bot khởi động lại thì lịch sử sẽ mất.
- Tạo ảnh và hỏi AI có thể bị giới hạn lượt hoặc tính phí tùy tài khoản, model và chính sách Google.
- Nếu bot không đọc được tin nhắn, kiểm tra Message Content Intent trong Developer Portal và quyền của bot.
- Không chia sẻ token/API key. Nếu lỡ lộ, hãy thu hồi và tạo key mới ngay.
