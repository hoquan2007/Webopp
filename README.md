# Forma

Forma là cửa hàng điện thoại demo bằng tiếng Việt. Danh mục gồm 30 model với 15 iPhone, 9 Samsung Galaxy và 6 Google Pixel. Mỗi model có ảnh theo màu, lựa chọn dung lượng và giá demo.

## Chạy trên máy

Cần Node.js 24 và trình biên dịch `g++` hỗ trợ C++17 trong `PATH`. Trên Windows có thể dùng GCC của MSYS2 UCRT64. Nếu `g++` nằm ở thư mục khác, đặt biến `CXX` thành đường dẫn đầy đủ đến trình biên dịch.

```sh
npm run dev
```

Mở [http://localhost:4173](http://localhost:4173). Lệnh trên biên dịch C++ rồi chạy cùng một bộ xử lý API dùng trên Vercel. Dùng `npm run build` nếu chỉ cần biên dịch.

| Dữ liệu để thử | Giá trị |
| --- | --- |
| Email | `demo@forma.vn` |
| Mật khẩu | `FormaDemo2026` |
| Mã ưu đãi | `FORMA5` để giảm 5% |
| Số điện thoại mẫu | `0901234567` |

Chọn màu và dung lượng, thêm vào giỏ, thử mã ưu đãi, đăng nhập rồi xác nhận bằng COD hoặc thanh toán online mô phỏng. Giao diện hiển thị mã đơn và kết quả thanh toán ngay sau khi xác nhận. Giỏ nháp nằm trong trình duyệt, phiên đăng nhập nằm trong cookie có chữ ký. Bản demo không lưu đơn vào cơ sở dữ liệu, giao hàng hay thu tiền.

## Cấu trúc

```text
public/          Sáu trang HTML, CSS, JavaScript và ảnh/video
api/store.js     HTTP, scrypt và cookie phiên
cpp/main.cpp     Nhận dữ liệu JSON rồi chuyển đến lớp nghiệp vụ
cpp/catalog.cpp        Tra cứu, lọc và sắp xếp danh mục
cpp/catalog_models.cpp Ảnh, cấu hình, màu và giá demo theo model
cpp/store.hpp    Khai báo các lớp và quan hệ giữa chúng
cpp/store.cpp    Kiểm tra giỏ, tính tiền, giao hàng, đặt đơn và thanh toán
scripts/         Lệnh biên dịch và máy chủ chạy thử
```

Trình duyệt gọi `/api/store`. Node.js chuyển JSON vào tiến trình C++ qua stdin rồi đọc mã HTTP và dữ liệu trả về từ stdout. Giá trong giỏ và tổng tiền lúc đặt đơn đều được tính lại trên máy chủ bằng số nguyên đồng Việt Nam.

## Đối chiếu bảy chương C++

| Chương | Áp dụng trong dự án |
| --- | --- |
| 1 · Giới thiệu | Kiểu dữ liệu, điều kiện, vòng lặp, `struct`, toán tử và I/O chuẩn trong `main.cpp` và `store.cpp`. |
| 2 · Hàm | Khai báo trong header, tham chiếu `const`, tham số mặc định, nạp chồng `Phone::option` và hàm mẫu `requireOption`. |
| 3 · Lớp và đối tượng | Đóng gói trong `Phone`, `Catalog`, `Cart`, `Money` và `Order`. Từ khóa `this` trong `operator+=` và hàm bạn `operator+`. |
| 4 · Nạp chồng toán tử | `+`, `+=`, `-`, `*`, `<` của `Money` dùng khi tính tạm tính, giảm giá và xếp theo giá. |
| 5 · Hàm dựng, hàm hủy và toán tử | Hàm dựng mặc định và có tham số của `Money`, danh sách khởi tạo, hàm dựng sao chép `Cart` và quản lý vòng đời với RAII. |
| 6 · Kế thừa | `IPhone` và `AndroidPhone` là các loại `Phone`. `Order` chứa `Cart` và `Delivery` theo quan hệ HAS-A. |
| 7 · Đa hình | Danh mục gọi `Phone::system()` qua con trỏ lớp cơ sở. Hai lớp thanh toán cài đặt `PaymentMethod::confirm()` theo cách riêng. Hai lớp cơ sở có hàm hủy ảo. |

## Triển khai trên Vercel

1. Đưa mã nguồn lên kho Git rồi import repo vào Vercel. Chọn **Other** và dùng thư mục gốc của repo.
2. Trong **Settings → Environment Variables**, thêm `FORMA_SESSION_SECRET` cho các môi trường cần đăng nhập. Tạo khóa riêng ít nhất 32 ký tự bằng lệnh sau.

   ```sh
   node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
   ```

3. Chọn **Deploy**. Vercel phục vụ frontend từ `public/`. Lệnh `vercel-build` biên dịch C++ trên Linux trước khi Vercel đóng gói file thực thi vào Function `api/store.js`.
4. Kiểm tra danh mục, đăng nhập và đặt đơn thử trên URL của deployment.

Để dùng tài khoản riêng, đặt đồng thời `FORMA_ACCOUNT_EMAIL` và `FORMA_ACCOUNT_PASSWORD` trong Vercel hoặc `.env.local` trên máy. Khi thiết lập cặp biến này, giao diện ẩn nút điền tài khoản demo.

Tài liệu gốc của nền tảng. [Build image có gcc-c++](https://vercel.com/docs/builds/build-image) · [Custom build step cho Node.js](https://vercel.com/docs/functions/runtimes/node-js/advanced-node-configuration) · [Đóng gói file vào Function](https://vercel.com/kb/guide/how-can-i-use-files-in-serverless-functions).

## Nguồn ảnh, video và thư viện

- Ảnh iPhone lấy từ Apple Store, bảng so sánh iPhone và Apple Newsroom. Video đầu trang do Apple cung cấp. [So sánh iPhone](https://www.apple.com/iphone/compare/) · [Apple Newsroom](https://www.apple.com/newsroom/2025/09/apple-unveils-iphone-17-pro-and-iphone-17-pro-max/)
- Ảnh Galaxy lấy từ trang sản phẩm và trang chọn cấu hình Samsung. [Galaxy S25](https://www.samsung.com/vn/smartphones/galaxy-s25/) · [Galaxy Z Fold7](https://www.samsung.com/vn/smartphones/galaxy-z-fold7/) · [Galaxy A56 5G](https://www.samsung.com/vn/smartphones/galaxy-a/galaxy-a56-5g-awesome-graphite-256gb-sm-a566bzktxxv/)
- Ảnh Pixel lấy từ trang sản phẩm và trang chọn cấu hình Google Store. Ảnh Pixel 9 Pro Trắng Sứ lấy từ video giới thiệu của Google. [Google Store](https://store.google.com/us/magazine/pixel-phone-comparison?hl=en-US) · [Google Pixel 9 Newsroom](https://blog.google/products-and-platforms/devices/pixel/google-pixel-9-pro-xl/)
- `cpp/vendor/json.hpp` chứa nlohmann/json 3.12.0 theo MIT. Font Manrope dùng giấy phép SIL OFL kèm trong `public/assets/`. [nlohmann/json](https://github.com/nlohmann/json/tree/v3.12.0) · [Manrope](https://github.com/google/fonts/tree/main/ofl/manrope)
