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
    type GapSegment = { x1: number; y1: number; x2: number; y2: number };
    const ChartComponent = ({
      data,
      gapSegments,
      xTicks,
      xDomainStart,
    }: {
      data: Array<{
        x: number;
        timestamp: string;
        load: number | null;
        focus?: number | null;
        strain?: number | null;
        energy?: number | null;
      }>;
      gapSegments: GapSegment[];
      xTicks: number[];
      xDomainStart: number;
    }) => (
      <recharts.ResponsiveContainer width="100%" height="100%">
        <recharts.LineChart
          data={data}
          margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
        >
          <recharts.CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
            stroke="rgba(255,255,255,0.12)"
          />
          <recharts.XAxis
            dataKey="x"
            type="number"
            scale="time"
            domain={[xDomainStart, "dataMax"]}
            ticks={xTicks}
            interval={0}
            tickFormatter={(ms: number) => `${new Date(ms).getUTCHours()}:00`}
            tick={{ fontSize: 10 }}
            axisLine={false}
            tickLine={false}
          />
          <recharts.YAxis
            domain={[0, 100]}
            ticks={[0, 20, 40, 60, 80, 100]}
            tick={{ fontSize: 12 }}
            axisLine={false}
            tickLine={false}
          />
          <recharts.Tooltip content={<CustomTooltip />} />
          {gapSegments.map((seg, idx) => (
            <recharts.ReferenceLine
              // eslint-disable-next-line react/no-array-index-key
              key={idx}
              segment={[
                { x: seg.x1, y: seg.y1 },
                { x: seg.x2, y: seg.y2 },
              ]}
              stroke={COGNITIVE_LOAD_COLOR}
              strokeDasharray="6 6"
              strokeWidth={2}
              isFront={true}
            />
          ))}
          <recharts.Line
            type="natural"
            dataKey="load"
            stroke="#5C78FD"
            strokeWidth={3}
            dot={false}
            activeDot={{ r: 6 }}
            name="Cognitive Load"
            connectNulls={false}
          />
        </recharts.LineChart>
      </recharts.ResponsiveContainer>
    );
    return { default: ChartComponent };
  }),
);

const COGNITIVE_LOAD_COLOR = "#5C78FD";
const LEGEND_ITEM = { name: "Cognitive Load", color: COGNITIVE_LOAD_COLOR };

interface CognitiveLoadChartProps {
  data: Array<{
    timestamp: string;
    load: number;
    focus: number;
    strain: number;
    energy: number;
  }>;
  selectedDate: CalendarDate;
  onDateChange: (date: CalendarDate) => void;
  firstDate: string;
  isLoading?: boolean;
}

