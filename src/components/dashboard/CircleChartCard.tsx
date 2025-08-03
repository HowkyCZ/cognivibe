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
import { Card, CardBody, CardFooter, CardHeader } from "@heroui/react";
import HelpButton from "../HelpButton";

type CircleChartProps = {
  currentCognitiveLoad: number;
};

const formatTotal = (value: number | undefined) => {
  return value?.toLocaleString() ?? "0";
};

// Cognitive load thresholds
const thresholds = {
  low: 40,
  medium: 80,
  high: 100,
};

// Determine color based on cognitive load thresholds
const getLoadColor = (value: number): ButtonProps["color"] => {
  if (value <= thresholds.low) return "secondary"; // blue
  if (value <= thresholds.medium) return "primary"; // purple
  return "danger"; // red
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

const CircleChartCard = React.forwardRef<
  HTMLDivElement,
  Omit<CardProps, "children"> & CircleChartProps
>(({ currentCognitiveLoad, ...props }, ref) => {
  // Default props
  const title = "Cognitive Load";
  const color = getLoadColor(currentCognitiveLoad);
  const loadTitle = getLoadTitle(currentCognitiveLoad);
  const loadText = getLoadText(currentCognitiveLoad);
  const total = 100;
  const chartData = [{ name: "Current Load", value: currentCognitiveLoad }];

  return (
    <Card ref={ref} className={`w-64 p-4 bg-${color}/20 relative`} {...props}>
      <HelpButton
        tooltipTitle="Cognitive Load Levels"
        className="absolute top-2 right-2 z-40"
        tooltipText="• Low (0-40): Light load, perfect for deep work<br/>• Mid (40-80): Optimal flow zone<br/>• High (80-100): Overwhelmed, consider taking a break"
      />
      <CardHeader className="flex items-center justify-center">
        <p className="text-xl font-medium text-center">{title}</p>
      </CardHeader>
      <CardBody className="flex items-center justify-center h-full">
        <ResponsiveContainer
          className="[&_.recharts-surface]:outline-none min-h-40"
          height={"100%"}
          width="100%"
        >
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
                fill: "hsl(var(--heroui-default-100))",
              }}
              cornerRadius={12}
              dataKey="value"
            >
              {chartData.map((_, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={`hsl(var(--heroui-${color === "default" ? "foreground" : color}))`}
                />
              ))}
            </RadialBar>

            <g>
              <text textAnchor="middle" x="50%" y="55%">
                <tspan className="fill-foreground text-4xl font-bold">
                  {formatTotal(chartData?.[0]?.value)}
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
      </CardBody>
      <CardFooter className="text-left min-h-12 grow pt-0">
        <p className="text-sm text-default-700">{loadText}</p>
      </CardFooter>
    </Card>
  );
});

export default CircleChartCard;
