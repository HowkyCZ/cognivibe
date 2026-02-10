"use client";

import type { ButtonProps, CardProps } from "@heroui/react";

import React from "react";
import {
  ResponsiveContainer,
  RadialBarChart,
  RadialBar,
  Cell,
  PolarAngleAxis,
} from "recharts";
import {
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  Skeleton,
} from "@heroui/react";
import HelpButton from "../HelpButton";

type CircleChartProps = {
  currentCognitiveLoad: number;
  /** When false, shows NO DATA state instead of treating 0 as Low */
  hasData?: boolean;
  isLoading?: boolean;
};

const formatTotal = (value: number | undefined) => {
  return value?.toLocaleString() ?? "0";
};

// Cognitive load thresholds (tuned for percentile-remapped display scores)
const thresholds = {
  low: 30,
  medium: 65,
  high: 100,
};

// Determine color based on cognitive load thresholds
const getLoadColor = (value: number): ButtonProps["color"] => {
  if (value <= thresholds.low) return "secondary";
  if (value <= thresholds.medium) return "primary";
  return "danger";
};

// Get title based on cognitive load
const getLoadTitle = (value: number): string => {
  if (value <= thresholds.low) return "LOW";
  if (value <= thresholds.medium) return "MID";
  return "HIGH";
};

// Get description text based on cognitive load
const getLoadText = (value: number): string => {
  if (value <= thresholds.low)
    return "You're running light today – perfect time to push your flow zone.";
  if (value <= thresholds.medium)
    return "You're in the flow zone, now is the time for deep-work.";
  return "You are getting too overwhelmed, consider taking a break.";
};

const NO_DATA_TEXT =
  "Have the app measuring for at least 5 minutes for the score to show up. Make sure the app has all the permissions.";

const CircleChartCard = React.forwardRef<
  HTMLDivElement,
  Omit<CardProps, "children"> & CircleChartProps
>(({ currentCognitiveLoad, hasData = true, isLoading = false, ...props }, ref) => {
  const noData = !hasData;
  const title = "Cognitive Load";
  const color = noData ? "default" : getLoadColor(currentCognitiveLoad);
  const bgClass = noData
    ? "bg-default-100/40"
    : color === "secondary"
      ? "bg-secondary/40"
      : color === "primary"
        ? "bg-primary/40"
        : "bg-danger/40";
  const loadTitle = noData ? "NO DATA" : getLoadTitle(currentCognitiveLoad);
  const loadText = noData ? NO_DATA_TEXT : getLoadText(currentCognitiveLoad);
  const total = 100;
  const chartData = [{ name: "Current Load", value: noData ? 0 : currentCognitiveLoad }];

  return (
    <Card
      ref={ref}
      className={`w-full h-full p-4 ${bgClass} relative flex flex-col group`}
      {...props}
    >
      {!isLoading && (
        <HelpButton
          tooltipTitle="Cognitive Load Levels"
          tooltipText="• Low (0-30): Light load, perfect for deep work<br/>• Mid (30-65): Optimal flow zone<br/>• High (65-100): Overwhelmed, consider taking a break"
          className="absolute top-2 right-2"
        />
      )}
      <CardHeader className="flex items-center justify-center">
        {isLoading ? (
          <Skeleton className="h-7 w-40 rounded-lg" />
        ) : (
          <p className="font-now text-xl font-medium text-center">{title}</p>
        )}
      </CardHeader>
      <CardBody className="flex items-center justify-center flex-1">
        {isLoading ? (
          <div className="flex items-center justify-center w-full h-40">
            <Skeleton className="w-40 h-40 rounded-full" />
          </div>
        ) : (
          <ResponsiveContainer className="max-h-40 h-40 min-h-40" width="100%">
            <RadialBarChart
              barSize={10}
              cx="50%"
              cy="50%"
              data={chartData}
              endAngle={-45}
              innerRadius={90}
              outerRadius={70}
              startAngle={225}
            >
              <PolarAngleAxis
                angleAxisId={0}
                domain={[0, total]}
                tick={false}
                type="number"
              />
              <RadialBar
                angleAxisId={0}
                animationDuration={1000}
                animationEasing="ease"
                background={{
                  fill: "hsl(var(--heroui-foreground) / 0.4)",
                }}
                cornerRadius={12}
                dataKey="value"
              >
                {chartData.map((_, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill="hsl(var(--heroui-foreground))"
                  />
                ))}
              </RadialBar>

              <g>
                <text textAnchor="middle" x="50%" y="55%">
                  <tspan className="fill-foreground text-4xl font-bold">
                    {noData ? "X" : formatTotal(chartData?.[0]?.value)}
                  </tspan>
                </text>
              </g>
              <g>
                <text textAnchor="middle" x="50%" y="85%">
                  <tspan
                    className="text-lg font-bold"
                    fill={`hsl(var(--heroui-${color === "default" ? "foreground" : color}))`}
                  >
                    {loadTitle}
                  </tspan>
                </text>
              </g>
            </RadialBarChart>
          </ResponsiveContainer>
        )}
      </CardBody>
      <CardFooter className="text-left min-h-12 pt-0">
        {isLoading ? (
          <Skeleton className="h-4 w-full rounded-lg" />
        ) : (
          <p className="text-sm text-foreground/60">{loadText}</p>
        )}
      </CardFooter>
    </Card>
  );
});

export default CircleChartCard;