const CognitiveLoadChart: React.FC<CognitiveLoadChartProps> = ({
  data,
  selectedDate,
  onDateChange,
  firstDate,
  isLoading = false,
}) => {
  // Determine if the selected date is today
  const todayDate = today(getLocalTimeZone());
  const isToday = selectedDate.compare(todayDate) === 0;

  const parseTimestampMs = (timestamp: string): number | null => {
    const direct = Date.parse(timestamp);
    if (!Number.isNaN(direct)) return direct;

    // Fallback for space-separated timestamps (e.g. "YYYY-MM-DD HH:MM:SS")
    if (timestamp.includes(" ") && !timestamp.includes("T")) {
      const normalized = `${timestamp.replace(" ", "T")}Z`;
      const parsed = Date.parse(normalized);
      if (!Number.isNaN(parsed)) return parsed;
    }

    return null;
  };

  // Use only actual data points so the chart domain starts at the first entry
  const { chartData, gapSegments, xTicks, xDomainStart } = useMemo(() => {
    const ONE_HOUR_MS = 60 * 60 * 1000;
    const GAP_THRESHOLD_MS = 7 * 60 * 1000;

    type ChartDatum = {
      x: number;
      timestamp: string;
      load: number | null;
      focus: number | null;
      strain: number | null;
      energy: number | null;
    };

    const points = data
      .map((item) => {
        const x = parseTimestampMs(item.timestamp);
        if (x === null) return null;
        return {
          x,
          timestamp: item.timestamp,
          load: item.load,
          focus: item.focus,
          strain: item.strain,
          energy: item.energy,
        } satisfies ChartDatum;
      })
      .filter((v): v is NonNullable<typeof v> => v !== null)
      .sort((a, b) => a.x - b.x);

    const buildHourTicks = (xs: number[]): { xTicks: number[]; xDomainStart: number } => {
      if (xs.length === 0) return { xTicks: [], xDomainStart: 0 };

      const startHourMs = Math.floor(xs[0] / ONE_HOUR_MS) * ONE_HOUR_MS;
      const endHourMs = Math.floor(xs[xs.length - 1] / ONE_HOUR_MS) * ONE_HOUR_MS;

      const allHourTicks: number[] = [];
      for (let t = startHourMs; t <= endHourMs; t += ONE_HOUR_MS) {
        allHourTicks.push(t);
      }

      const selectEvenlySpaced = (ticks: number[], desiredCount: number): number[] => {
        if (ticks.length <= desiredCount) return ticks;
        if (desiredCount <= 2) return [ticks[0], ticks[ticks.length - 1]];

        const lastIdx = ticks.length - 1;
        const selectedIndices = Array.from({ length: desiredCount }, (_, i) =>
          Math.floor((i * lastIdx) / (desiredCount - 1)),
        );

        const uniqueSorted = Array.from(new Set(selectedIndices)).sort((a, b) => a - b);
        // Safety: ensure endpoints are present.
        if (uniqueSorted[0] !== 0) uniqueSorted.unshift(0);
        if (uniqueSorted[uniqueSorted.length - 1] !== lastIdx) uniqueSorted.push(lastIdx);

        return uniqueSorted.map((idx) => ticks[idx]);
      };

      const chooseDisplayedTicks = (ticks: number[]): number[] => {
        if (ticks.length <= 5) return ticks;

        const middleHoursCount = ticks.length - 2;
        const desiredCount = middleHoursCount % 2 === 0 ? 4 : 5;
        return selectEvenlySpaced(ticks, desiredCount);
      };

      return { xTicks: chooseDisplayedTicks(allHourTicks), xDomainStart: startHourMs };
    };

    const { xTicks, xDomainStart } = buildHourTicks(points.map((p) => p.x));

    const gaps: Array<{ x1: number; y1: number; x2: number; y2: number }> = [];
    const stitched: ChartDatum[] = [];

    for (let i = 0; i < points.length; i++) {
      const current = points[i];
      stitched.push(current);

      const next = points[i + 1];
      if (!next) continue;

      const delta = next.x - current.x;
      if (delta > GAP_THRESHOLD_MS && current.load != null && next.load != null) {
        gaps.push({ x1: current.x, y1: current.load, x2: next.x, y2: next.load });

        // Insert a null point right after the last known point so the solid line breaks.
        stitched.push({
          x: current.x + 1,
          timestamp: new Date(current.x + 1).toISOString(),
          load: null,
          focus: null,
          strain: null,
          energy: null,
        });
      }
    }

    return { chartData: stitched, gapSegments: gaps, xTicks, xDomainStart };
  }, [data]);

  // Define the header component once
  const chartHeader = useMemo(
    () => (
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-foreground">
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
    [firstDate, isLoading, selectedDate, onDateChange],
  );

  // Define the legend component once
  const chartLegend = useMemo(
    () => (
      <>
        <Divider className="my-4" />
        <div className="flex justify-center gap-6">
          <div className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: LEGEND_ITEM.color }}
            ></div>
            <span className="text-sm text-foreground/60">
              {LEGEND_ITEM.name}
            </span>
          </div>
        </div>
      </>
    ),
    [],
  );

  // Show loading state
  if (isLoading) {
    return (
      <Card className="p-4 bg-content1 border border-white/10 hover:border-white/15 transition-colors">
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
      <Card className="p-4 bg-content1 border border-white/10 hover:border-white/15 transition-colors">
        <CardBody className="pt-4">
          {chartHeader}
          <div className="h-64 flex items-center justify-center">
            <div className="text-center space-y-4 max-w-md mx-auto">
              {/* Icon with subtle animation */}
              <div className={`inline-block ${isToday ? "animate-pulse" : ""}`}>
                <svg
                  className="w-16 h-16 mx-auto text-foreground/30"
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
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  No Data Available
                </h3>
                <p className="text-sm text-foreground/60">
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
    <Card className="p-4 bg-content1 border border-white/10 hover:border-white/15 transition-colors">
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
            <LazyChart
              data={chartData}
              gapSegments={gapSegments}
              xTicks={xTicks}
              xDomainStart={xDomainStart}
            />
          </Suspense>
        </div>
        {chartLegend}
      </CardBody>
    </Card>
  );
};

export default CognitiveLoadChart;
