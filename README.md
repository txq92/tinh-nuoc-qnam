# Tính tiền nước và điện sinh hoạt

Trang HTML/CSS/JavaScript tĩnh, không cần cài thư viện hay build. Mở `index.html` để sử dụng; giao diện hỗ trợ điện thoại và máy tính.

Menu **Tiền nước / Tiền điện** có trên cả hai trang. Trang nước ở `index.html`, trang điện ở `electricity.html`; dùng chung giao diện ưu tiên điện thoại, cách nhập trực tiếp hoặc nhập hai chỉ số và thông báo tính xong tự tắt sau 3 giây.

## Tiền điện

Cuối trang điện có phần chia cho 2 nhà tương tự tiền nước: chia đều định mức các bậc thấp, chênh lệch kWh mặc định 0; chênh lệch dương chia đôi, chênh lệch âm giảm theo tỷ lệ sử dụng trước khi phân bổ bậc. Nhập lượng điện thực tế của cả hai nhà; chương trình giữ nguyên hai số này và chỉ tự tính chênh lệch = tổng kWh − nhà 1 − nhà 2. Mỗi nhà hiển thị tiền trước thuế, VAT và tiền sau thuế. Phần làm tròn trước thuế và VAT được cân đối ở nhà 2 để tổng tiền hai nhà bằng đúng hóa đơn đồng hồ chung **sau VAT 8%**.

Tính lũy tiến theo bảng giá người dùng cung cấp. Đơn giá dưới đây chưa thuế; kết quả chính hiển thị **tổng tiền đã cộng thuế GTGT 8%**, kèm tiền trước thuế và tiền thuế.

| Bậc | Lượng điện | Đơn giá (đồng/kWh) |
| --- | --- | ---: |
| 1 | Đến 100 kWh | 1.901 |
| 2 | Trên 100 đến 200 kWh | 2.289 |
| 3 | Trên 200 đến 400 kWh | 2.894 |
| 4 | Trên 400 đến 700 kWh | 3.456 |
| 5 | Trên 700 kWh | 3.844 |

