import { DatePicker } from "@heroui/date-picker";
import { Button, ButtonGroup } from "@heroui/button";
import { Skeleton } from "@heroui/skeleton";
import { parseDate, today, getLocalTimeZone } from "@internationalized/date";
import type { CalendarDate } from "@internationalized/date";
import { IconChevronLeft, IconChevronRight } from "@tabler/icons-react";

interface DateRangePickerProps {
  firstDate: string; // Format: "YYYY-MM-DD"
  lastDate?: string; // Format: "YYYY-MM-DD", optional with default to today
  onChange: (date: CalendarDate) => void;
  value: CalendarDate;
  isLoading?: boolean;
}

function DateRangePicker({
  firstDate,
  lastDate,
  onChange,
  value,
  isLoading = false,
}: DateRangePickerProps) {
  // Parse the first date
  const minDate = parseDate(firstDate);

  // Parse the last date or default to today
  const maxDate = lastDate ? parseDate(lastDate) : today(getLocalTimeZone());

  const handleDateChange = (date: CalendarDate | null) => {
    if (!date) return; // Don't allow null values
    onChange(date);
  };

  const handlePreviousDay = () => {
    if (value) {
      const newDate = value.subtract({ days: 1 });
      handleDateChange(newDate as CalendarDate);
    }
  };

  const handleNextDay = () => {
    if (value) {
      const newDate = value.add({ days: 1 });
      handleDateChange(newDate as CalendarDate);
    }
  };

  // Check if buttons should be disabled
  const isPreviousDisabled = value ? value.compare(minDate) <= 0 : true;
  const isNextDisabled = value ? value.compare(maxDate) >= 0 : true;

  // Preset date functions
  const handleToday = () => {
    const todayDate = today(getLocalTimeZone());
    handleDateChange(todayDate);
  };

  const handleYesterday = () => {
    const yesterday = today(getLocalTimeZone()).subtract({ days: 1 });
    handleDateChange(yesterday);
  };

  const handleLastWeek = () => {
    const lastWeek = today(getLocalTimeZone()).subtract({ weeks: 1 });
    handleDateChange(lastWeek);
  };

  // Check if preset dates are available
  const todayDate = today(getLocalTimeZone());
  const yesterday = todayDate.subtract({ days: 1 });
  const lastWeek = todayDate.subtract({ weeks: 1 });

  const isTodayDisabled =
    todayDate.compare(minDate) < 0 || todayDate.compare(maxDate) > 0;
  const isYesterdayDisabled =
    yesterday.compare(minDate) < 0 || yesterday.compare(maxDate) > 0;
  const isLastWeekDisabled =
    lastWeek.compare(minDate) < 0 || lastWeek.compare(maxDate) > 0;

  // Check if preset dates match the selected value
  const isTodaySelected = value?.compare(todayDate) === 0;
  const isYesterdaySelected = value?.compare(yesterday) === 0;
  const isLastWeekSelected = value?.compare(lastWeek) === 0;

  if (isLoading) {
    return (
      <div className="flex items-center gap-2">
        <Skeleton className="w-8 h-8 rounded-lg" />
        <Skeleton className="w-32 h-10 rounded-lg" />
        <Skeleton className="w-8 h-8 rounded-lg" />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <Button
        isIconOnly
        variant="light"
        onPress={handlePreviousDay}
        isDisabled={isPreviousDisabled}
        aria-label="Previous day"
      >
        <IconChevronLeft size={18} />
      </Button>
      <DatePicker
        minValue={minDate}
        maxValue={maxDate}
        value={value}
        defaultValue={today(getLocalTimeZone())}
        onChange={handleDateChange}
        className="max-w-32"
        aria-label="Select date"
        CalendarTopContent={
          <ButtonGroup
            fullWidth
            className="px-3 pb-2 pt-3 bg-content1"
            radius="full"
            size="sm"
          >
            <Button
              onPress={handleToday}
              isDisabled={isTodayDisabled}
              variant={isTodaySelected ? "solid" : "bordered"}
              color={isTodaySelected ? "primary" : "default"}
            >
              Today
            </Button>
            <Button
              onPress={handleYesterday}
              isDisabled={isYesterdayDisabled}
              variant={isYesterdaySelected ? "solid" : "bordered"}
              color={isYesterdaySelected ? "primary" : "default"}
            >
              Yesterday
            </Button>
            <Button
              onPress={handleLastWeek}
              isDisabled={isLastWeekDisabled}
              variant={isLastWeekSelected ? "solid" : "bordered"}
              color={isLastWeekSelected ? "primary" : "default"}
            >
              Last week
            </Button>
          </ButtonGroup>
        }
      />
      <Button
        variant="light"
        isIconOnly
        onPress={handleNextDay}
        isDisabled={isNextDisabled}
        aria-label="Next day"
      >
        <IconChevronRight size={18} />
      </Button>
    </div>
  );
}

export default DateRangePicker;
