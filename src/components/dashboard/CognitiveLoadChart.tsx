import React, { lazy, Suspense } from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Divider, Spinner } from "@heroui/react";

// Create a lazy-loaded chart component that imports recharts internally
const LazyChart = lazy(() =>
  import("recharts").then((recharts) => {
    const ChartComponent = ({
      data,
      sessions,
    }: {
      data: Array<{
        time: string;
        focus: number;
        strain: number;
        energy: number;
      }>;
      sessions?: Array<{ start: string; end: string; name: string }>;
    }) => (
      <recharts.ResponsiveContainer width="100%" height="100%">
        <recharts.LineChart data={data}>
          <recharts.CartesianGrid strokeDasharray="3 3" />
          <recharts.XAxis dataKey="time" />
          <recharts.YAxis domain={[0, 10]} />
          <recharts.Tooltip
            formatter={(value: any, name: string) => [
              `${value}/10`,
              name.charAt(0).toUpperCase() + name.slice(1),
            ]}
            labelFormatter={(label: any) => `Time: ${label}`}
          />
          <recharts.Legend />
          {/* Session overlays */}
          {sessions?.map((session, index) => (
            <recharts.ReferenceArea
              key={index}
              x1={session.start}
              x2={session.end}
              fill="#94a3b8"
              fillOpacity={0.2}
              stroke="#64748b"
              strokeOpacity={0.5}
              strokeDasharray="2 2"
            />
          ))}
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
  sessions?: Array<{ start: string; end: string; name: string }>;
  maxLoad: number;
  avgLoad: number;
}

const CognitiveLoadChart: React.FC<CognitiveLoadChartProps> = ({
  data,
  sessions,
  maxLoad,
  avgLoad,
}) => {
  return (
    <Card className="p-4">
      <CardHeader className="pb-4">
        <div>
          <h3 className="text-xl font-semibold">Cognitive Metrics Today</h3>
          <p className="text-sm text-gray-500">
            Focus, strain, and energy monitoring throughout the day
          </p>
        </div>
      </CardHeader>
      <Divider />
      <CardBody className="pt-4">
        <div className="h-64">
          <Suspense
            fallback={
              <div className="flex items-center justify-center h-full">
                <Spinner size="lg" label="Loading chart..." />
              </div>
            }
          >
            <LazyChart data={data} sessions={sessions} />
          </Suspense>
        </div>
        <div className="mt-4 flex justify-between items-center text-sm text-gray-600">
          <div className="flex items-center gap-4">
            <span>Peak: {maxLoad}/10</span>
            <span>Average: {avgLoad.toFixed(1)}/10</span>
          </div>
          {sessions && sessions.length > 0 && (
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-slate-400 opacity-20 border border-slate-500 border-dashed"></div>
              <span className="text-xs">Work Sessions</span>
            </div>
          )}
        </div>
      </CardBody>
    </Card>
  );
};

export default CognitiveLoadChart;
