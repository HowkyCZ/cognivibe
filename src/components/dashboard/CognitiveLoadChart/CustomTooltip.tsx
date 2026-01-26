import { Card, CardBody, CardHeader } from "@heroui/card";
import { Divider } from "@heroui/divider";

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    if (data.load == null) return null;

    const date =
      typeof data.x === "number" && Number.isFinite(data.x)
        ? new Date(data.x)
        : new Date(data.timestamp);
    const hours = date.getUTCHours().toString().padStart(2, "0");
    const minutes = date.getUTCMinutes().toString().padStart(2, "0");

    const format = (value: unknown) =>
      typeof value === "number" && Number.isFinite(value)
        ? Math.round(value)
        : "--";

    return (
      <Card isBlurred shadow="lg">
        <CardHeader className="pb-2">
          <p className="text-sm font-semibold mx-auto text-foreground">
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
                  style={{ backgroundColor: "#5C78FD" }}
                ></span>
                <span className="text-xs text-foreground/60">
                  Cognitive Load
                </span>
              </div>
              <span className="text-xs font-semibold text-foreground">
                {format(data.load)}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: "#5C78FD" }}
                ></span>
                <span className="text-xs text-foreground/60">Focus</span>
              </div>
              <span className="text-xs font-semibold text-foreground">
                {format(data.focus)}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: "#A07CEF" }}
                ></span>
                <span className="text-xs text-foreground/60">Frustration</span>
              </div>
              <span className="text-xs font-semibold text-foreground">
                {format(data.strain)}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: "#FF709B" }}
                ></span>
                <span className="text-xs text-foreground/60">Workload</span>
              </div>
              <span className="text-xs font-semibold text-foreground">
                {format(data.energy)}
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
