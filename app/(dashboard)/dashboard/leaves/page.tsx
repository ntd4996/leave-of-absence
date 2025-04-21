"use client";

import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus } from "lucide-react";

export default function LeavesPage() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <div>Đang tải...</div>;
  }

  if (!session) {
    redirect("/auth/login");
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Quản lý nghỉ phép</h1>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Tạo đơn nghỉ phép
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Danh sách đơn nghỉ phép</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">
            Chưa có đơn nghỉ phép nào
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 