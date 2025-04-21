"use client";

import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { CalendarCheck2, Loader2, Check, X, RefreshCcw } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { useToast } from "@/components/ui/use-toast";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Link from "next/link";

interface Leave {
  id: string;
  reason: string;
  startDate: string;
  endDate: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  userId: string;
  user?: {
    name: string;
    email: string;
  };
}

export default function ApprovalsPage() {
  const { data: session, status } = useSession();
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
  const { toast } = useToast();
  
  // Kiểm tra nếu không phải admin thì chuyển hướng
  useEffect(() => {
    if (status === "authenticated" && session?.user?.role !== "ADMIN") {
      redirect("/dashboard");
    }
  }, [status, session]);

  // Lấy danh sách đơn nghỉ phép cần phê duyệt
  const fetchPendingLeaves = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/leaves/pending");
      if (!response.ok) {
        throw new Error("Failed to fetch pending leaves");
      }
      const data = await response.json();
      setLeaves(data);
    } catch (error) {
      console.error("Error fetching pending leaves:", error);
      toast({
        title: "Lỗi",
        description: "Không thể tải danh sách đơn nghỉ phép cần phê duyệt",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (session?.user) {
      fetchPendingLeaves();
    }
  }, [session]);

  // Xử lý phê duyệt đơn nghỉ
  const handleApproveLeave = async (leaveId: string) => {
    await updateLeaveStatus(leaveId, "APPROVED");
  };

  // Xử lý từ chối đơn nghỉ
  const handleRejectLeave = async (leaveId: string) => {
    await updateLeaveStatus(leaveId, "REJECTED");
  };

  // Cập nhật trạng thái đơn nghỉ
  const updateLeaveStatus = async (leaveId: string, newStatus: "APPROVED" | "REJECTED") => {
    setActionInProgress(leaveId);
    try {
      const response = await fetch(`/api/leaves/${leaveId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Có lỗi xảy ra khi cập nhật đơn nghỉ");
      }

      // Cập nhật thành công
      toast({
        title: newStatus === "APPROVED" ? "Phê duyệt thành công" : "Từ chối thành công",
        description: newStatus === "APPROVED" 
          ? "Đơn nghỉ phép đã được phê duyệt" 
          : "Đơn nghỉ phép đã bị từ chối",
        variant: newStatus === "APPROVED" ? "default" : "destructive",
      });

      // Làm mới danh sách
      await fetchPendingLeaves();
    } catch (error) {
      console.error("Error updating leave status:", error);
      toast({
        title: "Lỗi cập nhật",
        description: error instanceof Error ? error.message : "Có lỗi xảy ra khi cập nhật đơn nghỉ",
        variant: "destructive",
      });
    } finally {
      setActionInProgress(null);
    }
  };

  // Loading state
  if (status === "loading" || (status === "authenticated" && isLoading)) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <div className="text-lg font-medium">Đang tải dữ liệu...</div>
        </div>
      </div>
    );
  }

  // Redirect if not authenticated
  if (status === "unauthenticated") {
    redirect("/login");
  }

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-500">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-primary/10 rounded-full shadow-sm">
            <CalendarCheck2 className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Quản lý đơn nghỉ phép</h1>
        </div>
        
        <Button 
          className="rounded-full shadow-sm transition-all hover:shadow-md hover:translate-y-[-1px] bg-slate-100 text-slate-800 hover:bg-slate-200"
          onClick={fetchPendingLeaves}
        >
          <RefreshCcw className="mr-2 h-4 w-4" />
          Làm mới
        </Button>
      </div>

      <Card className="rounded-xl overflow-hidden border-primary/10 shadow-md hover:shadow-lg transition-shadow duration-300 animate-in slide-in-from-bottom-10">
        <CardHeader>
          <CardTitle>Danh sách đơn nghỉ phép chờ duyệt</CardTitle>
          <CardDescription>
            Quản lý và phê duyệt các đơn nghỉ phép của nhân viên
          </CardDescription>
        </CardHeader>
        <CardContent>
          {leaves.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Không có đơn nghỉ phép nào cần phê duyệt
            </div>
          ) : (
            <Table>
              <TableCaption>Danh sách đơn nghỉ phép chờ duyệt</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>Người xin nghỉ</TableHead>
                  <TableHead>Lý do</TableHead>
                  <TableHead>Thời gian bắt đầu</TableHead>
                  <TableHead>Thời gian kết thúc</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="text-right">Hành động</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leaves.map((leave) => (
                  <TableRow key={leave.id} className="hover:bg-muted/30">
                    <TableCell className="font-medium">{leave.user?.name || "Không xác định"}</TableCell>
                    <TableCell>{leave.reason}</TableCell>
                    <TableCell>
                      {format(new Date(leave.startDate), "EEEE, dd/MM/yyyy HH:mm", { locale: vi })}
                    </TableCell>
                    <TableCell>
                      {format(new Date(leave.endDate), "EEEE, dd/MM/yyyy HH:mm", { locale: vi })}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          leave.status === "APPROVED"
                            ? "default"
                            : leave.status === "PENDING"
                            ? "outline"
                            : "destructive"
                        }
                      >
                        {leave.status === "APPROVED"
                          ? "Đã duyệt"
                          : leave.status === "PENDING"
                          ? "Đang chờ duyệt"
                          : "Đã từ chối"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleRejectLeave(leave.id)}
                          disabled={actionInProgress === leave.id}
                          className="gap-1"
                        >
                          {actionInProgress === leave.id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <X className="h-3 w-3" />
                          )}
                          <span className="hidden sm:inline">Từ chối</span>
                        </Button>
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => handleApproveLeave(leave.id)}
                          disabled={actionInProgress === leave.id}
                          className="gap-1"
                        >
                          {actionInProgress === leave.id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Check className="h-3 w-3" />
                          )}
                          <span className="hidden sm:inline">Phê duyệt</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <div className="text-center text-sm text-muted-foreground">
        <p>
          Xem tất cả nghỉ phép trong{" "}
          <Link href="/dashboard/calendar" className="text-primary hover:underline">
            Lịch nghỉ phép
          </Link>
        </p>
      </div>
    </div>
  );
} 