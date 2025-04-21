"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { Loader2 } from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuth, setIsAuth] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        setIsLoading(true);
        const response = await fetch("/api/me");

        if (!response.ok) {
          throw new Error("Unauthorized");
        }

        const data = await response.json();
        if (data.isAuthenticated) {
          setIsAuth(true);
        } else {
          router.push("/login");
        }
      } catch (error) {
        console.error("Auth check failed:", error);
        router.push("/login");
      } finally {
        setIsLoading(false);
      }
    };

    // Chỉ kiểm tra khi đã authenticated và mới load trang
    if (status === "authenticated" && isLoading) {
      checkAuth();
    } else if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router, isLoading]);

  // Thiết lập kiểm tra định kỳ token sau mỗi lần chuyển trang
  useEffect(() => {
    if (status === "authenticated" && !isLoading) {
      const checkAuthInterval = setInterval(() => {
        fetch("/api/me")
          .then((response) => {
            if (!response.ok) {
              router.push("/login");
            }
          })
          .catch(() => {
            router.push("/login");
          });
      }, 5 * 60 * 1000); // Kiểm tra mỗi 5 phút

      return () => clearInterval(checkAuthInterval);
    }
  }, [status, router, isLoading, pathname]);

  if (status === "loading" || isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <div className="text-lg font-medium">Đang tải...</div>
        </div>
      </div>
    );
  }

  if (!isAuth && status === "authenticated") {
    return null;
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />

      <div className="flex flex-col flex-1 overflow-hidden">
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
