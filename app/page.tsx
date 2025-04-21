import Link from "next/link"

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="mb-8 text-4xl font-bold">Hệ thống Quản lý Nghỉ phép</h1>
      <div className="flex gap-4">
        <Link
          href="/login"
          className="rounded-md bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90"
        >
          Đăng nhập
        </Link>
        <Link
          href="/register"
          className="rounded-md bg-secondary px-4 py-2 text-secondary-foreground hover:bg-secondary/80"
        >
          Đăng ký
        </Link>
      </div>
    </div>
  )
} 