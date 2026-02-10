import type { CardProps } from "@heroui/react";

import React from "react";
import {
  ResponsiveContainer,
  RadialBarChart,
  RadialBar,
  Cell,
  PolarAngleAxis,
} from "recharts";
import { Card, CardBody, Skeleton } from "@heroui/react";
import HelpButton from "../HelpButton";

type WideCircleChartCardProps = {
  title: string;
  value: number;
  maxValue?: number;
  color: "primary" | "secondary" | "danger" | "success" | "warning";
  description?: string;
  isLoading?: boolean;
};

const formatValue = (value: number | undefined) => {
  return value?.toLocaleString() ?? "0";
};

const WideCircleChartCard = React.forwardRef<
  HTMLDivElement,
  Omit<CardProps, "children"> & WideCircleChartCardProps
>(
  (
    {
      title,
      value,
      maxValue = 100,
      color,
      description,
      isLoading = false,
      ...props
    },
    ref,
  ) => {
    const chartData = [{ name: title, value }];
    const valueColor = `hsl(var(--heroui-${color}))`;
    const trackColor = `hsl(var(--heroui-${color}) / 0.4)`;

    return (
      <Card
        ref={ref}
        className="w-full h-auto bg-content1 border border-white/10 hover:border-white/15 transition-colors relative group"
        {...props}
      >
        {!isLoading && description && (
          <HelpButton
            tooltipTitle={`What is ${title}?`}
            tooltipText={description}
            className="absolute top-2 right-2"
          />
        )}
        <CardBody className="flex flex-row items-center gap-4">
          {isLoading ? (
            <>
              <Skeleton className="w-20 h-20 rounded-full" />
              <div className="flex-1">
                <Skeleton className="h-6 w-32 rounded-lg mb-1" />
              </div>
            </>
          ) : (
            <>
              <div className="w-20 h-20">
                <ResponsiveContainer height="100%" width="100%">
                  <RadialBarChart
                    barSize={6}
                    cx="50%"
                    cy="50%"
                    data={chartData}
                    endAngle={270}
                    innerRadius={"100%"}
                    startAngle={-90}
                  >
                    <PolarAngleAxis
                      angleAxisId={0}
                      domain={[0, maxValue]}
                      tick={false}
                      type="number"
                    />
                    <RadialBar
                      angleAxisId={0}
                      animationDuration={1000}
                      animationEasing="ease"
                      background={{
                        fill: trackColor,
                      }}
                      cornerRadius={6}
                      dataKey="value"
                    >
                      {chartData.map((_, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={valueColor}
                        />
                      ))}
                    </RadialBar>

                    <g>
                      <text
                        textAnchor="middle"
                        x="50%"
                        y="50%"
                        dy="0.35em"
                      >
                        <tspan className="text-md font-bold" fill={valueColor}>
                          {formatValue(value)}
                        </tspan>
                      </text>
                    </g>
                  </RadialBarChart>
                </ResponsiveContainer>
              </div>

              <div>
                <p className="font-now text-lg font-medium text-foreground truncate">
                  {title}
                </p>
              </div>
            </>
          )}
        </CardBody>
      </Card>
    );
  },
);

export default WideCircleChartCard;
