import {
  CognitiveLoadChart,
  AppNavbar,
  CircleChartCard,
  WideCircleChartCard,
} from "..";
import { useDashboardData } from "../../hooks";
import { useState } from "react";
import { today, getLocalTimeZone } from "@internationalized/date";
import type { CalendarDate } from "@internationalized/date";

function DashboardPage() {
  const [selectedDate, setSelectedDate] = useState<CalendarDate>(
    today(getLocalTimeZone())
  );

  const {
    cognitiveLoadData,
    missingData,
    metricsData,
    currentCognitiveLoad,
    loading: dashboardLoading,
    session,
  } = useDashboardData(selectedDate);

  const firstDate = session?.user?.created_at
    ? new Date(session.user.created_at).toISOString().split("T")[0]
    : new Date().toISOString().split("T")[0];

  return (
    <>
      <AppNavbar />
      <main className="container mx-auto p-8">
        <CognitiveLoadChart
          data={cognitiveLoadData}
          missingData={missingData}
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
          firstDate={firstDate}
          isLoading={dashboardLoading}
        />
        <div className="flex flex-row gap-4 my-4">
          <CircleChartCard
            currentCognitiveLoad={currentCognitiveLoad}
            isLoading={dashboardLoading}
          />
          <div className="flex flex-col gap-4">
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
                  title="Pressure"
                  value={0}
                  color="secondary"
                  description="Indicates time constraints and external demands affecting performance"
                  isLoading={dashboardLoading}
                />
                <WideCircleChartCard
                  title="Concentration"
                  value={0}
                  color="danger"
                  description="Reflects ability to maintain focused attention on current tasks"
                  isLoading={dashboardLoading}
                />
              </>
            )}
          </div>
        </div>
      </main>
    </>
  );
}

export default DashboardPage;
