import { Card, CardBody, CardHeader } from "@heroui/card";
import { Divider } from "@heroui/divider";
import {
  CognitiveLoadChart,
  WeeklyAssessmentCard,
  AppNavbar,
  CircleChartCard,
} from "..";
import { useDashboardData } from "../../hooks";

function DashboardPage() {
  const {
    cognitiveLoadData,
    sessionData,
    currentCognitiveLoad,
    maxLoad,
    avgLoad,
    loading: dashboardLoading,
    error: dashboardError,
  } = useDashboardData();

  return (
    <>
      <AppNavbar />
      <main className="container mx-auto p-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {dashboardLoading ? (
            <Card className="p-4 flex items-center justify-center h-64">
              <div className="text-center">
                <div className="w-8 h-8 border-4 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-500">Loading dashboard data...</p>
              </div>
            </Card>
          ) : (
            <CognitiveLoadChart
              data={cognitiveLoadData}
              sessions={sessionData}
              maxLoad={maxLoad}
              avgLoad={avgLoad}
            />
          )}
          <div className="mt-6">
            <CircleChartCard currentCognitiveLoad={30} />
          </div>
          <div className="mt-6">
            <WeeklyAssessmentCard />
          </div>
        </div>
      </main>
    </>
  );
}

export default DashboardPage;
