"use client";

import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Check, Ban, Loader2, XCircle, RefreshCcw, Filter, Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect, useCallback } from "react";
import { format, addDays, isAfter, isBefore, startOfDay, endOfDay } from "date-fns";
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
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";

// Số lượng đơn mỗi trang
const PAGE_SIZE = 10;

interface Leave {
  id: string;
  reason: string;
  startDate: string;
  endDate: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "CANCELED";
  cancelReason?: string;
  userId: string;
  user?: {
    name: string;
    email: string;
  };
}

export default function LeaveManagementPage() {
  const { data: session, status } = useSession();
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [filteredLeaves, setFilteredLeaves] = useState<Leave[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState<Leave | null>(null);
  const [dialogAction, setDialogAction] = useState<"approve" | "reject" | "cancel" | "activate">("approve");
  const [actionReason, setActionReason] = useState("");
  const { toast } = useToast();
  
  // State cho bộ lọc
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Filter popover
  const [filterPopoverOpen, setFilterPopoverOpen] = useState(false);
  const [dateFromPopoverOpen, setDateFromPopoverOpen] = useState(false);
  const [dateToPopoverOpen, setDateToPopoverOpen] = useState(false);

  // Kiểm tra nếu không phải admin thì chuyển hướng
  useEffect(() => {
    if (status === "authenticated" && session?.user?.role !== "ADMIN") {
      redirect("/dashboard");
    }
  }, [status, session]);

  // Lấy danh sách tất cả đơn nghỉ phép
  const fetchLeaves = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/leaves/all");
      if (!response.ok) {
        throw new Error("Failed to fetch leaves");
      }
      const data = await response.json();
      setLeaves(data);
      applyFilters(data);
    } catch (error) {
      console.error("Error fetching leaves:", error);
      toast({
        title: "Lỗi",
        description: "Không thể tải danh sách đơn nghỉ phép",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Áp dụng bộ lọc lên danh sách đơn
  const applyFilters = useCallback((leavesData = leaves) => {
    let filtered = [...leavesData];
    
    // Lọc theo trạng thái
    if (statusFilter) {
      filtered = filtered.filter(leave => leave.status === statusFilter);
    }
    
    // Lọc theo ngày bắt đầu
    if (dateFrom) {
      const fromDate = startOfDay(dateFrom);
      filtered = filtered.filter(leave => 
        isAfter(new Date(leave.startDate), fromDate) || 
        isAfter(new Date(leave.endDate), fromDate)
      );
    }
    
    // Lọc theo ngày kết thúc
    if (dateTo) {
      const toDate = endOfDay(dateTo);
      filtered = filtered.filter(leave => 
        isBefore(new Date(leave.startDate), toDate) || 
        isBefore(new Date(leave.endDate), toDate)
      );
    }
    
    // Lọc theo từ khóa tìm kiếm (tên người dùng hoặc lý do)
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(leave => 
        leave.user?.name?.toLowerCase().includes(term) || 
        leave.reason.toLowerCase().includes(term)
      );
    }
    
    // Cập nhật tổng số trang
    setTotalPages(Math.ceil(filtered.length / PAGE_SIZE));
    
    // Reset về trang đầu tiên khi thay đổi bộ lọc
    setCurrentPage(1);
    
    // Lưu kết quả lọc
    setFilteredLeaves(filtered);
  }, [statusFilter, dateFrom, dateTo, searchTerm]);

  // Gọi API khi component mount, không phụ thuộc vào fetchLeaves
  useEffect(() => {
    if (session?.user) {
      fetchLeaves();
    }
  }, [session]);

  // Xử lý khi thay đổi bộ lọc, chỉ lọc lại dữ liệu đã có
  useEffect(() => {
    if (leaves.length > 0) {
      applyFilters(leaves);
    }
  }, [statusFilter, dateFrom, dateTo, searchTerm, applyFilters, leaves]);

  // Lấy các đơn theo trang hiện tại
  const paginatedLeaves = filteredLeaves.slice(
    (currentPage - 1) * PAGE_SIZE, 
    currentPage * PAGE_SIZE
  );

  // Reset bộ lọc
  const resetFilters = () => {
    setStatusFilter("");
    setDateFrom(undefined);
    setDateTo(undefined);
    setSearchTerm("");
    setFilterPopoverOpen(false);
  };

  // Mở dialog xác nhận
  const handleOpenDialog = (leave: Leave, action: "approve" | "reject" | "cancel" | "activate") => {
    setSelectedLeave(leave);
    setDialogAction(action);
    setActionReason("");
    setDialogOpen(true);
  };

  // Xử lý các hành động với đơn
  const handleLeaveAction = async () => {
    if (!selectedLeave) return;
    
    setActionInProgress(selectedLeave.id);
    try {
      // Xác định status theo action
      let newStatus = selectedLeave.status;
      if (dialogAction === "approve") newStatus = "APPROVED";
      else if (dialogAction === "reject") newStatus = "REJECTED";
      else if (dialogAction === "cancel") newStatus = "CANCELED";
      else if (dialogAction === "activate") newStatus = "PENDING";
      
      const response = await fetch(`/api/leaves/${selectedLeave.id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: newStatus,
          // Nếu là hủy hoặc từ chối thì thêm lý do
          ...(dialogAction === "cancel" 
            ? { cancelReason: actionReason || "Đơn nghỉ phép bị hủy bởi quản trị viên" }
            : {}),
          ...(dialogAction === "reject" 
            ? { rejectReason: actionReason || "Đơn nghỉ phép bị từ chối" }
            : {})
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Có lỗi xảy ra khi ${getActionText(dialogAction)} đơn nghỉ phép`);
      }

      // Cập nhật thành công
      toast({
        title: `${getActionText(dialogAction, true)} đơn nghỉ phép thành công`,
        description: `Đơn nghỉ phép đã được ${getActionText(dialogAction, true).toLowerCase()}`,
        variant: "default",
      });

      // Làm mới danh sách
      await fetchLeaves();
      
      // Đóng dialog
      setDialogOpen(false);
    } catch (error) {
      console.error(`Error ${dialogAction} leave:`, error);
      toast({
        title: "Lỗi cập nhật",
        description: error instanceof Error ? error.message : `Có lỗi xảy ra khi ${getActionText(dialogAction)} đơn nghỉ phép`,
        variant: "destructive",
      });
    } finally {
      setActionInProgress(null);
    }
  };

  // Helper function để trả về text phù hợp với hành động
  const getActionText = (action: string, past = false) => {
    switch (action) {
      case "approve": return past ? "Đã duyệt" : "duyệt";
      case "reject": return past ? "Từ chối" : "từ chối";
      case "cancel": return past ? "Hủy" : "hủy";
      case "activate": return past ? "Đã kích hoạt lại" : "kích hoạt lại";
      default: return action;
    }
  };

  // Helper function để hiển thị badge trạng thái
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "APPROVED":
        return <Badge variant="default">Đã duyệt</Badge>;
      case "PENDING":
        return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-300">Chờ duyệt</Badge>;
      case "REJECTED":
        return <Badge variant="destructive">Từ chối</Badge>;
      case "CANCELED":
        return <Badge variant="secondary">Đã hủy</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-primary/10 rounded-full shadow-sm">
            <Calendar className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Quản lý đơn nghỉ phép</h1>
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[200px]">
            <Input
              placeholder="Tìm theo tên, lý do..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pr-8"
            />
            {searchTerm && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full"
                onClick={() => setSearchTerm("")}
              >
                <XCircle className="h-4 w-4" />
              </Button>
            )}
          </div>
          
          <Popover open={filterPopoverOpen} onOpenChange={setFilterPopoverOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Filter className="h-4 w-4" />
                Lọc
                {(statusFilter || dateFrom || dateTo) && (
                  <Badge variant="secondary" className="ml-1 h-5 rounded-full px-2">
                    {(statusFilter ? 1 : 0) + (dateFrom ? 1 : 0) + (dateTo ? 1 : 0)}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
              <div className="space-y-4">
                <h4 className="font-medium">Lọc đơn nghỉ phép</h4>
                
                <div className="space-y-2">
                  <Label htmlFor="status-filter">Trạng thái</Label>
                  <Select
                    value={statusFilter}
                    onValueChange={setStatusFilter}
                  >
                    <SelectTrigger id="status-filter">
                      <SelectValue placeholder="Tất cả trạng thái" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Tất cả trạng thái</SelectItem>
                      <SelectItem value="PENDING">Chờ duyệt</SelectItem>
                      <SelectItem value="APPROVED">Đã duyệt</SelectItem>
                      <SelectItem value="REJECTED">Từ chối</SelectItem>
                      <SelectItem value="CANCELED">Đã hủy</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="date-from">Từ ngày</Label>
                  <Popover open={dateFromPopoverOpen} onOpenChange={setDateFromPopoverOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        id="date-from"
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        {dateFrom ? (
                          format(dateFrom, "dd/MM/yyyy", { locale: vi })
                        ) : (
                          <span className="text-muted-foreground">Chọn ngày bắt đầu</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={dateFrom}
                        onSelect={(date) => {
                          setDateFrom(date);
                          setDateFromPopoverOpen(false);
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="date-to">Đến ngày</Label>
                  <Popover open={dateToPopoverOpen} onOpenChange={setDateToPopoverOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        id="date-to"
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        {dateTo ? (
                          format(dateTo, "dd/MM/yyyy", { locale: vi })
                        ) : (
                          <span className="text-muted-foreground">Chọn ngày kết thúc</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={dateTo}
                        onSelect={(date) => {
                          setDateTo(date);
                          setDateToPopoverOpen(false);
                        }}
                        initialFocus
                        disabled={(date) => dateFrom ? isBefore(date, dateFrom) : false}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                
                <div className="flex justify-between">
                  <Button
                    variant="ghost"
                    onClick={resetFilters}
                    className="text-sm h-8"
                  >
                    Đặt lại bộ lọc
                  </Button>
                  <Button
                    onClick={() => setFilterPopoverOpen(false)}
                    className="text-sm h-8"
                  >
                    Áp dụng
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
          
          <Button 
            variant="outline"
            className="gap-2"
            onClick={fetchLeaves}
          >
            <RefreshCcw className="h-4 w-4" />
            Làm mới
          </Button>
        </div>
      </div>

      <Card className="rounded-xl overflow-hidden border-primary/10 shadow-md hover:shadow-lg transition-all duration-300 animate-in slide-in-from-bottom-10">
        <CardHeader>
          <CardTitle>Danh sách đơn nghỉ phép</CardTitle>
          <CardDescription>
            Quản lý và xử lý các đơn nghỉ phép của nhân viên
          </CardDescription>
        </CardHeader>
        <CardContent>
          {paginatedLeaves.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {filteredLeaves.length === 0 && leaves.length > 0 ? 
                "Không tìm thấy đơn nghỉ phép phù hợp với bộ lọc" : 
                "Không có đơn nghỉ phép nào"
              }
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
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
                    {paginatedLeaves.map((leave) => (
                      <TableRow key={leave.id} className="hover:bg-muted/30">
                        <TableCell className="font-medium">{leave.user?.name || "Không xác định"}</TableCell>
                        <TableCell>
                          <div className="max-w-[200px] truncate" title={leave.reason}>
                            {leave.reason}
                          </div>
                        </TableCell>
                        <TableCell>
                          {format(new Date(leave.startDate), "EEEE, dd/MM/yyyy HH:mm", { locale: vi })}
                        </TableCell>
                        <TableCell>
                          {format(new Date(leave.endDate), "EEEE, dd/MM/yyyy HH:mm", { locale: vi })}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(leave.status)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            {/* Hiển thị nút duyệt/từ chối khi trạng thái PENDING */}
                            {leave.status === "PENDING" && (
                              <>
                                <Button
                                  size="sm"
                                  variant="default"
                                  onClick={() => handleOpenDialog(leave, "approve")}
                                  disabled={actionInProgress === leave.id}
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  <Check className="h-3.5 w-3.5 mr-1" />
                                  <span className="hidden sm:inline">Duyệt</span>
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleOpenDialog(leave, "reject")}
                                  disabled={actionInProgress === leave.id}
                                >
                                  <XCircle className="h-3.5 w-3.5 mr-1" />
                                  <span className="hidden sm:inline">Từ chối</span>
                                </Button>
                              </>
                            )}
                            
                            {/* Hiển thị nút hủy khi trạng thái APPROVED */}
                            {leave.status === "APPROVED" && (
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleOpenDialog(leave, "cancel")}
                                disabled={actionInProgress === leave.id}
                              >
                                <Ban className="h-3.5 w-3.5 mr-1" />
                                <span className="hidden sm:inline">Hủy đơn</span>
                              </Button>
                            )}
                            
                            {/* Hiển thị nút kích hoạt lại khi trạng thái CANCELED */}
                            {leave.status === "CANCELED" && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleOpenDialog(leave, "activate")}
                                disabled={actionInProgress === leave.id}
                                className="border-amber-500 hover:bg-amber-50 text-amber-700"
                              >
                                <RefreshCcw className="h-3.5 w-3.5 mr-1" />
                                <span className="hidden sm:inline">Kích hoạt lại</span>
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              
              {/* Phân trang */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-muted-foreground">
                    Hiển thị {(currentPage - 1) * PAGE_SIZE + 1} - {Math.min(currentPage * PAGE_SIZE, filteredLeaves.length)} trên {filteredLeaves.length} đơn
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <div className="text-sm font-medium">
                      Trang {currentPage} / {totalPages}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Dialog xác nhận hành động */}
      {selectedLeave && (
        <Dialog
          open={dialogOpen}
          onOpenChange={(open) => {
            if (!open) {
              setDialogOpen(false);
            }
          }}
        >
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {dialogAction === "approve" && "Xác nhận duyệt đơn nghỉ phép"}
                {dialogAction === "reject" && "Xác nhận từ chối đơn nghỉ phép"}
                {dialogAction === "cancel" && "Xác nhận hủy đơn nghỉ phép"}
                {dialogAction === "activate" && "Xác nhận kích hoạt lại đơn nghỉ phép"}
              </DialogTitle>
              <DialogDescription>
                {dialogAction === "approve" && "Bạn có chắc chắn muốn duyệt đơn nghỉ phép này?"}
                {dialogAction === "reject" && "Bạn có chắc chắn muốn từ chối đơn nghỉ phép này?"}
                {dialogAction === "cancel" && "Bạn có chắc chắn muốn hủy đơn nghỉ phép này?"}
                {dialogAction === "activate" && "Bạn có chắc chắn muốn kích hoạt lại đơn nghỉ phép này? Đơn sẽ được chuyển về trạng thái chờ duyệt."}
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

              {(dialogAction === "reject" || dialogAction === "cancel") && (
                <div className="space-y-2">
                  <Label htmlFor="actionReason">
                    {dialogAction === "reject" ? "Lý do từ chối" : "Lý do hủy đơn"}
                  </Label>
                  <Textarea
                    id="actionReason"
                    value={actionReason}
                    onChange={(e) => setActionReason(e.target.value)}
                    placeholder={dialogAction === "reject" 
                      ? "Nhập lý do từ chối đơn nghỉ phép" 
                      : "Nhập lý do hủy đơn nghỉ phép"
                    }
                    className="resize-none"
                    rows={3}
                  />
                </div>
              )}
            </div>

            <DialogFooter className="flex items-center justify-between sm:justify-between">
              <Button
                variant="outline"
                onClick={() => setDialogOpen(false)}
                disabled={actionInProgress === selectedLeave.id}
              >
                Hủy
              </Button>
              <Button
                variant={dialogAction === "approve" ? "default" : dialogAction === "cancel" ? "destructive" : "outline"}
                onClick={handleLeaveAction}
                disabled={actionInProgress === selectedLeave.id}
                className={dialogAction === "approve" ? "bg-green-600 hover:bg-green-700" : dialogAction === "cancel" ? "bg-destructive hover:bg-destructive/90" : "border-amber-500 hover:bg-amber-50 text-amber-700"}
              >
                {actionInProgress === selectedLeave.id ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : dialogAction === "approve" ? (
                  <Check className="h-4 w-4 mr-2" />
                ) : dialogAction === "cancel" ? (
                  <Ban className="h-4 w-4 mr-2" />
                ) : (
                  <RefreshCcw className="h-4 w-4 mr-2" />
                )}
                Xác nhận {getActionText(dialogAction)}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
} 