import { Card } from "@heroui/card";
import {
  CognitiveLoadChart,
  WeeklyAssessmentCard,
  AppNavbar,
  CircleChartCard,
  WideCircleChartCard,
} from "..";
import { useDashboardData } from "../../hooks";

function DashboardPage() {
  const {
    cognitiveLoadData,
    metricsData,
    currentCognitiveLoad,
    loading: dashboardLoading,
  } = useDashboardData();

  return (
    <>
      <AppNavbar />
      <main className="container mx-auto p-8">
        {dashboardLoading ? (
          <Card className="p-4 flex items-center justify-center h-64">
            <div className="text-center">
              <div className="w-8 h-8 border-4 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-500">Loading dashboard data...</p>
            </div>
          </Card>
        ) : (
          <CognitiveLoadChart data={cognitiveLoadData} />
        )}
        <div className="flex flex-row gap-4 my-4">
          <CircleChartCard currentCognitiveLoad={currentCognitiveLoad} />
          <div className="mt-6 flex flex-col gap-2">
            {metricsData.map((metric, index) => (
              <WideCircleChartCard
                key={index}
                title={metric.title}
                value={metric.value}
                color={metric.color}
                description={metric.description}
              />
            ))}
          </div>
        </div>
        <div className="mt-6">
          <WeeklyAssessmentCard />
        </div>
      </main>
    </>
  );
}

export default DashboardPage;
