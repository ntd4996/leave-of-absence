"use client";

import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus } from "lucide-react";

export default function EmployeesPage() {
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
        <h1 className="text-3xl font-bold">Quản lý nhân viên</h1>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Thêm nhân viên
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Danh sách nhân viên</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">
            Chưa có nhân viên nào
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 