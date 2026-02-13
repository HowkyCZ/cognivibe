import {
  CognitiveLoadChart,
  AppNavbar,
  CircleChartCard,
  WideCircleChartCard,
  ProductivityTimeCard,
  GradientCard,
  NotificationBar,
  DebugNudgeButtons,
} from "..";
import { useDashboardData } from "../../hooks";
import { useState } from "react";
import { today, getLocalTimeZone } from "@internationalized/date";
import type { CalendarDate } from "@internationalized/date";

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
          <NotificationBar />

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
                hasData={cognitiveLoadData.length > 0}
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

          <DebugNudgeButtons />
        </div>
      </main>
    </>
  );
}

export default DashboardPage;
