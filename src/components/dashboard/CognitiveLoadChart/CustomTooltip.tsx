import { Card, CardBody } from "@heroui/card";

const thresholds = {
  low: 30,
  medium: 65,
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
        <CardBody className="py-2 px-3 flex flex-col gap-2">
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
        </CardBody>
      </Card>
    );
  }
  return null;
};

export default CustomTooltip;
