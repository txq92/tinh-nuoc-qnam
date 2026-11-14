# Kết nối Google Sheets

Bảng đích: [dien nuoc hang thang](https://docs.google.com/spreadsheets/d/1VO9q08GkoNdp68kOqoovL6dkpAXFpSQISW8iCxPB9Lo/edit).

Không cần chia sẻ bảng công khai. Khi lưu lần đầu, script tự tạo tab **Lich_su_dien_nuoc**, không sửa `Trang tính1`. Kết nối Google Drive trong Codex giúp đọc/sửa bảng trong cuộc trò chuyện; website GitHub Pages vẫn cần Web App bên dưới để lưu khi sử dụng trên điện thoại.

## Cài đặt một lần

1. Mở Google Sheet bằng tài khoản có quyền sửa, vào **Tiện ích mở rộng → Apps Script**.
2. Thay nội dung tệp `Code.gs` trong trình soạn thảo bằng toàn bộ nội dung tệp `google-apps-script/Code.gs` trong dự án này. Đây là bản đã gộp sẵn cách tính nước, điện, VAT và chia hai nhà.
3. Thêm tệp **HTML**, đặt tên **Bridge**, rồi dán nội dung `google-apps-script/Bridge.html`.
4. Vào **Project Settings → Script properties**, thêm:
   - `SAVE_ACCESS_CODE`: một mã ngẫu nhiên riêng, tối thiểu 16 ký tự. Không đưa mã vào source GitHub, Google Sheet hoặc chia sẻ công khai.
   - `ALLOWED_ORIGIN`: `https://nhatro.vnid.me` (tên miền website hiện tại). Nếu đổi tên miền, thay bằng origin mới, không có đường dẫn hoặc dấu `/` cuối. Đường dẫn GitHub Pages hiện chuyển hướng sang tên miền này.
5. Chọn **Deploy → New deployment → Web app**:
   - **Execute as:** tài khoản của bạn.
   - **Who has access:** **Anyone** để trang GitHub Pages kết nối được. Mọi lần ghi vẫn phải có mã lưu đúng; script không có chức năng đọc lịch sử công khai. Người được cấp mã có thể thêm dòng vào tab lịch sử, vì vậy chỉ cấp mã cho người được phép lưu.
   - Bấm **Deploy** và cấp quyền Google cho script. Quyền này cần để script ghi vào bảng dưới tài khoản của bạn.
6. Sao chép **Web app URL** kết thúc bằng `/exec`.
7. Mở trang điện hoặc nước → **Lưu kết quả → Kết nối Google Sheets**, nhập URL và mã lưu. URL được nhớ trên trình duyệt; mã lưu không được lưu vào bộ nhớ trình duyệt hoặc source. Nếu muốn người dùng không cần nhập URL, điền URL vào `sheets-config.js` rồi deploy lại website.
8. Tính một hóa đơn → chọn kỳ tính → **Lưu vào Google Sheets**. Chỉ khi Google xác nhận ghi thành công mới hiển thị **Đã lưu** và số dòng. Kiểm tra dòng mới trong tab **Lich_su_dien_nuoc**.

URL của Google Sheet không thay thế URL Web App; phải deploy Apps Script một lần mới có endpoint ghi dữ liệu.

## Nội dung lưu

Một dòng cho mỗi lần lưu: thời gian máy chủ, kỳ tính, điện/nước, cách nhập, chỉ số đầu/cuối (nếu dùng), tổng sử dụng, tiền trước thuế, VAT, tổng thanh toán. Nếu đã nhập hai nhà, thêm số thực tế, chênh lệch, lượng quy đổi, tiền trước thuế/VAT/tổng của từng nhà và chi tiết từng bậc.

Nếu chưa nhập cả hai nhà, có thể lưu hóa đơn chung. Nếu đã nhập một nhà nhưng nhà kia thiếu hoặc sai thì phải hoàn thành phần chia trước khi lưu. Chênh lệch âm vẫn lưu và tính theo tỷ lệ như trên website.

Script tính lại toàn bộ tiền từ dữ liệu đầu vào; không tin số tiền do trình duyệt gửi. Không đưa mã lưu vào dòng dữ liệu. Các lần thử lại sau khi mất kết nối sử dụng cùng mã bản ghi để tránh ghi trùng trong cùng phiên. Sau khi tải lại website, một lần lưu mới có thể tạo dòng mới.

Kết nối dùng iframe và `google.script.run`, nhận xác nhận từ Google; không dùng `fetch(..., {mode: 'no-cors'})` vì cách đó không xác nhận được việc ghi thành công. Hai phía kiểm tra origin và mã kết nối ngẫu nhiên cho mỗi lần lưu.

## Khi thay đổi công thức

Chạy:

```sh
node scripts/build-google-apps-script.cjs
```

Sau đó cập nhật `Code.gs` trong Apps Script và **Deploy → Manage deployments → Edit → New version → Deploy**. Giữ URL `/exec` của deployment hiện tại. Việc push GitHub chỉ cập nhật website, không tự cập nhật Apps Script.

Nếu lưu bị treo, kiểm tra URL phải là `/exec`, quyền truy cập Web App, origin, mã lưu và quyền sửa Google Sheet của tài khoản triển khai. Sau 45 giây chưa có xác nhận, trang cho phép thử lại, không khẳng định đã lưu.

Tài liệu: [Web Apps](https://developers.google.com/apps-script/guides/web), [giao tiếp client/server](https://developers.google.com/apps-script/guides/html/communication).
