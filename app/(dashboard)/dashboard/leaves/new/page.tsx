"use client";

import { useSession } from "next-auth/react";
import { redirect, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar as CalendarIcon, PlusCircle, Loader2 } from "lucide-react";
import { DateTimePicker } from "@/components/ui/date-time-picker";
import Link from "next/link";
import { differenceInMinutes, addHours, format } from "date-fns";
import { vi } from "date-fns/locale";
import { toast } from "@/components/ui/use-toast";

export default function NewLeavePage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [startDate, setStartDate] = useState<Date | undefined>(new Date());
  const [endDate, setEndDate] = useState<Date | undefined>(addHours(new Date(), 1));
  const [reason, setReason] = useState("");
  const [formError, setFormError] = useState("");
  const [duration, setDuration] = useState<string>("");

  // Tính toán thời lượng nghỉ phép khi ngày bắt đầu hoặc kết thúc thay đổi
  useEffect(() => {
    if (startDate && endDate) {
      // Tính toán thời lượng nghỉ (phút)
      const minutesDiff = differenceInMinutes(endDate, startDate);
      
      if (minutesDiff <= 0) {
        setDuration("Thời gian kết thúc phải sau thời gian bắt đầu");
        return;
      }

      // Chuyển đổi phút thành giờ và phút
      const hours = Math.floor(minutesDiff / 60);
      const minutes = minutesDiff % 60;

      // Tạo chuỗi hiển thị
      if (hours > 0 && minutes > 0) {
        setDuration(`${hours} giờ ${minutes} phút`);
      } else if (hours > 0) {
        setDuration(`${hours} giờ`);
      } else {
        setDuration(`${minutes} phút`);
      }
    } else {
      setDuration("");
    }
  }, [startDate, endDate]);

  // Xử lý tạo đơn nghỉ
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!startDate || !endDate || !reason) {
      setFormError("Vui lòng điền đầy đủ thông tin");
      return;
    }

    if (startDate > endDate) {
      setFormError("Thời gian bắt đầu không thể sau thời gian kết thúc");
      return;
    }

    setIsSubmitting(true);
    setFormError("");

    try {
      const response = await fetch("/api/leaves", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          reason,
          status: "APPROVED" // API sẽ chuyển đổi sang enum LeaveStatus.APPROVED
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 409) {
          setFormError(data.error || "Đơn nghỉ phép của bạn bị trùng với đơn đã tồn tại");
        } else {
          setFormError(data.error || "Có lỗi xảy ra khi tạo đơn nghỉ phép");
        }
        return;
      }

      // Thành công: thông báo và chuyển hướng về lịch
      toast({
        title: "Tạo đơn nghỉ phép thành công",
        description: "Đơn nghỉ phép của bạn đã được tạo và được tự động duyệt",
        variant: "default",
      });

      router.push("/dashboard/calendar");
    } catch (error) {
      console.error("Error creating leave:", error);
      setFormError("Có lỗi xảy ra khi tạo đơn nghỉ phép");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <div className="text-lg font-medium">Đang tải dữ liệu...</div>
        </div>
      </div>
    );
  }

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="flex flex-col items-center justify-center p-4 md:p-8 animate-in fade-in-50 duration-500">
      <div className="w-full max-w-2xl">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-primary/10 rounded-full shadow-sm">
              <PlusCircle className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Tạo đơn nghỉ phép</h1>
          </div>
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="shadow-sm"
          >
            Trở lại
          </Button>
        </div>

        <Card className="border border-primary/10 shadow-md hover:shadow-lg transition-shadow duration-300">
          <form onSubmit={handleSubmit}>
            <CardHeader>
              <CardTitle>Thông tin đơn nghỉ phép</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6">
                <div className="space-y-2">
                  <label htmlFor="startDate" className="block text-sm font-medium">
                    Thời gian bắt đầu <span className="text-destructive">*</span>
                  </label>
                  <DateTimePicker
                    date={startDate}
                    setDate={setStartDate}
                    label="Thời gian bắt đầu"
                    placeholder="Chọn thời gian bắt đầu nghỉ"
                    isStartDate={true}
                    otherDate={endDate}
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="endDate" className="block text-sm font-medium">
                    Thời gian kết thúc <span className="text-destructive">*</span>
                  </label>
                  <DateTimePicker
                    date={endDate}
                    setDate={setEndDate}
                    label="Thời gian kết thúc"
                    placeholder="Chọn thời gian kết thúc nghỉ"
                    isStartDate={false}
                    otherDate={startDate}
                    minDate={startDate}
                  />
                </div>

                {duration && (
                  <div className="p-3 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 text-sm">
                    <div className="flex items-center gap-2">
                      <CalendarIcon className="h-4 w-4" />
                      <div>
                        <strong>Thời lượng nghỉ phép:</strong> {duration}
                      </div>
                    </div>
                    {startDate && endDate && (
                      <div className="mt-2 text-xs text-blue-600">
                        {format(startDate, "EEEE, dd/MM/yyyy HH:mm", { locale: vi })}
                        {" đến "}
                        {format(endDate, "EEEE, dd/MM/yyyy HH:mm", { locale: vi })}
                      </div>
                    )}
                  </div>
                )}

                <div className="space-y-2">
                  <label htmlFor="reason" className="block text-sm font-medium">
                    Lý do <span className="text-destructive">*</span>
                  </label>
                  <Textarea
                    id="reason"
                    placeholder="Nhập lý do xin nghỉ phép"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="resize-none"
                    rows={3}
                  />
                  <p className="text-xs text-muted-foreground">
                    Lý do nghỉ phép sẽ được hiển thị cho quản lý của bạn.
                  </p>
                </div>
              </div>

              {formError && (
                <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm flex items-start animate-in zoom-in-95 duration-150">
                  <div className="flex-1">{formError}</div>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-between border-t bg-muted/30 px-6 py-4">
              <Button
                type="button"
                variant="ghost"
                asChild
                className="gap-1"
              >
                <Link href="/dashboard/calendar">Hủy</Link>
              </Button>
              <Button
                type="submit"
                className="gap-1"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <PlusCircle className="h-4 w-4" />
                )}
                Tạo đơn nghỉ phép
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
} 