import { Tooltip } from "@heroui/react";
import React from "react";

interface TimelineBarProps {
  startTime: string; // e.g., "09:00"
  endTime: string; // e.g., "17:00"
  breakTimes?: Array<{
    start: string;
    end: string;
    type: "Manual" | "Automatic";
  }>;
  className?: string;
}

const TimelineBar: React.FC<TimelineBarProps> = ({
  startTime,
  endTime,
  breakTimes = [],
  className = "",
}) => {
  // Convert time string to minutes since start of day
  const timeToMinutes = (timeStr: string): number => {
    const [hours, minutes] = timeStr.split(":").map(Number);
    return hours * 60 + minutes;
  };

  const startMinutes = timeToMinutes(startTime);
  const endMinutes = timeToMinutes(endTime);
  const totalMinutes = endMinutes - startMinutes;

  // Calculate position and width percentages for break times
  const getBreakPosition = (breakTime: { start: string; end: string }) => {
    const breakStart = timeToMinutes(breakTime.start);
    const breakEnd = timeToMinutes(breakTime.end);

    const leftPercent = ((breakStart - startMinutes) / totalMinutes) * 100;
    const widthPercent = ((breakEnd - breakStart) / totalMinutes) * 100;

    return {
      left: `${Math.max(0, leftPercent)}%`,
      width: `${widthPercent}%`,
    };
  };

  return (
    <div className={`w-full ${className}`}>
      {/* Timeline bar */}
      <div className="relative w-full h-3 rounded-full overflow-hidden">
        {/* Base timeline */}
        <div className="w-full h-full bg-success opacity-30 rounded-full" />

        {/* Break time overlays */}
        {breakTimes.map((breakTime, index) => {
          const position = getBreakPosition(breakTime);
          const tooltipContent = `${breakTime.type} break: ${breakTime.start} - ${breakTime.end}`;

          return (
            <Tooltip
              key={`break-${index}`}
              content={tooltipContent}
              placement="bottom"
            >
              <div
                className="absolute top-0 h-full bg-success rounded-full"
                style={position}
              />
            </Tooltip>
          );
        })}
      </div>
    </div>
  );
};

export default TimelineBar;
