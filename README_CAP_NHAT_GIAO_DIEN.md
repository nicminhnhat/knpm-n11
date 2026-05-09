# Cập nhật giao diện và kiểm tra dữ liệu

Bản cập nhật này đã chỉnh các phần sau:

- Chuẩn hóa nội dung tiếng Việt có dấu trên giao diện.
- Lược bỏ các câu mô tả mang tính hướng dẫn kỹ thuật để giao diện chuyên nghiệp hơn.
- Thêm cửa sổ thông báo khi thao tác thành công, cảnh báo hoặc thất bại.
- Thêm cửa sổ xác nhận trước khi xóa phòng, xóa bài đăng hoặc tạo bài đăng.
- Kiểm tra dữ liệu bắt buộc trước khi thêm phòng trọ và tạo bài đăng.
- Bổ sung trường hình ảnh phòng trọ khi thêm phòng và khi tạo bài đăng.
- Backend đã nhận `imageUrl` khi tạo bài đăng và lưu ảnh vào bảng `RoomImage` của phòng được chọn.

## Chạy lại dự án

Backend:

```bash
cd backend
npm.cmd install
npm.cmd run prisma:generate
npm.cmd run dev
```

Frontend:

```bash
cd frontend
npm.cmd install
npm.cmd run dev
```

Nếu chưa có bảng hoặc dữ liệu mẫu:

```bash
cd backend
npm.cmd run prisma:push
npm.cmd run seed
```

## Lưu ý

Không cần chạy lại `seed` nếu bạn muốn giữ dữ liệu đã nhập trong quá trình test.
