"use client";

import React from "react";
import { Card, CardBody } from "@heroui/react";
import { useProductivityTime } from "../../hooks";
import type { CalendarDate } from "@internationalized/date";
import {
  IconMessage,
  IconUsers,
  IconFileText,
  IconChecklist,
  IconSearch,
  IconCode,
  IconPalette,
  IconChartBar,
  IconVideo,
  IconDots,
} from "@tabler/icons-react";

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

// Category icon mapping
const getCategoryIcon = (category: string) => {
  switch (category) {
    case "Communication":
      return <IconMessage width={16} height={16} />;
    case "Meetings":
      return <IconUsers width={16} height={16} />;
    case "Docs and Writing":
      return <IconFileText width={16} height={16} />;
    case "Productivity and Planning":
      return <IconChecklist width={16} height={16} />;
    case "Browsing and Research":
      return <IconSearch width={16} height={16} />;
    case "Development":
      return <IconCode width={16} height={16} />;
    case "Design and Creative":
      return <IconPalette width={16} height={16} />;
    case "Data and Analytics":
      return <IconChartBar width={16} height={16} />;
    case "Media and Entertainment":
      return <IconVideo width={16} height={16} />;
    case "Other":
      return <IconDots width={16} height={16} />;
    default:
      return <IconDots width={16} height={16} />;
  }
};

// Category icon component (matching ClipboardIcon style)
const CategoryIcon = ({ category }: { category: string }) => (
  <div className="bg-white/10 rounded-md p-1.5 shrink-0">
    <div className="text-foreground/70">{getCategoryIcon(category)}</div>
  </div>
);

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
                  className="flex items-center gap-3"
                >
                  <CategoryIcon category={category} />
                  <span className="text-sm text-foreground flex-1">{category}</span>
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
                  className="flex items-center gap-3"
                >
                  <CategoryIcon category={category} />
                  <span className="text-sm text-foreground flex-1">{category}</span>
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
