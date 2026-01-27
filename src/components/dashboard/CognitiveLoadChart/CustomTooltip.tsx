import { Card, CardBody, CardHeader } from "@heroui/card";
import { Divider } from "@heroui/divider";

const thresholds = {
  low: 40,
  medium: 80,
  high: 100,
};

const getLoadIndicator = (load: number) => {
  if (load <= thresholds.low) {
    // Blue bottom arrow (↓)
    return (
      <svg
        width="12"
        height="12"
        viewBox="0 0 12 12"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M6 2L10 8H2L6 2Z"
          fill="#5C78FD"
          transform="rotate(180 6 6)"
        />
      </svg>
    );
  } else if (load <= thresholds.medium) {
    // Purple horizontal line (—)
    return (
      <svg
        width="12"
        height="12"
        viewBox="0 0 12 12"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <line x1="0" y1="6" x2="12" y2="6" stroke="#A07CEF" strokeWidth="2" />
      </svg>
    );
  } else {
    // Pink top arrow (↑)
    return (
      <svg
        width="12"
        height="12"
        viewBox="0 0 12 12"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M6 10L2 4H10L6 10Z" fill="#FF709B" />
      </svg>
    );
  }
};

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

    const loadValue = format(data.load);
    const loadNum = typeof data.load === "number" ? data.load : 0;

    return (
      <Card isBlurred shadow="lg">
        <CardHeader className="pb-2 flex flex-col gap-2">
          <p className="text-sm font-semibold text-center text-foreground w-full">
            {hours}:{minutes}
          </p>
          <div className="flex items-center justify-between gap-3 w-full">
            <div className="flex items-center gap-2">
              {getLoadIndicator(loadNum)}
              <span className="text-xs text-foreground/60">
                Cognitive Load
              </span>
            </div>
            <span className="text-xs font-semibold text-foreground">
              {loadValue}
            </span>
          </div>
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
