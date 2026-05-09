# Workflow deploy: Frontend GitHub → Backend Render → Database Neon

## 1. Sơ đồ hoạt động

```text
Người dùng mở website
        ↓
Frontend React/Vite trên GitHub Pages
        ↓ gọi API bằng fetch qua VITE_API_URL
Backend Express trên Render
        ↓ kết nối bằng Prisma qua DATABASE_URL
Database PostgreSQL trên Neon
```

Điểm quan trọng: frontend không được biết chuỗi kết nối database. Chuỗi Neon chỉ đặt trong Render dưới biến môi trường `DATABASE_URL`.

## 2. Tạo database trên Neon

1. Vào Neon và tạo project/database, ví dụ `knpm_n11`.
2. Copy connection string PostgreSQL.
3. Nên dùng URL có `sslmode=require`, ví dụ:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST/DB_NAME?sslmode=require"
```

## 3. Deploy backend lên Render

Cách thủ công trên Render:

1. Chọn **New Web Service**.
2. Connect GitHub repository của nhóm.
3. Cấu hình:

```text
Root Directory: backend
Build Command: npm install && npm run prisma:generate && npm run prisma:push
Start Command: npm start
```

4. Thêm Environment Variables:

```env
DATABASE_URL="connection string Neon"
NODE_ENV="production"
FRONTEND_URL="https://TEN_GITHUB.github.io/TEN_REPO"
JWT_SECRET="chuoi-bi-mat-dai-va-kho-doan"
JWT_EXPIRES_IN="7d"
ADMIN_EMAIL="admin@knpm.local"
ADMIN_PASSWORD="Admin123456"
ADMIN_NAME="Quan tri vien"
SEED_PASSWORD="123456"
```

5. Deploy xong kiểm tra:

```text
https://TEN_BACKEND_RENDER.onrender.com/api/health
https://TEN_BACKEND_RENDER.onrender.com/api/health/db
```

Nếu `/api/health/db` thành công thì Render đã kết nối được Neon.

## 4. Seed dữ liệu demo/admin trên Render

Sau khi deploy xong, vào Render Shell hoặc chạy local bằng Neon URL rồi chạy:

```bash
npm run seed
```

Hoặc nếu chỉ cần tạo admin:

```bash
npm run seed:admin
```

Không nên tự động seed mỗi lần deploy vì có thể sinh dữ liệu demo lặp lại.

## 5. Deploy frontend lên GitHub Pages

Frontend dùng biến:

```env
VITE_API_URL="https://TEN_BACKEND_RENDER.onrender.com"
```

Nếu repo deploy ở dạng `https://TEN_GITHUB.github.io/knpm-n11`, đặt thêm:

```env
VITE_BASE_PATH="/knpm-n11/"
```

File GitHub Actions đã được thêm tại:

```text
.github/workflows/deploy-frontend.yml
```

Trong GitHub repository, vào **Settings → Secrets and variables → Actions**, thêm:

```text
VITE_API_URL = https://TEN_BACKEND_RENDER.onrender.com
VITE_BASE_PATH = /knpm-n11/
```

Sau đó vào **Settings → Pages**, chọn deploy bằng **GitHub Actions**.

## 6. Chạy local nhưng dùng Neon thay cho PostgreSQL trong máy

Nếu máy chưa cài PostgreSQL và bị lỗi `P1001: Can't reach database server at localhost:5432`, bạn không cần cài PostgreSQL nữa. Chỉ cần sửa file `backend/.env`:

```env
DATABASE_URL="connection string Neon có sslmode=require"
FRONTEND_URL="http://localhost:5173"
```

Rồi chạy lại:

```bash
cd backend
npm install
npm run prisma:generate
npm run prisma:push
npm run seed
npm run dev
```

Frontend local vẫn chạy:

```bash
cd frontend
npm install
npm run dev
```

## 7. Ghi chú theo task nhóm

- Luồng đúng là `HTML/JS hoặc React → gọi API backend Render → backend truy cập DB Neon`.
- `DATABASE_URL` đặt trong Render nên các thành viên sẽ không thấy mật khẩu DB trong code.
- Tạo bảng có thể dùng `npm run prisma:push` hoặc chạy SQL trực tiếp trong Neon SQL Editor.
- Frontend chỉ gọi API, tuyệt đối không kết nối trực tiếp Neon.
