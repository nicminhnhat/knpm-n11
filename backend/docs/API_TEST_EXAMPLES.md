# Ví dụ test nhanh bằng Thunder Client / Postman

## Register sinh viên

POST `http://localhost:3001/api/auth/register`

```json
{
  "fullName": "Nguyen Van A",
  "email": "a@gmail.com",
  "password": "123456",
  "role": "STUDENT"
}
```

## Login

POST `http://localhost:3001/api/auth/login`

```json
{
  "email": "admin@knpm.local",
  "password": "123456"
}
```

Copy token trả về rồi thêm Header:

```text
Authorization: Bearer <token>
```

## Tìm kiếm phòng trọ

GET `http://localhost:3001/api/rooms?q=Huế&minPrice=1000000&maxPrice=2000000`

## Admin duyệt bài đăng

PATCH `http://localhost:3001/api/admin/posts/:id/moderate`

```json
{
  "action": "approve"
}
```

## Admin từ chối bài đăng

```json
{
  "action": "reject",
  "reason": "Thông tin chưa rõ ràng"
}
```
