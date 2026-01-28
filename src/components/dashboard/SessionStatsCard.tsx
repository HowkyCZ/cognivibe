"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardBody } from "@heroui/react";
import {
  IconKeyboard,
  IconArrowsExchange,
  IconBackspace,
  IconClick,
} from "@tabler/icons-react";
import { useSessionBehavioralMetrics } from "../../hooks/useSessionBehavioralMetrics";

const WIDTH_BREAKPOINT = 350; // Same breakpoint as GradientCard

interface SessionStatsCardProps {
  sessionId: string | null;
  elapsedMs: number;
}

/**
 * Formats milliseconds as HH:MM
 */
function formatMsToHHMM(ms: number): string {
  const totalMinutes = Math.floor(ms / (1000 * 60));
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
}

interface StatItemProps {
  icon: React.ReactNode;
  value: string;
  label: string;
}

const StatItem = ({ icon, value, label }: StatItemProps) => (
  <div className="flex items-center gap-2 shrink-0">
    <div className="text-foreground/70 shrink-0">{icon}</div>
    <div className="flex flex-col min-w-0">
      <span className="text-sm font-semibold text-foreground leading-tight">{value}</span>
      <span className="text-xs text-foreground/60 leading-tight">{label}</span>
    </div>
  </div>
);

const SessionStatsCard = ({ sessionId, elapsedMs }: SessionStatsCardProps) => {
  const [cardWidth, setCardWidth] = useState(0);
  const contentRef = useRef<HTMLDivElement>(null);

  const { stats, loading } = useSessionBehavioralMetrics(sessionId);

  const isWide = cardWidth >= WIDTH_BREAKPOINT;

  // Width detection using ResizeObserver
  useEffect(() => {
    if (!contentRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      if (entries[0]) {
        setCardWidth(entries[0].contentRect.width);
      }
    });

    resizeObserver.observe(contentRef.current);

    // Check initial width immediately
    if (contentRef.current) {
      setCardWidth(contentRef.current.getBoundingClientRect().width);
    }

    return () => resizeObserver.disconnect();
  }, []);

  const formattedDuration = formatMsToHHMM(elapsedMs);

  // Statistics to display
  const allStats = [
    {
      icon: <IconKeyboard size={20} />,
      value: loading ? "..." : `${stats.typingSpeed}`,
      label: "chars/min",
    },
    {
      icon: <IconArrowsExchange size={20} />,
      value: loading ? "..." : `${stats.windowSwitches}`,
      label: "switches",
    },
    {
      icon: <IconBackspace size={20} />,
      value: loading ? "..." : `${stats.errorRate}%`,
      label: "error rate",
    },
    {
      icon: <IconClick size={20} />,
      value: loading ? "..." : `${stats.clicks}`,
      label: "clicks",
    },
  ];

  // Show 2 stats in narrow mode, 4 in wide mode
  const visibleStats = isWide ? allStats : allStats.slice(0, 2);

  return (
    <Card className="w-full h-full bg-content1/60 border border-dashed border-white/10 hover:border-white/15 transition-colors overflow-hidden">
      <CardBody className="flex flex-col justify-center items-center gap-1.5 p-3 h-full overflow-hidden">
        <div ref={contentRef} className="w-full h-full flex flex-col justify-center items-center">
          {/* Header */}
          <div className="text-sm font-medium text-foreground/80 mb-2 shrink-0 text-center">
            Session Active: <span className="font-semibold text-foreground">{formattedDuration}</span>
          </div>

          {/* Statistics */}
          <div className={`flex ${isWide ? "justify-center gap-6" : "justify-center gap-4"} shrink-0`}>
            {visibleStats.map((stat, index) => (
              <StatItem
                key={index}
                icon={stat.icon}
                value={stat.value}
                label={stat.label}
              />
            ))}
          </div>
        </div>
      </CardBody>
    </Card>
  );
};

export default SessionStatsCard;
