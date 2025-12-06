import React, { lazy, Suspense, useMemo } from "react";
import { Card, CardBody } from "@heroui/card";
import { Divider } from "@heroui/divider";
import { Spinner } from "@heroui/react";
import type { CalendarDate } from "@internationalized/date";
import { today, getLocalTimeZone } from "@internationalized/date";
import DateRangePicker from "./DateRangePicker";
import CustomTooltip from "./CustomTooltip";

// Create a lazy-loaded chart component that imports recharts internally
const LazyChart = lazy(() =>
  import("recharts").then((recharts) => {
    const ChartComponent = ({
      data,
    }: {
      data: Array<{
        timestamp: string;
        focus: number | null;
        strain: number | null;
        energy: number | null;
      }>;
    }) => (
      <recharts.ResponsiveContainer width="100%" height="100%">
        <recharts.LineChart
          data={data}
          margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
        >
          <recharts.CartesianGrid strokeDasharray="3 3" />
          <recharts.XAxis
            dataKey="timestamp"
            tickFormatter={(timestamp: string) => {
              const date = new Date(timestamp);
              const hours = date.getUTCHours().toString().padStart(2, "0");
              const minutes = date.getUTCMinutes();
              const minutesStr = minutes.toString().padStart(2, "0");
              // Show timestamps at hour intervals only
              return minutes === 0 ? `${hours}:${minutesStr}` : "";
            }}
            tick={{ fontSize: 10 }}
            interval="preserveStartEnd"
          />
          <recharts.YAxis
            domain={[0, 100]}
            ticks={[0, 20, 40, 60, 80, 100]}
            tick={{ fontSize: 12 }}
          />
          <recharts.Tooltip content={<CustomTooltip />} />
          <recharts.Line
            type="natural"
            dataKey="focus"
            stroke="#3b82f6"
            strokeWidth={3}
            dot={true}
            activeDot={{ r: 6 }}
            name="Focus"
            connectNulls={false}
          />
          <recharts.Line
            type="natural"
            dataKey="strain"
            stroke="#ef4444"
            strokeWidth={3}
            dot={true}
            activeDot={{ r: 6 }}
            name="Strain"
            connectNulls={false}
          />
          <recharts.Line
            type="natural"
            dataKey="energy"
            stroke="#10b981"
            strokeWidth={3}
            dot={true}
            activeDot={{ r: 6 }}
            name="Energy"
            connectNulls={false}
          />
        </recharts.LineChart>
      </recharts.ResponsiveContainer>
    );
    return { default: ChartComponent };
  })
);

const METRIC_COLORS = {
  focus: "#3b82f6",
  strain: "#ef4444",
  energy: "#10b981",
};

const METRICS = [
  { name: "Focus", color: METRIC_COLORS.focus, key: "focus" },
  { name: "Strain", color: METRIC_COLORS.strain, key: "strain" },
  { name: "Energy", color: METRIC_COLORS.energy, key: "energy" },
] as const;

interface CognitiveLoadChartProps {
  data: Array<{
    timestamp: string;
    focus: number;
    strain: number;
    energy: number;
  }>;
  missingData: Array<{
    timestamp: string;
    score_total: number | null;
    score_focus: number | null;
    score_strain: number | null;
    score_energy: number | null;
  }>;
  selectedDate: CalendarDate;
  onDateChange: (date: CalendarDate) => void;
  firstDate: string;
  isLoading?: boolean;
}

const CognitiveLoadChart: React.FC<CognitiveLoadChartProps> = ({
  data,
  missingData,
  selectedDate,
  onDateChange,
  firstDate,
  isLoading = false,
}) => {
  // Determine if the selected date is today
  const todayDate = today(getLocalTimeZone());
  const isToday = selectedDate.compare(todayDate) === 0;

  // Merge data with missing data and sort by timestamp
  const mergedData = useMemo(() => {
    // Transform actual data
    const transformedData = data.map((item) => ({
      timestamp: item.timestamp,
      focus: item.focus,
      strain: item.strain,
      energy: item.energy,
    }));

    // Transform missing data with null values
    const transformedMissing = missingData.map((item) => ({
      timestamp: item.timestamp,
      focus: null,
      strain: null,
      energy: null,
    }));

    // Combine and sort by timestamp
    const combined = [...transformedData, ...transformedMissing];
    combined.sort(
      (a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    return combined;
  }, [data, missingData]);

  // Define the header component once
  const chartHeader = useMemo(
    () => (
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-default-700">
          Your daily mental performance
        </h2>
        <DateRangePicker
          firstDate={firstDate}
          isLoading={isLoading}
          value={selectedDate}
          onChange={onDateChange}
        />
      </div>
    ),
    [firstDate, isLoading, selectedDate, onDateChange]
  );

  // Define the legend component once
  const chartLegend = useMemo(
    () => (
      <>
        <Divider className="my-4" />
        <div className="flex justify-center gap-6">
          {METRICS.map((metric) => (
            <div key={metric.key} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: metric.color }}
              ></div>
              <span className="text-sm text-default-600">{metric.name}</span>
            </div>
          ))}
        </div>
      </>
    ),
    []
  );

  // Show loading state
  if (isLoading) {
    return (
      <Card className="p-4">
        <CardBody className="pt-4">
          {chartHeader}
          <div className="flex items-center justify-center h-64">
            <Spinner size="lg" label="Loading dashboard data..." />
          </div>
          {chartLegend}
        </CardBody>
      </Card>
    );
  }

  // Check if there's no data or empty array
  if (!data || data.length === 0) {
    return (
      <Card className="p-4">
        <CardBody className="pt-4">
          {chartHeader}
          <div className="h-64 flex items-center justify-center">
            <div className="text-center space-y-4 max-w-md mx-auto">
              {/* Icon with subtle animation */}
              <div className={`inline-block ${isToday ? "animate-pulse" : ""}`}>
                <svg
                  className="w-16 h-16 mx-auto text-default-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>

              {/* Main message */}
              <div>
                <h3 className="text-lg font-semibold text-default-700 mb-2">
                  No Data Available
                </h3>
                <p className="text-sm text-default-500">
                  {isToday
                    ? "There's no cognitive load data for today, yet."
                    : "There's no cognitive load data recorded for the selected date."}
                </p>
              </div>
            </div>
          </div>
          {chartLegend}
        </CardBody>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <CardBody className="pt-4">
        {chartHeader}
        <div className="h-64">
          <Suspense
            fallback={
              <div className="flex items-center justify-center h-full">
                <Spinner size="lg" label="Loading chart..." />
              </div>
            }
          >
            <LazyChart data={mergedData} />
          </Suspense>
        </div>
        {chartLegend}
      </CardBody>
    </Card>
  );
};

export default CognitiveLoadChart;
