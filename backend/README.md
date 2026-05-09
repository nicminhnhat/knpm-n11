# Backend hoàn thiện cho đồ án KNPM N11

Backend này được hoàn thiện theo tài liệu đồ án **Hệ thống hỗ trợ tìm kiếm phòng trọ cho sinh viên tại Huế** và dựa trên backend Prisma/JWT đã có trong file dự án cũ.

## Công nghệ

- Node.js + Express
- PostgreSQL
- Prisma ORM
- JWT authentication
- bcrypt mã hóa mật khẩu

## Chạy backend

```bash
cd backend
npm install
copy .env.example .env
```

Mở file `.env` và sửa `DATABASE_URL` theo database PostgreSQL của bạn.

Sau đó chạy:

```bash
npm run prisma:generate
npm run prisma:push
npm run seed
npm run dev
```

Backend chạy ở:

```text
http://localhost:3001
```

Kiểm tra API:

```text
GET http://localhost:3001/api/health
GET http://localhost:3001/api/health/db
```

## Tài khoản seed

Mật khẩu mặc định nếu không đổi trong `.env`:

```text
123456
```

Admin mặc định:

```text
admin@knpm.local
```

Sinh viên demo:

```text
student@knpm.local
```

Chủ trọ demo:

```text
landlord@knpm.local
```

## Các nhóm API chính

### Auth

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `POST /api/auth/logout`
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`

### Cá nhân

- `GET /api/profile`
- `PUT /api/profile`
- `PUT /api/profile/change-password`

### Phòng trọ công khai

- `GET /api/rooms`
- `GET /api/rooms/:id`
- `GET /api/posts`
- `GET /api/posts/:id`

### Chủ trọ

- `GET /api/landlord/rooms`
- `POST /api/landlord/rooms`
- `PUT /api/landlord/rooms/:id`
- `PATCH /api/landlord/rooms/:id/status`
- `DELETE /api/landlord/rooms/:id`
- `GET /api/landlord/posts`
- `POST /api/landlord/posts`
- `PUT /api/landlord/posts/:id`
- `PATCH /api/landlord/posts/:id/hide`
- `DELETE /api/landlord/posts/:id`
- `POST /api/verification/requests`

### Sinh viên

- `POST /api/favorites/:roomId`
- `GET /api/favorites`
- `DELETE /api/favorites/:roomId`
- `POST /api/reports`
- `GET /api/my/reports`
- `POST /api/rooms/:roomId/reviews`

### Nhắn tin

- `GET /api/messages/threads`
- `POST /api/messages/threads`
- `GET /api/messages/threads/:id/messages`
- `POST /api/messages/threads/:id/messages`

### Admin

- `GET /api/admin/dashboard`
- `GET /api/admin/users`
- `GET /api/admin/users/:id`
- `PATCH /api/admin/users/:id/lock`
- `PATCH /api/admin/users/:id/unlock`
- `GET /api/admin/posts`
- `PATCH /api/admin/posts/:id/moderate`
- `GET /api/admin/verifications`
- `PATCH /api/admin/verifications/:id`
- `GET /api/admin/reports`
- `PATCH /api/admin/reports/:id/resolve`

## Lưu ý khi nối frontend

Frontend React hiện tại đang gọi:

```text
http://localhost:3001/api/auth/login
http://localhost:3001/api/auth/register
http://localhost:3001/api/auth/me
```

Nên chỉ cần chạy backend ở port `3001` là phần login/register có thể nối được.


## Workflow deploy Render + Neon

Khi deploy theo workflow nhóm:

```text
Frontend GitHub Pages -> Backend Render -> Database Neon
```

Backend không dùng database local nữa mà dùng biến môi trường `DATABASE_URL` trên Render. Chuỗi kết nối Neon không đặt trong code.

Trên Render cấu hình:

```text
Root Directory: backend
Build Command: npm install && npm run prisma:generate && npm run prisma:push
Start Command: npm start
```

Environment variables cần có:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST/DB_NAME?sslmode=require"
NODE_ENV="production"
FRONTEND_URL="https://TEN_GITHUB.github.io/TEN_REPO"
JWT_SECRET="chuoi-bi-mat-dai-va-kho-doan"
JWT_EXPIRES_IN="7d"
ADMIN_EMAIL="admin@knpm.local"
ADMIN_PASSWORD="Admin123456"
ADMIN_NAME="Quan tri vien"
SEED_PASSWORD="123456"
```

Kiểm tra sau deploy:

```text
/api/health
/api/health/db
```

Nếu muốn chạy local nhưng dùng Neon, chỉ cần dán Neon connection string vào file `.env`, sau đó chạy lại `npm run prisma:push`.
