"use client";

import * as React from "react";
import ReactDatePicker, { registerLocale } from "react-datepicker";
import { vi } from "date-fns/locale";
import { setHours, setMinutes, isSameDay, getHours, getMinutes } from "date-fns";
import { CalendarIcon, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Label } from "./label";

import "react-datepicker/dist/react-datepicker.css";

// Đăng ký locale tiếng Việt cho date picker
registerLocale("vi", vi);

interface DateTimePickerProps {
  date: Date | undefined;
  setDate: (date: Date | undefined) => void;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  isStartDate?: boolean;
  otherDate?: Date | undefined; // Ngày so sánh (ngày bắt đầu đối với ngày kết thúc hoặc ngược lại)
  minDate?: Date;
  maxDate?: Date;
  className?: string;
  showTimeSelectOnly?: boolean;
}

export function DateTimePicker({
  date,
  setDate,
  label,
  placeholder = "Chọn ngày và giờ",
  disabled = false,
  isStartDate = false,
  otherDate,
  minDate,
  maxDate,
  className,
  showTimeSelectOnly = false,
}: DateTimePickerProps) {
  // Tạo các mốc thời gian cố định từ 8:00 đến 17:00
  const timeOptions = React.useMemo(() => {
    const options: Date[] = [];
    const baseDate = new Date();
    baseDate.setSeconds(0);
    baseDate.setMilliseconds(0);
    
    // Đảm bảo bắt đầu từ 8:00
    const startHour = 8;
    const endHour = 17;
    
    // Tạo danh sách theo từng khung 15 phút
    for (let hour = startHour; hour <= endHour; hour++) {
      // Với mỗi giờ (trừ 17h), thêm mốc 0, 15, 30, 45 phút
      if (hour === endHour) {
        // Với 17h, chỉ thêm mốc 0 phút (17:00)
        const option = new Date(baseDate);
        option.setHours(hour, 0, 0, 0);
        options.push(option);
      } else {
        // Với các giờ khác, thêm mốc 0, 15, 30, 45 phút
        [0, 15, 30, 45].forEach(minute => {
          const option = new Date(baseDate);
          option.setHours(hour, minute, 0, 0);
          options.push(option);
        });
      }
    }
    
    return options;
  }, []);

  // Xử lý filter giờ hợp lệ nếu trong cùng ngày
  const filterTime = React.useCallback(
    (time: Date) => {
      const hours = getHours(time);
      const minutes = getMinutes(time);
      
      // Nếu giờ ngoài giờ làm việc (8-17), không cho chọn
      if (hours < 8 || hours > 17) return false;
      
      // Xử lý trường hợp đặc biệt cho 17:00 (cho phép chọn)
      if (hours === 17 && minutes === 0) return true;
      
      // Nếu sau 17:00, không cho chọn
      if (hours === 17 && minutes > 0) return false;
      
      // Xử lý trường hợp đặc biệt
      if (otherDate && date) {
        // Nếu là date kết thúc và cùng ngày với date bắt đầu
        if (!isStartDate && isSameDay(time, otherDate)) {
          // Chỉ cho phép chọn giờ sau giờ bắt đầu
          if (
            hours < getHours(otherDate) ||
            (hours === getHours(otherDate) && minutes <= getMinutes(otherDate))
          ) {
            return false;
          }
        }
        
        // Nếu là date bắt đầu và cùng ngày với date kết thúc
        if (isStartDate && isSameDay(time, otherDate)) {
          // Chỉ cho phép chọn giờ trước giờ kết thúc
          if (
            hours > getHours(otherDate) ||
            (hours === getHours(otherDate) && minutes >= getMinutes(otherDate))
          ) {
            return false;
          }
        }
      }
      
      return true;
    },
    [isStartDate, otherDate, date]
  );

  // Xử lý filter ngày hợp lệ (không phải cuối tuần)
  const filterDate = React.useCallback((date: Date) => {
    const day = date.getDay();
    // Chỉ cho phép ngày trong tuần T2-T6 (1-5)
    return day !== 0 && day !== 6;
  }, []);

  // Xử lý khi chọn date
  const handleDateChange = (newDate: Date | null) => {
    if (!newDate) {
      setDate(undefined);
      return;
    }
    
    // Nếu không có giờ, thiết lập mặc định là 8:00 cho bắt đầu và 17:00 cho kết thúc
    if (isStartDate && getHours(newDate) === 0 && getMinutes(newDate) === 0) {
      newDate = setHours(setMinutes(newDate, 0), 8);
    } else if (!isStartDate && getHours(newDate) === 0 && getMinutes(newDate) === 0) {
      newDate = setHours(setMinutes(newDate, 0), 17);
    }
    
    setDate(newDate);
  };

  // Tạo các time slot với khoảng cách 15 phút
  const timeIntervals = 15;

  // Custom Input component để styling
  const CustomInput = React.forwardRef<
    HTMLDivElement,
    React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement> & { value?: string }
  >(({ value, onClick, ...props }, ref) => (
    <div
      className={cn(
        "flex items-center justify-between w-full px-3 py-2 text-left font-normal",
        "border border-input bg-background h-10 rounded-md text-sm ring-offset-background",
        "focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2",
        "hover:bg-accent/40 hover:border-primary/30 transition-all cursor-pointer shadow-sm",
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
      onClick={onClick}
      ref={ref}
      {...props}
    >
      <div className="flex items-center gap-2">
        {showTimeSelectOnly ? (
          <Clock className="h-4 w-4 text-primary" />
        ) : (
          <CalendarIcon className="h-4 w-4 text-primary" />
        )}
        <span className={!value ? "text-muted-foreground" : ""}>
          {value || placeholder}
        </span>
      </div>
    </div>
  ));

  CustomInput.displayName = "CustomDatePickerInput";

  return (
    <div className="space-y-2 w-full">
      {label && (
        <Label className="text-sm font-medium flex items-center gap-1.5 text-foreground/90">
          <div className="bg-primary/10 w-5 h-5 rounded-full flex items-center justify-center">
            {showTimeSelectOnly ? (
              <Clock className="h-3 w-3 text-primary" />
            ) : (
              <CalendarIcon className="h-3 w-3 text-primary" />
            )}
          </div>
          {label}
        </Label>
      )}

      <ReactDatePicker
        selected={date}
        onChange={handleDateChange}
        showTimeSelect
        timeIntervals={timeIntervals}
        filterTime={filterTime}
        filterDate={filterDate}
        dateFormat={showTimeSelectOnly ? "HH:mm" : "EEEE, dd/MM/yyyy HH:mm"}
        locale="vi"
        timeCaption="Giờ"
        placeholderText={placeholder}
        minDate={minDate}
        maxDate={maxDate}
        disabled={disabled}
        customInput={<CustomInput />}
        showTimeSelectOnly={showTimeSelectOnly}
        timeFormat="HH:mm"
        popperClassName="react-datepicker-popper"
        popperProps={{
          strategy: "fixed"
        }}
        className="w-full"
        minTime={setHours(setMinutes(new Date(), 0), 8)}
        maxTime={setHours(setMinutes(new Date(), 0), 17)}
        injectTimes={timeOptions}
      />

      <style jsx global>{`
        .react-datepicker-wrapper {
          width: 100%;
        }
        
        .react-datepicker {
          font-family: inherit;
          border: 1px solid #e2e8f0;
          border-radius: 0.5rem;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
          background-color: white;
          font-size: 0.875rem;
          overflow: hidden;
        }
        
        .react-datepicker-popper {
          z-index: 50;
        }
        
        .react-datepicker__header {
          background: linear-gradient(to right, rgba(14, 165, 233, 0.05), rgba(14, 165, 233, 0.1), rgba(14, 165, 233, 0.05));
          border-bottom: 1px solid #e2e8f0;
          padding: 0.75rem;
        }
        
        .react-datepicker__current-month {
          font-weight: 500;
          font-size: 0.95rem;
          margin-bottom: 0.5rem;
          color: #334155;
        }
        
        .react-datepicker__day-name {
          color: #64748b;
          font-weight: 500;
          font-size: 0.75rem;
          margin: 0.2rem;
          width: 2rem;
          text-transform: uppercase;
        }
        
        .react-datepicker__day {
          width: 2rem;
          height: 2rem;
          line-height: 2rem;
          margin: 0.2rem;
          border-radius: 9999px;
          transition: all 0.2s;
        }
        
        .react-datepicker__day:hover:not(.react-datepicker__day--disabled) {
          background-color: rgba(14, 165, 233, 0.1);
          color: #0ea5e9;
        }
        
        .react-datepicker__day--keyboard-selected {
          background-color: rgba(14, 165, 233, 0.1);
          color: #0ea5e9;
        }
        
        .react-datepicker__day--selected {
          background-color: #0ea5e9;
          color: white;
          font-weight: 500;
        }
        
        .react-datepicker__day--selected:hover {
          background-color: #0284c7;
        }
        
        .react-datepicker__day--disabled {
          color: #cbd5e1;
        }
        
        .react-datepicker__navigation {
          top: 0.8rem;
        }
        
        .react-datepicker__triangle {
          display: none;
        }
        
        .react-datepicker__time-container {
          border-left: 1px solid #e2e8f0;
          width: 110px;
        }
        
        .react-datepicker__time-box {
          width: 110px !important;
        }
        
        .react-datepicker__time-list-item {
          height: auto !important;
          padding: 0.5rem 0.75rem !important;
          color: #334155;
          transition: all 0.2s;
          font-size: 0.875rem;
          display: flex;
          justify-content: center;
        }
        
        .react-datepicker__time-list-item:hover:not(.react-datepicker__time-list-item--disabled) {
          background-color: rgba(14, 165, 233, 0.1) !important;
          color: #0ea5e9 !important;
        }
        
        .react-datepicker__time-list-item--selected {
          background-color: #0ea5e9 !important;
          color: white !important;
          font-weight: 500 !important;
        }
        
        .react-datepicker__time-list-item--disabled {
          color: #cbd5e1 !important;
          display: none !important;
        }
        
        .react-datepicker__time-container .react-datepicker__time .react-datepicker__time-box {
          width: 100% !important;
        }
        
        .react-datepicker__time-container .react-datepicker__time {
          background-color: white;
        }
        
        .react-datepicker__time-container .react-datepicker__time .react-datepicker__time-box ul.react-datepicker__time-list::-webkit-scrollbar {
          width: 6px;
        }
        
        .react-datepicker__time-container .react-datepicker__time .react-datepicker__time-box ul.react-datepicker__time-list::-webkit-scrollbar-track {
          background: #f1f5f9;
        }
        
        .react-datepicker__time-container .react-datepicker__time .react-datepicker__time-box ul.react-datepicker__time-list::-webkit-scrollbar-thumb {
          background-color: #cbd5e1;
          border-radius: 3px;
        }
        
        .react-datepicker__time-container .react-datepicker__time .react-datepicker__time-box ul.react-datepicker__time-list::-webkit-scrollbar-thumb:hover {
          background-color: #94a3b8;
        }
        
        /* Khi chỉ hiển thị time select */
        .react-datepicker--time-only {
          width: auto;
        }
        
        .react-datepicker--time-only .react-datepicker__time-container {
          border-left: none;
          width: 140px;
        }
        
        .react-datepicker--time-only .react-datepicker__time {
          border-radius: 0.5rem;
        }
        
        .react-datepicker--time-only .react-datepicker__time-box {
          width: 140px !important;
        }
        
        .react-datepicker__today-button {
          background-color: rgba(14, 165, 233, 0.05);
          border-top: 1px solid #e2e8f0;
          padding: 0.5rem;
          color: #0ea5e9;
          font-weight: 500;
        }
      `}</style>
    </div>
  );
} 