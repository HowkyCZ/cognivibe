import { Card, CardBody, CardHeader } from "@heroui/card";
import { Divider } from "@heroui/divider";
import { Button, useDisclosure } from "@heroui/react";
import { useState } from "react";
import {
  CognitiveLoadChart,
  HelpModal,
  LogoutModal,
  SettingsModal,
  WeeklyAssessmentCard,
  AppNavbar,
} from "..";
import { invoke } from "@tauri-apps/api/core";

// Sample data for cognitive metrics throughout the day
const cognitiveLoadData = [
  { time: "6:00", focus: 3.1, strain: 1.8, energy: 2.5 },
  { time: "7:00", focus: 4.2, strain: 2.1, energy: 3.8 },
  { time: "8:00", focus: 5.5, strain: 2.8, energy: 4.5 },
  { time: "9:00", focus: 6.8, strain: 3.5, energy: 5.2 },
  { time: "10:00", focus: 7.2, strain: 4.8, energy: 6.1 },
  { time: "11:00", focus: 8.1, strain: 5.5, energy: 6.8 },
  { time: "12:00", focus: 6.5, strain: 4.2, energy: 5.8 },
  { time: "13:00", focus: 5.8, strain: 3.8, energy: 5.2 },
  { time: "14:00", focus: 7.5, strain: 5.8, energy: 6.5 },
  { time: "15:00", focus: 8.2, strain: 6.2, energy: 7.1 },
  { time: "16:00", focus: 7.8, strain: 5.9, energy: 6.8 },
  { time: "17:00", focus: 6.2, strain: 4.5, energy: 5.5 },
  { time: "18:00", focus: 4.8, strain: 3.2, energy: 4.2 },
  { time: "19:00", focus: 3.5, strain: 2.5, energy: 3.1 },
  { time: "20:00", focus: 2.8, strain: 1.8, energy: 2.5 },
  { time: "21:00", focus: 2.1, strain: 1.2, energy: 1.8 },
];

// Sample session data for highlighting work periods
const sessionData = [
  { start: "9:00", end: "11:00", name: "Deep Work Session" },
  { start: "14:00", end: "16:00", name: "Focus Block" },
];

function DashboardPage() {
  const [isMeasuring, setIsMeasuring] = useState(false);
  const currentCognitiveLoad = 6.8;
  const maxLoad = Math.max(
    ...cognitiveLoadData.flatMap((d) => [d.focus, d.strain, d.energy])
  );
  const avgLoad =
    cognitiveLoadData.reduce(
      (sum, d) => sum + d.focus + d.strain + d.energy,
      0
    ) /
    (cognitiveLoadData.length * 3);
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const {
    isOpen: isLogoutOpen,
    onOpen: onLogoutOpen,
    onOpenChange: onLogoutOpenChange,
  } = useDisclosure();
  const {
    isOpen: isSettingsOpen,
    onOpen: onSettingsOpen,
    onOpenChange: onSettingsOpenChange,
  } = useDisclosure();

  const fetchRunningApps = async () => {
    const apps = await invoke("get_running_apps");
    console.log(apps);
  };

  fetchRunningApps();

  return (
    <>
      <AppNavbar
        isMeasuring={isMeasuring}
        onMeasuringToggle={() => setIsMeasuring(!isMeasuring)}
        onHelpOpen={onOpen}
        onLogoutOpen={onLogoutOpen}
        onSettingsOpen={onSettingsOpen}
      />
      <main className="container mx-auto p-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Button
            variant="solid"
            onPress={() => fetchRunningApps()}
            className="mb-4"
          >
            Fetch Running Apps
          </Button>
          <CognitiveLoadChart
            data={cognitiveLoadData}
            sessions={sessionData}
            maxLoad={maxLoad}
            avgLoad={avgLoad}
          />
          <Card className="p-4">
            <CardHeader className="pb-4">
              <div>
                <h3 className="text-xl font-semibold">
                  Current Cognitive Load
                </h3>
                <p className="text-sm text-gray-500">Live measurement</p>
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
              </div>{" "}
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
              <p className="text-3xl font-bold text-blue-600">8</p>
            </CardBody>
          </Card>
          <Card className="p-4">
            <CardBody className="text-center">
              <h4 className="text-lg font-semibold mb-2">Focus Time</h4>
              <p className="text-3xl font-bold text-green-600">4.2h</p>
            </CardBody>{" "}
          </Card>
          <Card className="p-4">
            <CardBody className="text-center">
              <h4 className="text-lg font-semibold mb-2">Break Time</h4>
              <p className="text-3xl font-bold text-orange-600">1.8h</p>
            </CardBody>
          </Card>{" "}
        </div>{" "}
        <HelpModal isOpen={isOpen} onOpenChange={onOpenChange} />
        <LogoutModal isOpen={isLogoutOpen} onOpenChange={onLogoutOpenChange} />
        <SettingsModal
          isOpen={isSettingsOpen}
          onOpenChange={onSettingsOpenChange}
        />
      </main>
    </>
  );
}

export default DashboardPage;
