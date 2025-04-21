"use client";

import React from "react";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import { Loader2, Calendar } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const [isTokenChecked, setIsTokenChecked] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    const checkToken = async () => {
      try {
        const response = await fetch("/api/me");
        const data = await response.json();
        
        if (!data.isAuthenticated) {
          router.push("/login");
          return;
        }
        
        setIsTokenChecked(true);
      } catch (error) {
        console.error("Error checking token:", error);
        router.push("/login");
      }
    };

    checkToken();

    // Thiết lập interval để kiểm tra token mỗi 5 phút
    const interval = setInterval(checkToken, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [status, router]);

  if (status === "loading" || !isTokenChecked) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <div className="text-lg font-medium">Đang tải dữ liệu...</div>
        </div>
      </div>
    );
  }

  // Kiểm tra nếu người dùng có role là ADMIN
  const isAdmin = session?.user?.role === "ADMIN";

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto">
        {isAdmin && (
          <div className="flex flex-wrap gap-2 mb-6">
            <Link
              href="/dashboard/leaves/management"
              className={cn(
                "flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md hover:bg-accent/50 transition-colors",
                pathname === "/dashboard/leaves/management"
                  ? "bg-accent text-accent-foreground"
                  : "text-foreground/70"
              )}
            >
              <Calendar className="h-4 w-4" />
              Quản lý đơn nghỉ phép
            </Link>
          </div>
        )}
        {children}
      </main>
    </div>
  );
} 