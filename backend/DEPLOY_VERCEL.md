# Deploy backend len Vercel

## Cau hinh project

- Import repository vao Vercel
- Dat `Root Directory` = `backend`
- Framework Preset: `Other`

## Environment variables

Can it nhat:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST/DB_NAME?sslmode=require"
FRONTEND_URL="https://your-frontend-domain.com"
JWT_SECRET="mot-chuoi-bi-mat-dai"
JWT_EXPIRES_IN="7d"
NODE_ENV="production"
```

Neu can upload anh tren Vercel, tao Vercel Blob store va them:

```env
BLOB_READ_WRITE_TOKEN="..."
```

## Luu y quan trong

- Backend da duoc tach thanh `app.js` + `index.js` de chay duoc ca local va Vercel.
- Route upload anh tren Vercel khong dung filesystem local. Neu co `BLOB_READ_WRITE_TOKEN`, API se upload len Vercel Blob.
- Neu deploy tren Vercel ma khong cau hinh Blob, `POST /api/uploads` se tra `503`.
- Local dev van giu cach cu: anh upload vao `backend/uploads`.

## Kiem tra sau deploy

```text
GET /api/health
GET /api/health/db
```
