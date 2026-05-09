# KNPM-N11

Ung dung web tim va dang phong tro sinh vien, gom:

- `frontend/`: React + Vite + Tailwind CSS 4
- `backend/`: Express + Prisma + PostgreSQL + JWT auth
- `templates/`: bo HTML/CSS mau ban dau dung lam tham chieu UI

Hien tai project da co:

- giao dien frontend nhieu trang voi React Router
- dang ky / dang nhap bang `email + password`
- luu phien dang nhap bang `JWT + localStorage`
- phan vai tro `STUDENT`, `LANDLORD`, `ADMIN`
- Prisma ket noi PostgreSQL

## 1. Yeu cau moi truong

Can cai san:

- `Node.js` 20+ hoac 22+
- `npm` 10+
- `PostgreSQL` 14+ hoac moi hon

Kiem tra nhanh:

```bash
node -v
npm -v
psql --version
```

## 2. Cau truc thu muc

```text
KNPM-N11/
|-- backend/     # API Express + Prisma + auth
|-- frontend/    # UI React/Vite
|-- templates/   # giao dien HTML mau ban dau
|-- package.json # script chay dong thoi frontend/backend
`-- README.md
```

## 3. Cai dependencies

O root:

```bash
npm install
```

Trong `backend/`:

```bash
cd backend
npm install
```

Trong `frontend/`:

```bash
cd frontend
npm install
```

Neu clone project sang may moi, nen chay lai `npm install` o cac thu muc can thiet.

## 4. Cai va tao database PostgreSQL

### Cach 1: dung `psql`

Dang nhap PostgreSQL:

```bash
psql -U postgres
```

Tao database:

```sql
CREATE DATABASE knpm_n11;
```

Thoat:

```sql
\q
```

### Cach 2: dung pgAdmin

- mo pgAdmin
- tao database moi ten `knpm_n11`
- ghi nho:
  - host
  - port
  - username
  - password

## 5. Cau hinh bien moi truong

### Backend

Copy file mau:

```bash
cd backend
copy .env.example .env
```

Neu dung macOS/Linux:

```bash
cp .env.example .env
```

Sua file `backend/.env`:

```env
DATABASE_URL="postgresql://postgres:123456@localhost:5432/knpm_n11"
JWT_SECRET="your-secret-key"
JWT_EXPIRES_IN="7d"
ADMIN_EMAIL="admin@example.com"
ADMIN_PASSWORD="Admin123456"
ADMIN_NAME="System Admin"
```

Giai thich:

- `DATABASE_URL`: chuoi ket noi PostgreSQL
- `JWT_SECRET`: khoa ky token JWT, nen doi sang chuoi rieng cua ban
- `JWT_EXPIRES_IN`: thoi gian song cua token
- `ADMIN_*`: tai khoan admin seed ban dau

### Frontend

Copy file mau:

```bash
cd frontend
copy .env.example .env
```

Neu dung macOS/Linux:

```bash
cp .env.example .env
```

Sua file `frontend/.env`:

```env
VITE_API_URL="http://localhost:3001"
```

Neu backend chay cong khac thi doi lai bien nay.

## 6. Khoi tao Prisma va seed admin

Tu thu muc `backend/`:

### 6.1 Generate Prisma Client

```bash
npm run prisma:generate
```

### 6.2 Dong bo schema xuong database

```bash
npm run prisma:push
```

Lenh nay se tao bang `User` va enum role trong database theo schema hien tai.

### 6.3 Tao tai khoan admin mac dinh

```bash
npm run seed:admin
```

Tai khoan admin duoc lay tu cac bien:

- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`
- `ADMIN_NAME`

## 7. Chay project tu dau

### Cach nhanh nhat: chay ca frontend va backend cung luc

Tu root:

```bash
npm run dev
```

Script nay se chay:

- backend dev server
- frontend Vite dev server

### Chay rieng tung phan

Backend:

```bash
cd backend
npm run dev
```

Frontend:

```bash
cd frontend
npm run dev
```

## 8. URL mac dinh

Sau khi chay thanh cong:

- frontend: `http://localhost:5173`
- backend: `http://localhost:3001`

## 9. Auth hien tai

### Dang ky

API:

```http
POST /api/auth/register
```

Body:

```json
{
  "fullName": "Nguyen Van A",
  "email": "a@example.com",
  "password": "123456",
  "role": "STUDENT"
}
```

Role cho public register chi duoc phep:

- `STUDENT`
- `LANDLORD`

### Dang nhap

API:

```http
POST /api/auth/login
```

Body:

```json
{
  "email": "a@example.com",
  "password": "123456"
}
```

### Lay thong tin user dang dang nhap

API:

```http
GET /api/auth/me
Authorization: Bearer <token>
```

### Tai khoan admin

Admin khong dang ky tu frontend cong khai.

Admin duoc tao bang:

- `npm run seed:admin`
- hoac tao tay trong DB neu can

## 10. Mot so API co san

- `GET /api/health`: kiem tra backend song
- `GET /api/health/db`: kiem tra ket noi database
- `POST /api/auth/register`: dang ky
- `POST /api/auth/login`: dang nhap
- `GET /api/auth/me`: lay user hien tai
- `GET /api/admin/ping`: test quyen admin
- `GET /api/users/demo`: demo endpoint
- `POST /api/echo`: echo request body

## 11. Kiem tra nhanh sau khi setup

### Kiem tra backend

Mo trinh duyet:

```text
http://localhost:3001/api/health
```

Ket qua mong doi:

```json
{
  "success": true
}
```

### Kiem tra database

```text
http://localhost:3001/api/health/db
```

### Kiem tra frontend

Mo:

```text
http://localhost:5173
```

Thu:

- vao `/register`
- tao tai khoan moi
- dang nhap
- reload trang de kiem tra session con duoc giu

## 12. Build production

Frontend:

```bash
cd frontend
npm run build
```

Backend hien dang chay dang Node server don gian:

```bash
cd backend
npm start
```

## 13. Loi thuong gap

### Khong ket noi duoc database

Kiem tra:

- PostgreSQL da chay chua
- `DATABASE_URL` dung chua
- database `knpm_n11` da tao chua
- da chay `npm run prisma:push` chua

### Frontend goi sai API

Kiem tra:

- backend co dang chay khong
- `frontend/.env` co dung `VITE_API_URL` khong

Sau khi sua `.env`, hay restart Vite dev server.

### Seed admin khong chay

Kiem tra:

- bang `User` da duoc tao chua
- da chay `npm run prisma:push` chua
- `ADMIN_EMAIL` va `ADMIN_PASSWORD` co trong `backend/.env` chua

## 14. Goi y phat trien tiep

- them CRUD phong tro bang Prisma
- them phan quyen route cho `LANDLORD` va `ADMIN`
- them refresh token hoac cookie auth neu muon nang cap bao mat
- them quen mat khau / xac minh email
- them dashboard quan ly bai dang