Ví dụ 250 kWh = 100 × 1.901 + 100 × 2.289 + 50 × 2.894 = **563.700 đ** trước thuế; thuế GTGT 8% = **45.096 đ**; tổng sau thuế = **608.796 đ**. Tiền trước thuế và tiền thuế làm tròn riêng đến đồng, tổng thanh toán bằng tổng hai khoản. Mức VAT 8% được đặt theo yêu cầu người dùng. Nguồn tham khảo: [EVNCPC](https://cskh.cpc.vn/tra-cuu/thong-tin-gia-dien). Chạy `node electricity.test.cjs` để kiểm tra các mốc chuyển bậc và VAT.

## Tiền nước

Cuối trang nước có phần chia tiền cho 2 nhà theo cách chia đều định mức giá thấp. Tổng m³ và tiền đồng hồ chung lấy từ máy tính phía trên. Nhập lượng nước thực tế của cả hai nhà, chương trình không tự sửa hai số này. Ô **Chênh lệch nước** mặc định 0, chỉ đọc và tự tính bằng tổng m³ trừ lượng nước hai nhà khi đủ dữ liệu. Nếu tổng hai nhà vượt đồng hồ chung thì vẫn chia tiền: lượng quy đổi của mỗi nhà = tổng đồng hồ chung × lượng thực tế nhà đó / tổng thực tế hai nhà. Giữ nguyên dữ liệu nhập. Luôn có **nhà 1 + nhà 2 + chênh lệch = tổng m³**. Chênh lệch dương được chia đôi cho hai nhà trước khi phân bổ bậc giá; chênh lệch âm được giảm theo tỷ lệ như trên. Lượng quy đổi hiển thị tối đa 4 số thập phân, phép tính tiền giữ nguyên độ chính xác của số thực. Mỗi bậc chia đều theo nhu cầu còn lại, định mức không dùng hết chuyển sang nhà kia. Tiền nhà 1 làm tròn đến đồng, tiền nhà 2 bằng tổng hóa đơn trừ tiền nhà 1 để luôn khớp tổng. Ví dụ tổng 100 m³, chênh lệch 0: nhà 1 dùng 20 m³ trả 245.775 đ, nhà 2 dùng 80 m³ trả 1.183.215 đ, cộng đúng 1.428.990 đ.

Có hai cách nhập: nhập trực tiếp **Số mét khối trong kỳ**, hoặc nhập **Số đầu** và **Số cuối** để tự điền số m³ bằng số cuối trừ số đầu. Tổng tiền và chi tiết từng bậc cập nhật ngay theo cách nhập vừa sửa. Có thể sửa số m³ bằng tay sau khi tự tính từ chỉ số. Số cuối phải lớn hơn hoặc bằng số đầu. Khi thiếu hoặc nhập sai dữ liệu ở cách nhập đang dùng, trang xóa kết quả cũ để tránh nhầm lẫn.

## Công thức

Tính lũy tiến, phần nước nằm ở bậc nào áp dụng đơn giá bậc đó:

| Bậc | Lượng nước | Đơn giá (đồng/m³) |
| --- | --- | ---: |
| 1 | 10 m³ đầu | 8.954 |
| 2 | Trên 10 đến 20 m³ | 11.177 |
| 3 | Trên 20 đến 30 m³ | 13.400 |
| 4 | Trên 30 m³ | 15.624 |

Không cộng thêm thuế hoặc phí. Hỗ trợ số thập phân bằng dấu phẩy hoặc dấu chấm; tổng tiền làm tròn đến đồng gần nhất (0,5 làm tròn lên). Chi tiết từng bậc hiển thị tối đa 2 chữ số thập phân.

## Kết quả kiểm thử

| Lượng nước | Phép tính (đồng) | Tổng tiền |
| --- | --- | ---: |
| 43 m³ | 10 × 8.954 + 10 × 11.177 + 10 × 13.400 + 13 × 15.624 | 538.422 đ |
| 47 m³ | 10 × 8.954 + 10 × 11.177 + 10 × 13.400 + 17 × 15.624 | 600.918 đ |
| 20 m³ | 10 × 8.954 + 10 × 11.177 | 201.310 đ |
| 11 m³ | 10 × 8.954 + 1 × 11.177 | 100.717 đ |

Chạy kiểm thử bằng Node.js:

```sh
node calculator.test.cjs
```

## Deploy bằng GitHub Pages

Workflow GitHub Actions tự chạy `node scripts/version-assets.cjs` trước khi build. Script thêm `?v=<hash nội dung>` vào đường dẫn JS/CSS trên cả hai trang: file thay đổi sẽ có URL mới để trình duyệt tải lại, file không đổi vẫn được cache. Khi chuẩn bị bản deploy thủ công, chạy lệnh này trước khi tải source lên. Không cần thư viện ngoài.

Người dùng cần tải lại trang để nhận HTML chứa đường dẫn phiên bản mới. Cơ chế này không tự cập nhật một tab đang mở và không ép xóa bản HTML còn trong cache của trình duyệt/CDN.

1. Tạo repository trên GitHub và tải các tệp của dự án lên nhánh `main`, giữ `index.html` ở thư mục gốc.
2. Vào **Settings → Pages** của repository.
3. Trong **Build and deployment**, chọn **Deploy from a branch**.
4. Chọn nhánh **main**, thư mục **/ (root)**, bấm **Save**.
5. Chờ GitHub triển khai, mở địa chỉ được hiển thị trong trang Pages, thường là `https://<username>.github.io/<repository>/`.

Các đường dẫn tài nguyên là tương đối, dùng được cả ở tên miền riêng và đường dẫn repository. Không cần backend, API key hay cấu hình build. Font Google là tùy chọn; nếu không tải được, trang sử dụng font hệ thống.
