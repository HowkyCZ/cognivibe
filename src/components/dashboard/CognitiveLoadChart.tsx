import React, { lazy, Suspense } from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Spinner } from "@heroui/react";
import TimelineBar from "./TimelineBar";

// Create a lazy-loaded chart component that imports recharts internally
const LazyChart = lazy(() =>
  import("recharts").then((recharts) => {
    const ChartComponent = ({
      data,
    }: {
      data: Array<{
        time: string;
        focus: number;
        strain: number;
        energy: number;
      }>;
    }) => (
      <recharts.ResponsiveContainer width="100%" height="100%">
        <recharts.LineChart data={data}>
          <recharts.CartesianGrid strokeDasharray="3 3" />
          <recharts.XAxis dataKey="time" />
          <recharts.YAxis domain={[0, 100]} tick={false} />

          <recharts.Line
            type="natural"
            dataKey="focus"
            stroke="#3b82f6"
            strokeWidth={3}
            dot={false}
            activeDot={{ r: 6 }}
            name="Focus"
          />
          <recharts.Line
            type="natural"
            dataKey="strain"
            stroke="#ef4444"
            strokeWidth={3}
            dot={false}
            activeDot={{ r: 6 }}
            name="Strain"
          />
          <recharts.Line
            type="natural"
            dataKey="energy"
            stroke="#10b981"
            strokeWidth={3}
            dot={false}
            activeDot={{ r: 6 }}
            name="Energy"
          />
        </recharts.LineChart>
      </recharts.ResponsiveContainer>
    );
    return { default: ChartComponent };
  })
);

interface CognitiveLoadChartProps {
  data: Array<{ time: string; focus: number; strain: number; energy: number }>;
}

const CognitiveLoadChart: React.FC<CognitiveLoadChartProps> = ({
  data,
}) => {
  return (
    <Card className="p-4">
      <CardHeader className="pb-4">
        <p className="text-xl font-semibold">Your Cognitive Load Today</p>
      </CardHeader>
      <CardBody className="pt-4">
        <div className="h-64">
          <Suspense
            fallback={
              <div className="flex items-center justify-center h-full">
                <Spinner size="lg" label="Loading chart..." />
              </div>
            }
          >
            <LazyChart data={data} />
            <TimelineBar
              startTime="09:00"
              endTime="17:00"
              breakTimes={[
                { start: "10:15", end: "10:30", type: "Manual" },
                { start: "12:00", end: "13:00", type: "Automatic" },
                { start: "15:00", end: "15:15", type: "Automatic" },
              ]}
              className="mb-4"
            />
          </Suspense>
        </div>
      </CardBody>
    </Card>
  );
};

export default CognitiveLoadChart;
