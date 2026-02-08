import {
  CognitiveLoadChart,
  AppNavbar,
  CircleChartCard,
  WideCircleChartCard,
  ProductivityTimeCard,
  GradientCard,
  WelcomeTourCard,
} from "..";
import { useDashboardData } from "../../hooks";
import { useState } from "react";
import { today, getLocalTimeZone } from "@internationalized/date";
import type { CalendarDate } from "@internationalized/date";
import { isDevMode } from "../../utils/constants";
import { Button } from "@heroui/react";
import { emit } from "@tauri-apps/api/event";
import {
  sendNotification,
  isPermissionGranted,
  requestPermission,
} from "@tauri-apps/plugin-notification";

function toLocalISODate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function DashboardPage() {
  const [selectedDate, setSelectedDate] = useState<CalendarDate>(
    today(getLocalTimeZone()),
  );

  const {
    cognitiveLoadData,
    metricsData,
    sessions,
    currentCognitiveLoad,
    loading: dashboardLoading,
    session,
  } = useDashboardData(selectedDate);

  const firstDate = session?.user?.created_at
    ? toLocalISODate(new Date(session.user.created_at))
    : toLocalISODate(new Date());

  return (
    <>
      <AppNavbar />
      <main className="w-full px-8 py-8">
        <div className="w-full max-w-5xl mx-auto">
          <WelcomeTourCard />

          <CognitiveLoadChart
            data={cognitiveLoadData}
            sessions={sessions}
            selectedDate={selectedDate}
            onDateChange={setSelectedDate}
            firstDate={firstDate}
            isLoading={dashboardLoading}
          />

          <div className="flex flex-row gap-4 my-4 items-stretch">
            <div className="w-[280px] shrink-0 self-stretch">
              <CircleChartCard
                currentCognitiveLoad={currentCognitiveLoad}
                isLoading={dashboardLoading}
              />
            </div>

            <div className="flex flex-col gap-4 flex-1 min-w-0">
              {metricsData.length > 0 ? (
                metricsData.map((metric, index) => (
                  <WideCircleChartCard
                    key={index}
                    title={metric.title}
                    value={metric.value}
                    color={metric.color}
                    description={metric.description}
                    isLoading={dashboardLoading}
                  />
                ))
              ) : (
                // Show placeholder cards when no data yet
                <>
                  <WideCircleChartCard
                    title="Frustration"
                    value={0}
                    color="primary"
                    description="Measures emotional stress and irritation levels during cognitive tasks"
                    isLoading={dashboardLoading}
                  />
                  <WideCircleChartCard
                    title="Workload"
                    value={0}
                    color="danger"
                    description="Indicates time constraints and external demands affecting performance"
                    isLoading={dashboardLoading}
                  />
                  <WideCircleChartCard
                    title="Focus"
                    value={0}
                    color="secondary"
                    description="Reflects ability to maintain focused attention on current tasks"
                    isLoading={dashboardLoading}
                  />
                </>
              )}
            </div>
          </div>

          <div className="flex flex-row gap-4 my-4 items-stretch">
            <div className="w-[500px] shrink-0 self-stretch">
              <ProductivityTimeCard selectedDate={selectedDate} />
            </div>

            <div className="flex-1 min-w-0 self-stretch">
              <GradientCard />
            </div>
          </div>
          {/* Dev test buttons — sends notification first, then event after 3s */}
          {isDevMode && (
            <div className="flex flex-row gap-2 my-4 items-center">
              <span className="text-xs text-default-400 mr-2">Test:</span>
              <Button
                size="sm"
                variant="bordered"
                className="text-xs border-primary/30 text-primary"
                onPress={async () => {
                  let ok = await isPermissionGranted();
                  if (!ok) ok = (await requestPermission()) === "granted";
                  if (ok) sendNotification({ title: "CogniVibe", body: "You've been working for 95 minutes. Time for a break." });
                  setTimeout(() => {
                    emit("break-nudge", {
                      trigger_reason: "long_session",
                      session_minutes: 95,
                    });
                  }, 3000);
                }}
              >
                Break Nudge
              </Button>
              <Button
                size="sm"
                variant="bordered"
                className="text-xs border-primary/30 text-primary"
                onPress={async () => {
                  let ok = await isPermissionGranted();
                  if (!ok) ok = (await requestPermission()) === "granted";
                  if (ok) sendNotification({ title: "CogniVibe", body: "Lots of context switching detected." });
                  setTimeout(() => {
                    emit("focus-nudge", {
                      switching_count: 15,
                      window_minutes: 5,
                    });
                  }, 3000);
                }}
              >
                Focus Nudge
              </Button>
            </div>
          )}
        </div>
      </main>
    </>
  );
}

export default DashboardPage;
