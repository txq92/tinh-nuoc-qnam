# Tính tiền nước sinh hoạt

Trang HTML/CSS/JavaScript tĩnh, không cần cài thư viện hay build. Mở `index.html` để sử dụng; giao diện hỗ trợ điện thoại và máy tính.

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

1. Tạo repository trên GitHub và tải các tệp của dự án lên nhánh `main`, giữ `index.html` ở thư mục gốc.
2. Vào **Settings → Pages** của repository.
3. Trong **Build and deployment**, chọn **Deploy from a branch**.
4. Chọn nhánh **main**, thư mục **/ (root)**, bấm **Save**.
5. Chờ GitHub triển khai, mở địa chỉ được hiển thị trong trang Pages, thường là `https://<username>.github.io/<repository>/`.

Các đường dẫn tài nguyên là tương đối, dùng được cả ở tên miền riêng và đường dẫn repository. Không cần backend, API key hay cấu hình build. Font Google là tùy chọn; nếu không tải được, trang sử dụng font hệ thống.
