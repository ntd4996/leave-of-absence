"use client";

import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Plus,
  Calendar as CalendarIcon,
  Loader2,
  Check,
  X,
  Calendar,
} from "lucide-react";
import { useRouter } from "next/navigation";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import {
  EventContentArg,
  EventMountArg,
  EventClickArg,
} from "@fullcalendar/core";
import tippy from "tippy.js";
import "tippy.js/dist/tippy.css";
import "tippy.js/themes/light.css";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";

interface Leave {
  id: string;
  reason: string;
  startDate: string;
  endDate: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "CANCELED";
  userId: string;
  user?: {
    name: string;
  };
}

export default function CalendarPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedLeave, setSelectedLeave] = useState<Leave | null>(null);
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<"approve" | "reject" | null>(
    null
  );
  const [isActionLoading, setIsActionLoading] = useState(false);
  const calendarRef = useRef(null);
  const { toast } = useToast();
  const isAdmin = session?.user?.role === "ADMIN";

  useEffect(() => {
    if (session?.user) {
      fetchLeaves();
    }
  }, [session]);

  const fetchLeaves = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/leaves/all");
      const data = await response.json();
      const formattedEvents = data.map((leave: Leave) => {
        const startFormatted = format(
          new Date(leave.startDate),
          "EEEE, dd/MM/yyyy HH:mm",
          { locale: vi }
        );
        const endFormatted = format(
          new Date(leave.endDate),
          "EEEE, dd/MM/yyyy HH:mm",
          { locale: vi }
        );

        const displayTitle = leave.user?.name
          ? `${leave.user.name}: ${leave.reason}`
          : leave.reason;

        return {
          id: leave.id,
          title: displayTitle,
          start: new Date(leave.startDate),
          end: new Date(leave.endDate),
          backgroundColor:
            leave.status === "APPROVED"
              ? "rgba(34, 197, 94, 0.9)"
              : leave.status === "PENDING"
              ? "rgba(245, 158, 11, 0.9)"
              : leave.status === "CANCELED"
              ? "rgba(163, 163, 163, 0.9)"
              : "rgba(239, 68, 68, 0.9)",
          borderColor:
            leave.status === "APPROVED"
              ? "rgb(21, 128, 61)"
              : leave.status === "PENDING"
              ? "rgb(180, 83, 9)"
              : leave.status === "CANCELED"
              ? "rgb(107, 114, 128)"
              : "rgb(185, 28, 28)",
          textColor: "#ffffff",
          borderRadius: "8px",
          borderWidth: "1px",
          classNames: [
            leave.status === "APPROVED"
              ? "approved-event"
              : leave.status === "PENDING"
              ? "pending-event"
              : leave.status === "CANCELED"
              ? "canceled-event"
              : "rejected-event",
          ],
          display: leave.status === "CANCELED" ? "auto" : "auto",
          extendedProps: {
            status: leave.status,
            userName: leave.user?.name || "Không xác định",
            userId: leave.userId,
            leaveId: leave.id,
            reason: leave.reason,
            startFormatted,
            endFormatted,
            originalLeave: leave,
          },
        };
      });
      setEvents(formattedEvents);
    } catch (error) {
      console.error("Error fetching leaves:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const renderEventContent = (eventInfo: EventContentArg) => {
    return (
      <div className="event-content">
        <div className="event-title">{eventInfo.event.title}</div>
      </div>
    );
  };

  const handleEventClick = (clickInfo: EventClickArg) => {
    const leave = clickInfo.event.extendedProps.originalLeave;
    setSelectedLeave(leave);
    setActionDialogOpen(true);
  };

  const handleApproveLeave = async () => {
    setActionType("approve");
    await updateLeaveStatus("APPROVED");
  };

  const handleRejectLeave = async () => {
    setActionType("reject");
    await updateLeaveStatus("REJECTED");
  };

  const updateLeaveStatus = async (status: "APPROVED" | "REJECTED") => {
    if (!selectedLeave) return;

    setIsActionLoading(true);
    try {
      const response = await fetch(`/api/leaves/${selectedLeave.id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || "Có lỗi xảy ra khi cập nhật đơn nghỉ"
        );
      }

      toast({
        title:
          status === "APPROVED" ? "Phê duyệt thành công" : "Từ chối thành công",
        description:
          status === "APPROVED"
            ? "Đơn nghỉ phép đã được phê duyệt"
            : "Đơn nghỉ phép đã bị từ chối",
        variant: status === "APPROVED" ? "default" : "destructive",
      });

      await fetchLeaves();

      setActionDialogOpen(false);
    } catch (error) {
      console.error("Error updating leave status:", error);
      toast({
        title: "Lỗi cập nhật",
        description:
          error instanceof Error
            ? error.message
            : "Có lỗi xảy ra khi cập nhật đơn nghỉ",
        variant: "destructive",
      });
    } finally {
      setIsActionLoading(false);
      setActionType(null);
    }
  };

  if (status === "loading") {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <div className="text-lg font-medium">Đang tải lịch nghỉ phép...</div>
        </div>
      </div>
    );
  }

  if (!session) {
    redirect("/login");
  }

  const handleCreateLeave = () => {
    router.push("/dashboard/leaves/new");
  };

  // Thiết lập tooltip cho các sự kiện
  const eventDidMount = (info: EventMountArg) => {
    const { event } = info;
    const props = event.extendedProps;
    const statusText =
      props.status === "APPROVED"
        ? "Đã duyệt"
        : props.status === "PENDING"
        ? "Đang chờ duyệt"
        : "Đã từ chối";

    const tooltipContent = `
      <div class="event-tooltip">
        <div class="tooltip-header" style="font-weight: bold; font-size: 14px; margin-bottom: 5px; color: #0f172a;">${
          props.userName
        }</div>
        <div class="tooltip-time" style="margin-bottom: 5px; font-size: 13px; color: #334155;">
          <strong>Bắt đầu:</strong> ${props.startFormatted}<br>
          <strong>Kết thúc:</strong> ${props.endFormatted}
        </div>
        <div class="tooltip-reason" style="margin-bottom: 5px; font-size: 13px; color: #334155;">
          <strong>Lý do:</strong> ${props.reason}
        </div>
        <div class="tooltip-status" style="font-size: 13px; padding: 2px 5px; border-radius: 4px; display: inline-block; 
          background-color: ${
            props.status === "APPROVED"
              ? "rgba(34, 197, 94, 0.2)"
              : props.status === "PENDING"
              ? "rgba(245, 158, 11, 0.2)"
              : props.status === "CANCELED"
              ? "rgba(163, 163, 163, 0.2)"
              : "rgba(239, 68, 68, 0.2)"
          }; 
          color: ${
            props.status === "APPROVED"
              ? "rgb(21, 128, 61)"
              : props.status === "PENDING"
              ? "rgb(180, 83, 9)"
              : props.status === "CANCELED"
              ? "rgb(107, 114, 128)"
              : "rgb(185, 28, 28)"
          };">
          <strong>Trạng thái:</strong> ${statusText}
        </div>
      </div>
    `;

    // Sử dụng tippy.js
    tippy(info.el, {
      content: tooltipContent,
      allowHTML: true,
      placement: "right",
      theme: "light",
      offset: [0, 10],
      arrow: true,
      maxWidth: 350,
      interactive: true,
      zIndex: 100,
      showOnCreate: true,
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-500">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-primary/10 rounded-full shadow-sm">
            <CalendarIcon className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Lịch nghỉ phép</h1>
        </div>

        <div className="flex items-center gap-2">
          {isAdmin && (
            <>
              <Button
                className="rounded-full shadow-sm transition-all hover:shadow-md hover:translate-y-[-1px] bg-slate-600 hover:bg-slate-700"
                onClick={() => router.push("/dashboard/leaves/management")}
              >
                <Calendar className="mr-2 h-4 w-4" />
                Quản lý đơn nghỉ phép
              </Button>
            </>
          )}
          <Button
            className="rounded-full shadow-sm transition-all hover:shadow-md hover:translate-y-[-1px] bg-primary hover:bg-primary/90"
            onClick={handleCreateLeave}
          >
            <Plus className="mr-2 h-4 w-4" />
            Tạo đơn nghỉ phép
          </Button>
        </div>
      </div>

      <Card className="rounded-xl overflow-hidden border-primary/10 shadow-md hover:shadow-lg transition-shadow duration-300 animate-in slide-in-from-bottom-10">
        <style jsx global>{`
          .fc {
            --fc-border-color: #e2e8f0;
            --fc-button-bg-color: #f8fafc;
            --fc-button-border-color: #e2e8f0;
            --fc-button-text-color: #1e293b;
            --fc-button-hover-bg-color: rgba(14, 165, 233, 0.1);
            --fc-button-hover-border-color: rgba(14, 165, 233, 0.3);
            --fc-button-active-bg-color: rgba(14, 165, 233, 0.9);
            --fc-button-active-border-color: rgba(14, 165, 233, 0.9);
            --fc-event-bg-color: #0ea5e9;
            --fc-event-border-color: #0284c7;
            --fc-today-bg-color: rgba(14, 165, 233, 0.05);
            --fc-now-indicator-color: #0ea5e9;
            font-family: inherit;
          }

          .fc .fc-button {
            border-radius: 9999px;
            padding: 0.5rem 1rem;
            font-size: 0.875rem;
            font-weight: 500;
            box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
            transition: all 0.2s ease;
          }

          .fc .fc-button:hover {
            transform: translateY(-1px);
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          }

          .fc .fc-button-primary:not(:disabled):active,
          .fc .fc-button-primary:not(:disabled).fc-button-active {
            background-color: var(--fc-button-active-bg-color);
            border-color: var(--fc-button-active-border-color);
            color: white;
          }

          .fc .fc-col-header-cell-cushion,
          .fc .fc-daygrid-day-number,
          .fc .fc-timegrid-slot-label-cushion {
            text-decoration: none;
            color: inherit;
            padding: 4px;
          }

          .fc .fc-timegrid-slot {
            height: 60px;
          }

          .fc .fc-toolbar-title {
            font-size: 1.25rem;
            font-weight: 600;
            color: #334155;
          }

          .fc .fc-event {
            padding: 3px 8px;
            font-size: 0.875rem;
            font-weight: 500;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
            cursor: pointer;
            transition: transform 0.15s ease, box-shadow 0.15s ease;
          }

          .fc .fc-event:hover {
            transform: translateY(-1px) scale(1.01);
            box-shadow: 0 3px 6px rgba(0, 0, 0, 0.1);
            z-index: 10;
          }

          .fc .approved-event {
            border-left: 3px solid rgb(21, 128, 61);
          }

          .fc .pending-event {
            border-left: 3px solid rgb(180, 83, 9);
          }

          .fc .rejected-event {
            border-left: 3px solid rgb(185, 28, 28);
          }

          .fc .canceled-event {
            border-left: 3px solid rgb(107, 114, 128);
            opacity: 0.6;
          }

          .fc .fc-timegrid-event {
            border-radius: 8px;
          }

          .fc .fc-timegrid-now-indicator-line {
            border-width: 2px;
            border-style: solid;
            border-color: var(--fc-now-indicator-color);
          }

          .fc th {
            padding: 10px 0;
            font-weight: 600;
            text-transform: uppercase;
            font-size: 0.75rem;
            letter-spacing: 0.05em;
            color: #64748b;
          }

          .fc-direction-ltr .fc-timegrid-slot-label-frame {
            text-align: center;
            color: #64748b;
            font-weight: 500;
            padding-right: 10px;
          }

          .fc-theme-standard .fc-scrollgrid {
            border-radius: 10px;
            overflow: hidden;
            border-width: 1px;
          }

          .fc .fc-day-today {
            background-color: var(--fc-today-bg-color) !important;
          }

          .fc .fc-scrollgrid-section-header th {
            border-bottom-width: 2px;
            border-bottom-color: rgba(14, 165, 233, 0.2);
          }

          .fc .fc-col-header-cell.fc-day-today {
            background-color: rgba(14, 165, 233, 0.1);
          }

          .fc .fc-timegrid-axis {
            border-right-width: 0px;
          }

          .fc .fc-timegrid-slot-label-cushion,
          .fc .fc-timegrid-axis-cushion {
            font-size: 0.75rem;
            font-weight: 600;
          }

          .fc .fc-event-title {
            font-weight: 500;
            padding: 2px 0;
          }

          .fc .fc-event-time {
            font-size: 0.7rem;
            font-weight: 600;
            opacity: 0.9;
          }

          .fc-timegrid-axis-cushion {
            display: inline-flex;
            align-items: center;
            justify-content: flex-end;
            padding-right: 8px;
            font-variant-numeric: tabular-nums;
          }

          .fc-timegrid-slot-label-frame {
            display: flex;
            align-items: center;
            justify-content: flex-end;
          }

          .fc-timegrid-axis-cushion::after {
            content: " giờ";
            font-size: 0.65rem;
            margin-left: 1px;
          }

          .event-tooltip {
            background-color: white;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            padding: 12px;
            max-width: 300px;
            font-size: 0.85rem;
            border-top: 3px solid #64748b;
          }

          .tooltip-header {
            font-weight: 600;
            font-size: 1rem;
            margin-bottom: 6px;
            color: #1e293b;
            border-bottom: 1px solid #e2e8f0;
            padding-bottom: 6px;
          }

          .tooltip-time {
            margin-bottom: 6px;
            line-height: 1.5;
            color: #334155;
          }

          .tooltip-reason {
            margin-bottom: 6px;
            color: #334155;
          }

          .tooltip-status {
            font-weight: 500;
            padding-top: 6px;
            border-top: 1px solid #e2e8f0;
          }

          .status-approved {
            color: rgb(21, 128, 61);
          }

          .status-pending {
            color: rgb(180, 83, 9);
          }

          .status-rejected {
            color: rgb(185, 28, 28);
          }
        `}</style>
        <div className="p-5">
          {isLoading ? (
            <div className="flex h-[50vh] items-center justify-center">
              <div className="flex flex-col items-center gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <div className="text-base font-medium text-muted-foreground">
                  Đang tải dữ liệu...
                </div>
              </div>
            </div>
          ) : (
            <FullCalendar
              ref={calendarRef}
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
              initialView="timeGridWeek"
              headerToolbar={{
                left: "prev,next today",
                center: "title",
                right: "dayGridMonth,timeGridWeek,timeGridDay",
              }}
              events={events}
              slotMinTime="08:00:00"
              slotMaxTime="17:00:00"
              allDaySlot={false}
              height="auto"
              locale="vi"
              navLinks={true}
              nowIndicator={true}
              businessHours={{
                daysOfWeek: [1, 2, 3, 4, 5],
                startTime: "08:00",
                endTime: "17:00",
              }}
              weekends={true}
              slotDuration="00:15:00"
              slotLabelInterval="01:00"
              slotLabelFormat={{
                hour: "numeric",
                minute: "2-digit",
                omitZeroMinute: true,
                hour12: false,
              }}
              eventTimeFormat={{
                hour: "2-digit",
                minute: "2-digit",
                hour12: false,
              }}
              buttonText={{
                today: "Hôm nay",
                month: "Tháng",
                week: "Tuần",
                day: "Ngày",
                list: "Danh sách",
              }}
              dayHeaderFormat={{
                weekday: "short",
                day: "numeric",
                month: "numeric",
              }}
              eventContent={renderEventContent}
              eventDidMount={eventDidMount}
              eventClick={handleEventClick}
            />
          )}
        </div>
      </Card>

      {selectedLeave && (
        <Dialog
          open={actionDialogOpen}
          onOpenChange={(open) => {
            if (!open) {
              setActionDialogOpen(false);
              setActionType(null);
            }
          }}
        >
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Chi tiết đơn nghỉ phép</DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div className="font-medium">Người xin nghỉ:</div>
                  <div className="col-span-2">
                    {selectedLeave.user?.name || "Không xác định"}
                  </div>

                  <div className="font-medium">Lý do:</div>
                  <div className="col-span-2">{selectedLeave.reason}</div>

                  <div className="font-medium">Từ:</div>
                  <div className="col-span-2">
                    {format(
                      new Date(selectedLeave.startDate),
                      "EEEE, dd/MM/yyyy HH:mm",
                      { locale: vi }
                    )}
                  </div>

                  <div className="font-medium">Đến:</div>
                  <div className="col-span-2">
                    {format(
                      new Date(selectedLeave.endDate),
                      "EEEE, dd/MM/yyyy HH:mm",
                      { locale: vi }
                    )}
                  </div>
                </div>
              </div>
            </div>

            {isAdmin && (
              <DialogFooter className="flex items-center justify-between sm:justify-between">
                <Button
                  variant="outline"
                  onClick={() => setActionDialogOpen(false)}
                  disabled={isActionLoading}
                >
                  Hủy
                </Button>
                <div className="flex gap-2">
                  <Button
                    variant="destructive"
                    onClick={handleRejectLeave}
                    disabled={isActionLoading}
                    className="gap-2"
                  >
                    {isActionLoading && actionType === "reject" ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <X className="h-4 w-4" />
                    )}
                    Hủy đơn nghỉ phép
                  </Button>
                </div>
              </DialogFooter>
            )}
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
