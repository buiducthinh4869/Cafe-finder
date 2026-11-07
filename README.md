# Hôm nay ngồi đâu?

Web gợi ý quán cafe để làm việc cho hai người: một người ở Hồ Tây, một người ở Chùa Láng.

- **Bốn chế độ:** gần Hồ Tây, gần Chùa Láng, quanh đây (vị trí hiện tại, gõ địa điểm có gợi ý, hoặc dán link Google Maps), xa hẳn (10–45 km đường đi, xuất phát từ một trong hai điểm).
- **Xếp hạng:** mức phù hợp để làm việc, điểm Google, đặc điểm quán (rộng, vắng, bàn rộng được cộng; đông, chật, ồn bị trừ) và khoảng cách.
- **Feedback:** chấm sao, chọn điểm cộng/điểm trừ, ghi chú, ẩn quán. Feedback chỉnh trọng số đặc điểm và điểm từng quán.
- **Gợi ý quán mới:** gửi tên quán, Claude kiểm tra và bổ sung vào `data/cafes.json`.

## Dữ liệu

- `data/cafes.json`: 114 quán trên toàn Hà Nội và Ecopark. 39 quán Claude đọc review kỹ, 58 quán lọc tự động theo review (07/11/2026), 17 quán từ sheet *Danh sách quán cafe đôi ta từng đi* kèm điểm hai bạn đã chấm.
- Feedback lưu ở Google Sheet *Cafe finder - Feedback* qua Apps Script. Khi chưa kết nối, feedback lưu trong trình duyệt.

## Kết nối Google Sheet (làm một lần)

1. Mở Google Sheet **Cafe finder - Feedback** trong Drive.
2. Vào **Tiện ích mở rộng → Apps Script**. Xóa code mẫu, dán toàn bộ `apps-script/Code.gs`, bấm Lưu.
3. Bấm **Triển khai → Tùy chọn triển khai mới**. Chọn loại **Ứng dụng web**. Thực thi với tư cách: **Tôi**. Người có quyền truy cập: **Bất kỳ ai**. Bấm Triển khai và cấp quyền.
4. Copy **URL ứng dụng web** (kết thúc bằng `/exec`) và gửi cho Claude, hoặc dán vào `config.js` ở dòng `SCRIPT_URL`.

## Cập nhật đề xuất

Bảo Claude đọc sheet feedback. Claude sẽ chỉnh trọng số mặc định trong `app.js`, cập nhật đặc điểm từng quán và thêm quán được gợi ý.

## Khi cập nhật code

Đổi giá trị `?v=` của `style.css`, `config.js`, `app.js` trong `index.html` mỗi lần sửa các file này, để trình duyệt không dùng bản cũ trong bộ nhớ đệm.

Giờ mở cửa trong `data/cafes.json` ghi theo dạng 24 giờ, ví dụ `7:00–22:00` hoặc `Mở 24h`. Không dùng am/pm.
