"use client";

import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function SettingsPage() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <div>Đang tải...</div>;
  }

  if (!session) {
    redirect("/auth/login");
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Cài đặt</h1>

      <Card>
        <CardHeader>
          <CardTitle>Thông tin tài khoản</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium">Tên</label>
            <p className="text-sm text-muted-foreground">{session.user?.name}</p>
          </div>
          <div>
            <label className="text-sm font-medium">Email</label>
            <p className="text-sm text-muted-foreground">{session.user?.email}</p>
          </div>
          <Button variant="outline">Cập nhật thông tin</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Đổi mật khẩu</CardTitle>
        </CardHeader>
        <CardContent>
          <Button variant="outline">Đổi mật khẩu</Button>
        </CardContent>
      </Card>
    </div>
  );
} 