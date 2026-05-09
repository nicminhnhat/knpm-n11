# Chạy project theo hướng local PostgreSQL

Hướng này bỏ Neon/Render, dùng PostgreSQL cài trên máy.

## 1. Tạo database
Mở pgAdmin và tạo database tên:

```text
knpm_n11
```

Hoặc dùng psql:

```bash
psql -U postgres
CREATE DATABASE knpm_n11;
\q
```

## 2. Sửa backend/.env
Nếu mật khẩu PostgreSQL của bạn không phải `123456`, sửa dòng này:

```env
DATABASE_URL="postgresql://postgres:MAT_KHAU_CUA_BAN@localhost:5432/knpm_n11"
```

## 3. Chạy backend

```bash
cd backend
npm.cmd install
npm.cmd run prisma:generate
npm.cmd run prisma:push
npm.cmd run seed:admin
npm.cmd run dev
```

Backend chạy ở:

```text
http://localhost:3001
```

## 4. Chạy frontend
Mở terminal thứ hai:

```bash
cd frontend
npm.cmd install
npm.cmd run dev
```

Frontend chạy ở:

```text
http://localhost:5173
```

## 5. Kiểm tra

```text
http://localhost:3001/api/health
http://localhost:3001/api/health/db
```
