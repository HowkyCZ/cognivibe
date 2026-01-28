"use client";

import React from "react";
import { Card, CardBody } from "@heroui/react";
import { useProductivityTime } from "../../hooks";
import type { CalendarDate } from "@internationalized/date";

const categories = [
  // Column 1
  "Communication",
  "Meetings",
  "Docs and Writing",
  "Productivity and Planning",
  "Browsing and Research",
  // Column 2
  "Development",
  "Design and Creative",
  "Data and Analytics",
  "Media and Entertainment",
  "Other",
];

/**
 * Formats minutes as HH:MM
 * @param minutes - Number of minutes
 * @returns Formatted string (e.g., "01:45" for 105 minutes)
 */
function formatMinutesToHHMM(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
}

interface ProductivityTimeCardProps {
  selectedDate: CalendarDate;
}

const ProductivityTimeCard = ({ selectedDate }: ProductivityTimeCardProps) => {
  const { categoryCounts, loading } = useProductivityTime(selectedDate);
  const column1 = categories.slice(0, 5);
  const column2 = categories.slice(5, 10);

  return (
    <Card className="w-full h-full bg-content1 border border-white/10 hover:border-white/15 transition-colors">
      <CardBody className="p-6">
        <h2 className="text-2xl font-semibold text-foreground text-left mb-6">
          Productivity time
        </h2>
        <div className="grid grid-cols-2 gap-6">
          {/* Column 1 */}
          <div className="flex flex-col gap-4">
            {column1.map((category) => {
              const minutes = categoryCounts[category] || 0;
              const formattedTime = formatMinutesToHHMM(minutes);
              return (
                <div
                  key={category}
                  className="flex items-center gap-2"
                >
                  <span className="text-sm text-foreground">{category}</span>
                  <span className="text-sm text-foreground/60">
                    {loading ? "..." : formattedTime}
                  </span>
                </div>
              );
            })}
          </div>
          {/* Column 2 */}
          <div className="flex flex-col gap-4">
            {column2.map((category) => {
              const minutes = categoryCounts[category] || 0;
              const formattedTime = formatMinutesToHHMM(minutes);
              return (
                <div
                  key={category}
                  className="flex items-center gap-2"
                >
                  <span className="text-sm text-foreground">{category}</span>
                  <span className="text-sm text-foreground/60">
                    {loading ? "..." : formattedTime}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </CardBody>
    </Card>
  );
};

export default ProductivityTimeCard;
