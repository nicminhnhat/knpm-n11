# KNPM N11 - Bản hoàn thiện local

Bản này đi theo hướng local trong README: Frontend React/Vite, Backend Express/Prisma/JWT, Database PostgreSQL local.

## Chức năng đã nối backend

### Người dùng chung
- Đăng ký, đăng nhập, đăng xuất bằng JWT + localStorage.
- Xem và cập nhật thông tin cá nhân.
- Đổi mật khẩu.
- Xem thông báo.

### Sinh viên
- Tìm kiếm/lọc phòng trọ từ database.
- Xem chi tiết phòng trọ.
- Lưu/bỏ lưu phòng yêu thích.
- Đánh giá phòng trọ.
- Báo cáo bài đăng vi phạm.
- Nhắn tin liên hệ chủ trọ.
- Xem báo cáo đã gửi.

### Chủ trọ
- Gửi hồ sơ xác minh tài khoản.
- Thêm phòng trọ.
- Cập nhật trạng thái phòng trọ.
- Xóa phòng trọ khi chưa cho thuê.
- Tạo bài đăng chờ admin duyệt.
- Ẩn/xóa bài đăng của bản thân.
- Nhắn tin phản hồi sinh viên.

### Admin
- Xem dashboard thống kê.
- Xem/quản lý tài khoản người dùng.
- Khóa/mở khóa tài khoản.
- Xem danh sách bài đăng.
- Duyệt/từ chối/ẩn bài đăng.
- Duyệt/từ chối hồ sơ xác minh chủ trọ.
- Xử lý/từ chối báo cáo vi phạm.

## Chạy lại từ đầu

### 1. Tạo database trong PostgreSQL

Trong pgAdmin tạo database:

```sql
CREATE DATABASE knpm_n11;
```

### 2. Kiểm tra file backend/.env

```env
DATABASE_URL="postgresql://postgres:123456@localhost:5432/knpm_n11"
PORT=3001
FRONTEND_URL="http://localhost:5173"
ADMIN_EMAIL="admin@example.com"
ADMIN_PASSWORD="Admin123456"
SEED_PASSWORD="123456"
```

Nếu mật khẩu PostgreSQL khác `123456`, hãy sửa trong `DATABASE_URL`.

### 3. Cài và khởi tạo backend

```bash
cd backend
npm.cmd install
npm.cmd run prisma:generate
npm.cmd run prisma:push
npm.cmd run seed
npm.cmd run dev
```

Backend chạy ở:

```text
http://localhost:3001
```

Kiểm tra:

```text
http://localhost:3001/api/health
http://localhost:3001/api/health/db
```

### 4. Chạy frontend

Mở terminal mới:

```bash
cd frontend
npm.cmd install
npm.cmd run dev
```

Frontend chạy ở:

```text
http://localhost:5173
```

## Tài khoản demo sau khi chạy `npm.cmd run seed`

```text
Admin: admin@example.com / Admin123456
Sinh viên: student@knpm.local / 123456
Chủ trọ: landlord@knpm.local / 123456
```

## Kiểm thử nhanh bằng script

Giữ backend đang chạy rồi mở terminal ở thư mục gốc project:

```bash
node scripts/smoke-test.js
```

Hoặc:

```bash
npm.cmd run test:smoke
```

## Các trang frontend quan trọng

```text
/                 Trang chủ
/rooms            Danh sách phòng lấy từ API
/rooms/:id        Chi tiết phòng
/register         Đăng ký
/login            Đăng nhập
/dashboard        Dashboard theo vai trò
/rent             Trang hướng dẫn chủ trọ
```


## Cập nhật sửa lỗi ẩn/hiện bài đăng

- Trong dashboard chủ trọ, bài đăng đang ở trạng thái `HIDDEN` sẽ hiện nút **Hiện lại** thay vì chỉ có nút **Ẩn**.
- Backend bổ sung API `PATCH /api/landlord/posts/:id/unhide`.
- Nếu bài đăng từng được admin duyệt, khi hiện lại sẽ về trạng thái `APPROVED`. Nếu chưa từng được duyệt, bài đăng sẽ về `PENDING` để admin duyệt lại.
