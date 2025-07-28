import { Card, CardBody, CardHeader } from "@heroui/card";
import { Divider } from "@heroui/divider";
import { CognitiveLoadChart, WeeklyAssessmentCard, AppNavbar } from "..";
import { useDashboardData } from "../../hooks";

function DashboardPage() {
  const {
    cognitiveLoadData,
    sessionData,
    currentCognitiveLoad,
    maxLoad,
    avgLoad,
    stats,
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
          <Card className="p-4">
            <CardHeader className="pb-4">
              <div>
                <h3 className="text-xl font-semibold">
                  Current Cognitive Load
                </h3>
                <p className="text-sm text-gray-500">
                  {dashboardLoading ? "Loading..." : "Live measurement"}
                </p>
                {dashboardError && (
                  <p className="text-sm text-red-500 mt-1">
                    Error: {dashboardError}
                  </p>
                )}
              </div>
            </CardHeader>
            <Divider />
            <CardBody className="pt-4">
              <div className="flex flex-col items-center justify-center h-64">
                <div className="text-6xl font-bold text-primary mb-4">
                  {currentCognitiveLoad}
                  <span className="text-2xl text-gray-500">/10</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
                  <div
                    className="bg-gradient-to-r from-green-400 to-yellow-400 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${(currentCognitiveLoad / 10) * 100}%` }}
                  ></div>
                </div>
                <div className="text-center">
                  <p className="text-lg font-medium text-gray-700">
                    {currentCognitiveLoad < 4
                      ? "Low Load"
                      : currentCognitiveLoad < 7
                        ? "Moderate Load"
                        : "High Load"}
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    {currentCognitiveLoad < 4
                      ? "You're in a relaxed state"
                      : currentCognitiveLoad < 7
                        ? "Optimal performance zone"
                        : "Consider taking a break"}
                  </p>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
        <div className="mt-6">
          <WeeklyAssessmentCard />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <Card className="p-4">
            <CardBody className="text-center">
              <h4 className="text-lg font-semibold mb-2">Sessions Today</h4>
              <p className="text-3xl font-bold text-blue-600">
                {stats.sessionsToday}
              </p>
            </CardBody>
          </Card>
          <Card className="p-4">
            <CardBody className="text-center">
              <h4 className="text-lg font-semibold mb-2">Focus Time</h4>
              <p className="text-3xl font-bold text-green-600">
                {stats.focusTime}
              </p>
            </CardBody>
          </Card>
          <Card className="p-4">
            <CardBody className="text-center">
              <h4 className="text-lg font-semibold mb-2">Break Time</h4>
              <p className="text-3xl font-bold text-orange-600">
                {stats.breakTime}
              </p>
            </CardBody>
          </Card>
        </div>
      </main>
    </>
  );
}

export default DashboardPage;
