import React, { lazy, Suspense, useMemo } from "react";
import { Card, CardBody } from "@heroui/card";
import { Spinner } from "@heroui/react";
import type { CalendarDate } from "@internationalized/date";
import { today, getLocalTimeZone } from "@internationalized/date";
import DateRangePicker from "./DateRangePicker";
import CustomTooltip from "./CustomTooltip";
import SessionBars from "./SessionBars";
import coffeeMugIcon from "../../../assets/coffeemug.png";

// Create a lazy-loaded chart component that imports recharts internally
const LazyChart = lazy(() =>
  import("recharts").then((recharts) => {
    type GapSegment = { 
      x1: number; 
      y1: number; 
      x2: number; 
      y2: number; 
      color: string;
    };
    type LineSegment = {
      data: Array<{ x: number; load: number | null; timestamp: string; focus: number | null; strain: number | null; energy: number | null }>;
      color: string;
    };
    type AreaSegment = {
      data: Array<{ x: number; load: number | null; timestamp: string; focus: number | null; strain: number | null; energy: number | null }>;
      color: string;
      isGap?: boolean;
    };
    // Component to render horizontal lines and images in gaps
    const GapMarkers = (props: any) => {
      const { gapSegments } = props;
      const { xAxisMap, yAxisMap } = props;
      
      if (!xAxisMap || !yAxisMap || !gapSegments || gapSegments.length === 0) return null;

      const LINE_HEIGHT_PX = 5; // 1px thicker than line chart (which is 4px)
      const IMAGE_PADDING_PX = 2; // 2px on each side (back to original)
      const BOTTOM_OFFSET_PX = 8; // 8px above bottom axis
      const MIN_GAP_WIDTH_FOR_IMAGE = 25; // Minimum gap width in pixels to show image (reduced from 40px)
      const IMAGE_SIZE_MULTIPLIER = 1.75; // Multiplier to make image bigger (1.75x of original)
      const IMAGE_BOTTOM_PADDING = 2; // Extra padding at bottom to center bottom-heavy image

      // Get scales from axis maps
      const xAxis = Object.values(xAxisMap)[0] as any;
      const yAxis = Object.values(yAxisMap)[0] as any;
      
      if (!xAxis || !yAxis) return null;

      const xScale = xAxis.scale;
      const yScale = yAxis.scale;

      // Calculate Y position (8px above bottom, which is at load=0)
      const bottomY = yScale(0);
      const lineY = bottomY - BOTTOM_OFFSET_PX;

      // Image dimensions - 1.75x of original size
      const baseHeight = LINE_HEIGHT_PX + (IMAGE_PADDING_PX * 2);
      const imageHeight = baseHeight * IMAGE_SIZE_MULTIPLIER;
      // Assuming aspect ratio from the image - we'll use a reasonable width
      // The image appears to be roughly square or slightly wider, so let's use height * 1.1
      const imageWidth = imageHeight * 1.1;

      return (
        <g>
          {gapSegments.map((gap: GapSegment, idx: number) => {
            const x1 = xScale(gap.x1);
            const x2 = xScale(gap.x2);
            const gapWidth = Math.abs(x2 - x1);
            const centerX = (x1 + x2) / 2;
            const showImage = gapWidth >= MIN_GAP_WIDTH_FOR_IMAGE;

            return (
              <g key={`gap-marker-${idx}`}>
                {/* Horizontal line */}
                <line
                  x1={x1}
                  y1={lineY}
                  x2={x2}
                  y2={lineY}
                  stroke="#5C78FD"
                  strokeWidth={LINE_HEIGHT_PX}
                  strokeLinecap="round"
                />
                {/* Image if gap is wide enough */}
                {showImage && (
                  <image
                    x={centerX - imageWidth / 2}
                    y={lineY - imageHeight / 2 - IMAGE_BOTTOM_PADDING}
                    width={imageWidth}
                    height={imageHeight}
                    href={coffeeMugIcon}
                    preserveAspectRatio="xMidYMid meet"
                  />
                )}
              </g>
            );
          })}
        </g>
      );
    };

    const ChartComponent = ({
      data,
      gapSegments,
      xTicks,
      xDomainStart,
      xDomainEnd,
      lineSegments,
      areaSegments,
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
      xDomainEnd: number;
      lineSegments: LineSegment[];
      areaSegments: AreaSegment[];
    }) => {
      return (
        <recharts.ResponsiveContainer width="100%" height="100%">
          <recharts.ComposedChart
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
              domain={[xDomainStart, xDomainEnd]}
              ticks={xTicks}
              interval={0}
              tickFormatter={(ms: number) => `${new Date(ms).getUTCHours()}:00`}
              tick={{ fontSize: 10 }}
              axisLine={false}
              tickLine={false}
            />
            <recharts.YAxis
              domain={[0, 100]}
              ticks={[20, 40, 60, 80, 100]}
              tick={{ fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <recharts.Tooltip content={<CustomTooltip />} />
            <defs>
              {areaSegments.map((segment, idx) => {
                return (
                  <linearGradient
                    key={`gradient-${idx}`}
                    id={`areaGradient-${idx}`}
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="0%" stopColor={segment.color} stopOpacity={0.08} />
                    <stop offset="100%" stopColor={segment.color} stopOpacity={0} />
                  </linearGradient>
                );
              })}
            </defs>
            {areaSegments.map((segment, idx) => (
              <recharts.Area
                key={`area-segment-${idx}`}
                type="natural"
                dataKey="load"
                data={segment.data}
                stroke="none"
                fill={`url(#areaGradient-${idx})`}
                baseValue={0}
                connectNulls={false}
                isAnimationActive={false}
              />
            ))}
            {gapSegments.map((seg, idx) => (
              <recharts.Line
                // eslint-disable-next-line react/no-array-index-key
                key={`gap-segment-${idx}`}
                type="linear"
                dataKey="load"
                data={[
                  { x: seg.x1, load: seg.y1 },
                  { x: seg.x2, load: seg.y2 },
                ]}
                stroke={seg.color}
                strokeWidth={4}
                strokeDasharray="6 6"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeOpacity={0.5}
                dot={false}
                activeDot={false}
                connectNulls={false}
                isAnimationActive={false}
              />
            ))}
            <recharts.Customized component={GapMarkers} gapSegments={gapSegments} />
            {lineSegments.map((segment, idx) => (
              <recharts.Line
                key={`line-segment-${idx}`}
                type="natural"
                dataKey="load"
                data={segment.data}
                stroke={segment.color}
                strokeWidth={4}
                strokeLinecap="round"
                strokeLinejoin="round"
                dot={false}
                activeDot={{ r: 6 }}
                connectNulls={false}
                isAnimationActive={false}
              />
            ))}
          </recharts.ComposedChart>
        </recharts.ResponsiveContainer>
      );
    };
    return { default: ChartComponent };
  }),
);

// Color interpolation helper
const hexToRgb = (hex: string): [number, number, number] => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? [
        parseInt(result[1], 16),
        parseInt(result[2], 16),
        parseInt(result[3], 16),
      ]
    : [92, 120, 253];
};

const rgbToHex = (r: number, g: number, b: number): string => {
  return `#${[r, g, b].map((x) => x.toString(16).padStart(2, "0")).join("")}`;
};

const interpolateColor = (
  value: number,
  min: number,
  max: number,
  color1: string,
  color2: string,
): string => {
  const ratio = (value - min) / (max - min);
  const [r1, g1, b1] = hexToRgb(color1);
  const [r2, g2, b2] = hexToRgb(color2);
  const r = Math.round(r1 + (r2 - r1) * ratio);
  const g = Math.round(g1 + (g2 - g1) * ratio);
  const b = Math.round(b1 + (b2 - b1) * ratio);
  return rgbToHex(r, g, b);
};

const getLoadColor = (load: number): string => {
  if (load <= 20) return "#5C78FD";
  if (load <= 40) return interpolateColor(load, 20, 40, "#5C78FD", "#A07CEF");
  if (load <= 60) return "#A07CEF";
  if (load <= 80) return interpolateColor(load, 60, 80, "#A07CEF", "#FF709B");
  return "#FF709B";
};

interface SessionData {
  id: string;
  timestamp_start: string;
  timestamp_end: string;
  length: number;
  score_total: number | null;
  category_share: Record<string, number>;
}

interface CognitiveLoadChartProps {
  data: Array<{
    timestamp: string;
    load: number;
    focus: number;
    strain: number;
    energy: number;
  }>;
  sessions?: SessionData[];
  selectedDate: CalendarDate;
  onDateChange: (date: CalendarDate) => void;
  firstDate: string;
  isLoading?: boolean;
}

const CognitiveLoadChart: React.FC<CognitiveLoadChartProps> = ({
  data,
  sessions = [],
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
  const {
    chartData,
    gapSegments,
    xTicks,
    xDomainStart,
    xDomainEnd,
    lineSegments,
    areaSegments,
  } = useMemo(() => {
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

    const buildHourTicks = (xs: number[]): { xTicks: number[]; xDomainStart: number; xDomainEnd: number } => {
      if (xs.length === 0) return { xTicks: [], xDomainStart: 0, xDomainEnd: 0 };

      const startHourMs = Math.floor(xs[0] / ONE_HOUR_MS) * ONE_HOUR_MS;
      const endHourMs = Math.ceil(xs[xs.length - 1] / ONE_HOUR_MS) * ONE_HOUR_MS;

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

      return { xTicks: chooseDisplayedTicks(allHourTicks), xDomainStart: startHourMs, xDomainEnd: endHourMs };
    };

    const { xTicks, xDomainStart, xDomainEnd } = buildHourTicks(points.map((p) => p.x));

    const gaps: Array<{ x1: number; y1: number; x2: number; y2: number; color: string }> = [];
    const stitched: ChartDatum[] = [];

    for (let i = 0; i < points.length; i++) {
      const current = points[i];
      stitched.push(current);

      const next = points[i + 1];
      if (!next) continue;

      const delta = next.x - current.x;
      if (delta > GAP_THRESHOLD_MS && current.load != null && next.load != null) {
        // Calculate gradient color for gap (average/interpolated between start and end)
        const avgLoad = (current.load + next.load) / 2;
        const gapColor = getLoadColor(avgLoad);
        
        gaps.push({ 
          x1: current.x, 
          y1: current.load, 
          x2: next.x, 
          y2: next.load,
          color: gapColor,
        });

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

    // Create line segments for gradient coloring
    // Each segment includes overlapping points (prev, current, next) for smooth connections
    type LineSegment = {
      data: Array<{ x: number; load: number | null; timestamp: string; focus: number | null; strain: number | null; energy: number | null }>;
      color: string;
    };
    const segments: LineSegment[] = [];

    for (let i = 0; i < stitched.length - 1; i++) {
      const current = stitched[i];
      const next = stitched[i + 1];

      // Skip if either point has null load (gap)
      if (current.load == null || next.load == null) {
        continue;
      }

      // Create a segment with overlapping points for smooth connection
      // But avoid overlapping at boundaries (start, end, before/after gaps)
      const segmentData: Array<{ x: number; load: number | null; timestamp: string; focus: number | null; strain: number | null; energy: number | null }> = [];
      
      // Check if we're at a boundary (start, end, or before/after a gap)
      const isAtStart = i === 0;
      const isAtEnd = i === stitched.length - 2;
      const hasGapBefore = i > 0 && stitched[i - 1].load == null;
      const hasGapAfter = i < stitched.length - 2 && stitched[i + 2].load == null;
      
      // Include previous point only if not at start and not before a gap
      if (!isAtStart && !hasGapBefore && stitched[i - 1].load != null) {
        const prev = stitched[i - 1];
        segmentData.push({ 
          x: prev.x, 
          load: prev.load,
          timestamp: prev.timestamp,
          focus: prev.focus,
          strain: prev.strain,
          energy: prev.energy,
        });
      }
      
      // Include current and next points
      segmentData.push({ 
        x: current.x, 
        load: current.load,
        timestamp: current.timestamp,
        focus: current.focus,
        strain: current.strain,
        energy: current.energy,
      });
      segmentData.push({ 
        x: next.x, 
        load: next.load,
        timestamp: next.timestamp,
        focus: next.focus,
        strain: next.strain,
        energy: next.energy,
      });
      
      // Include next point only if not at end and not after a gap
      if (!isAtEnd && !hasGapAfter && i < stitched.length - 2 && stitched[i + 2].load != null) {
        const nextNext = stitched[i + 2];
        segmentData.push({ 
          x: nextNext.x, 
          load: nextNext.load,
          timestamp: nextNext.timestamp,
          focus: nextNext.focus,
          strain: nextNext.strain,
          energy: nextNext.energy,
        });
      }

      // Calculate color based on average load of current and next
      const avgLoad = (current.load + next.load) / 2;
      const segmentColor = getLoadColor(avgLoad);

      segments.push({
        data: segmentData,
        color: segmentColor,
      });
    }

    // Create area segments matching line segments
    // Extend segments slightly at gap boundaries to prevent vertical lines
    const EPSILON_MS = 0.1; // Small extension to prevent vertical edges
    
    const areaSegments: Array<{ data: Array<{ x: number; load: number | null; timestamp: string; focus: number | null; strain: number | null; energy: number | null }>; color: string }> = segments.map(segment => {
      const extendedData = [...segment.data];
      
      // Extend first point slightly backward if it's before a gap
      if (extendedData.length > 0) {
        const firstPoint = extendedData[0];
        const firstIndex = stitched.findIndex(p => p.x === firstPoint.x);
        const hasGapBefore = firstIndex > 0 && stitched[firstIndex - 1]?.load == null;
        
        if (hasGapBefore) {
          extendedData.unshift({
            ...firstPoint,
            x: firstPoint.x - EPSILON_MS,
          });
        }
      }
      
      // Extend last point slightly forward if it's after a gap
      if (extendedData.length > 0) {
        const lastPoint = extendedData[extendedData.length - 1];
        const lastIndex = stitched.findIndex(p => p.x === lastPoint.x);
        const hasGapAfter = lastIndex < stitched.length - 1 && stitched[lastIndex + 1]?.load == null;
        
        if (hasGapAfter) {
          extendedData.push({
            ...lastPoint,
            x: lastPoint.x + EPSILON_MS,
          });
        }
      }
      
      return {
        data: extendedData,
        color: segment.color,
      };
    });

    // Create area segments for gaps using the same structure as regular segments
    // Create multiple overlapping segments to match the gradient effect of regular segments
    const gapAreaSegments: Array<{ data: Array<{ x: number; load: number | null; timestamp: string; focus: number | null; strain: number | null; energy: number | null }>; color: string; isGap: boolean }> = [];
    
    gaps.forEach(gap => {
      // Find the points before and after the gap in stitched data
      const gapStartIndex = stitched.findIndex(p => p.x === gap.x1);
      const gapEndIndex = stitched.findIndex(p => p.x === gap.x2);
      
      // Create points along the gap for gradient effect
      const startPoint = {
        x: gap.x1,
        load: gap.y1,
        timestamp: new Date(gap.x1).toISOString(),
        focus: null,
        strain: null,
        energy: null,
      };
      
      const midX = (gap.x1 + gap.x2) / 2;
      const midY = (gap.y1 + gap.y2) / 2;
      const midPoint = {
        x: midX,
        load: midY,
        timestamp: new Date(midX).toISOString(),
        focus: null,
        strain: null,
        energy: null,
      };
      
      const endPoint = {
        x: gap.x2,
        load: gap.y2,
        timestamp: new Date(gap.x2).toISOString(),
        focus: null,
        strain: null,
        energy: null,
      };
      
      // Create first segment: from before-gap point (if exists) through start to middle
      const segment1Data: Array<{ x: number; load: number | null; timestamp: string; focus: number | null; strain: number | null; energy: number | null }> = [];
      if (gapStartIndex > 0 && stitched[gapStartIndex - 1].load != null) {
        segment1Data.push(stitched[gapStartIndex - 1]);
      }
      segment1Data.push(startPoint);
      segment1Data.push(midPoint);
      
      // Extend boundaries
      if (segment1Data.length > 0) {
        const firstPoint = segment1Data[0];
        segment1Data.unshift({
          ...firstPoint,
          x: firstPoint.x - EPSILON_MS,
        });
        const lastPoint = segment1Data[segment1Data.length - 1];
        segment1Data.push({
          ...lastPoint,
          x: lastPoint.x + EPSILON_MS,
        });
      }
      
      const avgLoad1 = (gap.y1 + midY) / 2;
      const color1 = getLoadColor(avgLoad1);
      gapAreaSegments.push({
        data: segment1Data,
        color: color1,
        isGap: true,
      });
      
      // Create second segment: from middle through end to after-gap point (if exists)
      const segment2Data: Array<{ x: number; load: number | null; timestamp: string; focus: number | null; strain: number | null; energy: number | null }> = [];
      segment2Data.push(midPoint);
      segment2Data.push(endPoint);
      if (gapEndIndex < stitched.length - 1 && stitched[gapEndIndex + 1].load != null) {
        segment2Data.push(stitched[gapEndIndex + 1]);
      }
      
      // Extend boundaries
      if (segment2Data.length > 0) {
        const firstPoint = segment2Data[0];
        segment2Data.unshift({
          ...firstPoint,
          x: firstPoint.x - EPSILON_MS,
        });
        const lastPoint = segment2Data[segment2Data.length - 1];
        segment2Data.push({
          ...lastPoint,
          x: lastPoint.x + EPSILON_MS,
        });
      }
      
      const avgLoad2 = (midY + gap.y2) / 2;
      const color2 = getLoadColor(avgLoad2);
      gapAreaSegments.push({
        data: segment2Data,
        color: color2,
        isGap: true,
      });
    });

    // Combine regular area segments and gap area segments
    // Render gap areas first so they appear behind regular areas
    const allAreaSegments = [...gapAreaSegments, ...areaSegments];

    return {
      chartData: stitched,
      gapSegments: gaps,
      xTicks,
      xDomainStart,
      xDomainEnd,
      lineSegments: segments,
      areaSegments: allAreaSegments,
    };
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


  // Show loading state
  if (isLoading) {
    return (
      <Card className="p-4 bg-content1 border border-white/10 hover:border-white/15 transition-colors">
        <CardBody className="pt-4">
          {chartHeader}
          <div className="flex items-center justify-center h-64">
            <Spinner size="lg" label="Loading dashboard data..." />
          </div>
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
        </CardBody>
      </Card>
    );
  }

  return (
    <Card className="p-4 bg-content1 border border-white/10 hover:border-white/15 transition-colors">
      <CardBody className="pt-4">
        {chartHeader}
        {/* Session bars - only show when there's data and domain is valid */}
        {sessions.length > 0 && xDomainStart > 0 && xDomainEnd > xDomainStart && (
          <SessionBars
            sessions={sessions}
            xDomainStart={xDomainStart}
            xDomainEnd={xDomainEnd}
          />
        )}
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
              xDomainEnd={xDomainEnd}
              lineSegments={lineSegments}
              areaSegments={areaSegments}
            />
          </Suspense>
        </div>
      </CardBody>
    </Card>
  );
};

export default CognitiveLoadChart;
