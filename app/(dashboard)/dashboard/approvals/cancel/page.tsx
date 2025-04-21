"use client";

import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Ban, Loader2, Check, XCircle, RefreshCcw } from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface Leave {
  id: string;
  reason: string;
  startDate: string;
  endDate: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "CANCELED";
  userId: string;
  user?: {
    name: string;
    email: string;
  };
}

export default function CancelLeavesPage() {
  const { data: session, status } = useSession();
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState<Leave | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const { toast } = useToast();
  
  // Kiểm tra nếu không phải admin thì chuyển hướng
  useEffect(() => {
    if (status === "authenticated" && session?.user?.role !== "ADMIN") {
      redirect("/dashboard");
    }
  }, [status, session]);

  // Lấy danh sách đơn nghỉ phép đã được duyệt
  const fetchApprovedLeaves = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/leaves/approved");
      if (!response.ok) {
        throw new Error("Failed to fetch approved leaves");
      }
      const data = await response.json();
      setLeaves(data);
    } catch (error) {
      console.error("Error fetching approved leaves:", error);
      toast({
        title: "Lỗi",
        description: "Không thể tải danh sách đơn nghỉ phép đã duyệt",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (session?.user) {
      fetchApprovedLeaves();
    }
  }, [session]);

  // Mở dialog xác nhận hủy đơn
  const handleOpenCancelDialog = (leave: Leave) => {
    setSelectedLeave(leave);
    setCancelReason("");
    setConfirmDialogOpen(true);
  };

  // Xử lý hủy đơn nghỉ phép
  const handleCancelLeave = async () => {
    if (!selectedLeave) return;
    
    setActionInProgress(selectedLeave.id);
    try {
      const response = await fetch(`/api/leaves/${selectedLeave.id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          status: "CANCELED",
          cancelReason: cancelReason || "Đơn nghỉ phép bị hủy bởi quản trị viên"
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Có lỗi xảy ra khi hủy đơn nghỉ phép");
      }

      // Cập nhật thành công
      toast({
        title: "Hủy đơn nghỉ phép thành công",
        description: "Đơn nghỉ phép đã được hủy",
        variant: "default",
      });

      // Làm mới danh sách
      await fetchApprovedLeaves();
      
      // Đóng dialog
      setConfirmDialogOpen(false);
    } catch (error) {
      console.error("Error canceling leave:", error);
      toast({
        title: "Lỗi cập nhật",
        description: error instanceof Error ? error.message : "Có lỗi xảy ra khi hủy đơn nghỉ phép",
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
            <Ban className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Hủy đơn nghỉ phép</h1>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            className="rounded-full shadow-sm transition-all hover:shadow-md hover:translate-y-[-1px] bg-slate-100 text-slate-800 hover:bg-slate-200"
            onClick={fetchApprovedLeaves}
          >
            <RefreshCcw className="mr-2 h-4 w-4" />
            Làm mới
          </Button>
          
          <Button 
            className="rounded-full shadow-sm transition-all hover:shadow-md hover:translate-y-[-1px] bg-primary hover:bg-primary/90"
            asChild
          >
            <Link href="/dashboard/approvals">
              <Check className="mr-2 h-4 w-4" />
              Duyệt đơn nghỉ phép
            </Link>
          </Button>
        </div>
      </div>

      <Card className="rounded-xl overflow-hidden border-primary/10 shadow-md hover:shadow-lg transition-shadow duration-300 animate-in slide-in-from-bottom-10">
        <CardHeader>
          <CardTitle>Danh sách đơn nghỉ phép đã duyệt</CardTitle>
          <CardDescription>
            Quản lý và hủy các đơn nghỉ phép đã được duyệt
          </CardDescription>
        </CardHeader>
        <CardContent>
          {leaves.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Không có đơn nghỉ phép nào đã duyệt
            </div>
          ) : (
            <Table>
              <TableCaption>Danh sách đơn nghỉ phép đã duyệt</TableCaption>
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
                      <Badge variant="default">
                        Đã duyệt
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleOpenCancelDialog(leave)}
                        disabled={actionInProgress === leave.id}
                        className="gap-1"
                      >
                        {actionInProgress === leave.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <XCircle className="h-3 w-3" />
                        )}
                        <span className="hidden sm:inline">Hủy đơn</span>
                      </Button>
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

      {/* Dialog xác nhận hủy đơn */}
      {selectedLeave && (
        <Dialog
          open={confirmDialogOpen}
          onOpenChange={(open) => {
            if (!open) {
              setConfirmDialogOpen(false);
            }
          }}
        >
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                Xác nhận hủy đơn nghỉ phép
              </DialogTitle>
              <DialogDescription>
                Bạn có chắc chắn muốn hủy đơn nghỉ phép này?
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <div className="font-medium">Thông tin đơn nghỉ phép:</div>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div className="font-medium">Người xin nghỉ:</div>
                  <div className="col-span-2">{selectedLeave.user?.name || "Không xác định"}</div>
                  
                  <div className="font-medium">Lý do:</div>
                  <div className="col-span-2">{selectedLeave.reason}</div>
                  
                  <div className="font-medium">Từ:</div>
                  <div className="col-span-2">
                    {format(new Date(selectedLeave.startDate), "EEEE, dd/MM/yyyy HH:mm", { locale: vi })}
                  </div>
                  
                  <div className="font-medium">Đến:</div>
                  <div className="col-span-2">
                    {format(new Date(selectedLeave.endDate), "EEEE, dd/MM/yyyy HH:mm", { locale: vi })}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="cancelReason">Lý do hủy đơn</Label>
                <Textarea
                  id="cancelReason"
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Nhập lý do hủy đơn nghỉ phép"
                  className="resize-none"
                  rows={3}
                />
              </div>
            </div>

            <DialogFooter className="flex items-center justify-between sm:justify-between">
              <Button
                variant="outline"
                onClick={() => setConfirmDialogOpen(false)}
                disabled={actionInProgress === selectedLeave.id}
              >
                Hủy
              </Button>
              <Button
                variant="destructive"
                onClick={handleCancelLeave}
                disabled={actionInProgress === selectedLeave.id}
                className="gap-2"
              >
                {actionInProgress === selectedLeave.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <XCircle className="h-4 w-4" />
                )}
                Xác nhận hủy
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
} 