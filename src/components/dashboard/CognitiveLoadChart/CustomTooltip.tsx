import { Card, CardBody, CardHeader } from "@heroui/card";
import { Divider } from "@heroui/divider";

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const date = new Date(data.timestamp);
    const hours = date.getUTCHours().toString().padStart(2, "0");
    const minutes = date.getUTCMinutes().toString().padStart(2, "0");

    return (
      <Card isBlurred shadow="lg">
        <CardHeader className="pb-2">
          <p className="text-sm font-semibold mx-auto">
            {hours}:{minutes}
          </p>
        </CardHeader>
        <Divider />
        <CardBody className="py-3">
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: "#3b82f6" }}
                ></span>
                <span className="text-xs text-default-600">Focus</span>
              </div>
              <span className="text-xs font-semibold">
                {Math.round(data.focus)}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: "#ef4444" }}
                ></span>
                <span className="text-xs text-default-600">Strain</span>
              </div>
              <span className="text-xs font-semibold">
                {Math.round(data.strain)}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: "#10b981" }}
                ></span>
                <span className="text-xs text-default-600">Energy</span>
              </div>
              <span className="text-xs font-semibold">
                {Math.round(data.energy)}
              </span>
            </div>
          </div>
        </CardBody>
      </Card>
    );
  }
  return null;
};

export default CustomTooltip;
