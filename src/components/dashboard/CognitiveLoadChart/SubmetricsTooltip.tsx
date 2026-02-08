import { Card, CardBody } from "@heroui/card";

const format = (value: unknown) =>
  typeof value === "number" && Number.isFinite(value)
    ? Math.round(value)
    : "--";

const SubmetricsTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    // Hide tooltip for gap-separator points
    if (data.focus == null && data.strain == null && data.energy == null) return null;

    const date =
      typeof data.x === "number" && Number.isFinite(data.x)
        ? new Date(data.x)
        : new Date(data.timestamp);
    const hours = date.getUTCHours().toString().padStart(2, "0");
    const minutes = date.getUTCMinutes().toString().padStart(2, "0");

    return (
      <Card isBlurred shadow="lg">
        <CardBody className="py-2 px-3 flex flex-col gap-2">
          <p className="text-sm font-semibold text-center text-foreground w-full">
            {hours}:{minutes}
          </p>
          <div className="space-y-1.5">
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

export default SubmetricsTooltip;
