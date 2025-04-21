# Hệ thống Quản lý Nghỉ phép

Hệ thống quản lý nghỉ phép được xây dựng bằng Next.js, TypeScript, TailwindCSS và Prisma.

## Tính năng

- Xác thực người dùng (đăng nhập, đăng xuất)
- Phân quyền người dùng (Admin, User)
- Quản lý yêu cầu nghỉ phép
- Xem lịch nghỉ phép
- Thống kê nghỉ phép
- Quản lý người dùng (Admin)

## Cài đặt

1. Clone dự án:
```bash
git clone https://github.com/your-username/leave-of-absence.git
cd leave-of-absence
```

2. Cài đặt dependencies:
```bash
npm install
```

3. Tạo file `.env` từ `.env.example`:
```bash
cp .env.example .env
```

4. Cập nhật các biến môi trường trong file `.env`

5. Tạo cơ sở dữ liệu:
```bash
npx prisma db push
```

6. Chạy dự án:
```bash
npm run dev
```

## Cấu trúc dự án

```
leave-of-absence/
├── app/
│   ├── (admin)/
│   │   └── admin/
│   │       └── users/
│   │           └── new/
│   │               └── page.tsx
│   ├── (auth)/
│   │   └── login/
│   │       └── page.tsx
│   ├── (dashboard)/
│   │   └── dashboard/
│   │       └── page.tsx
│   └── api/
│       ├── auth/
│       │   ├── [...nextauth]/
│       │   │   └── route.ts
│       │   ├── change-password/
│       │   │   └── route.ts
│       │   ├── forgot-password/
│       │   │   └── route.ts
│       │   ├── register/
│       │   │   └── route.ts
│       │   └── signout/
│       │       └── route.ts
│       ├── leaves/
│       │   ├── [id]/
│       │   │   ├── route.ts
│       │   │   └── status/
│       │   │       └── route.ts
│       │   ├── all/
│       │   │   └── route.ts
│       │   ├── route.ts
│       │   ├── stats/
│       │   │   └── route.ts
│       │   └── week/
│       │       └── route.ts
│       ├── me/
│       │   └── route.ts
│       └── users/
│           ├── [id]/
│           │   └── route.ts
│           └── route.ts
├── components/
│   └── ui/
│       ├── button.tsx
│       ├── form.tsx
│       ├── input.tsx
│       ├── label.tsx
│       ├── select.tsx
│       ├── toast.tsx
│       ├── toaster.tsx
│       └── use-toast.ts
├── lib/
│   ├── auth.ts
│   ├── date.ts
│   ├── prisma.ts
│   ├── string.ts
│   └── utils.ts
├── prisma/
│   └── schema.prisma
├── types/
│   └── next-auth.d.ts
├── .env
├── .env.example
├── .gitignore
├── middleware.ts
├── package.json
└── README.md
```

## Công nghệ sử dụng

- [Next.js](https://nextjs.org/)
- [TypeScript](https://www.typescriptlang.org/)
- [TailwindCSS](https://tailwindcss.com/)
- [Prisma](https://www.prisma.io/)
- [NextAuth.js](https://next-auth.js.org/)
- [shadcn/ui](https://ui.shadcn.com/)
- [PostgreSQL](https://www.postgresql.org/)

## Tác giả

- [Your Name](https://github.com/your-username)

## Giấy phép

MIT
