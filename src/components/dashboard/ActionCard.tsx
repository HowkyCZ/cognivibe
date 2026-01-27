import React from "react";
import { Card, CardBody } from "@heroui/react";
import { cn } from "@heroui/react";
import { IconCheck, IconClipboardList, IconBrain } from "@tabler/icons-react";

export type ActionCardProps = {
  icon: string;
  title: string;
  color?: "primary" | "secondary" | "warning" | "danger" | "success";
  description: string;
  onPress?: () => void;
  className?: string;
};

const ActionCard = React.forwardRef<HTMLDivElement, ActionCardProps>(
  ({ color, title, icon, description, className, onPress }, ref) => {
    const getIcon = () => {
      switch (icon) {
        case "solar:check-circle-bold":
          return <IconCheck width={24} />;
        case "solar:clipboard-list-linear":
          return <IconClipboardList width={24} />;
        default:
          return <IconBrain width={24} />;
      }
    };

    const colors = React.useMemo(() => {
      switch (color) {
        case "primary":
          return {
            card: "border-primary/30",
            iconWrapper: "bg-primary/40 border-primary/40",
            icon: "text-primary",
          };
        case "secondary":
          return {
            card: "border-secondary/30",
            iconWrapper: "bg-secondary/40 border-secondary/40",
            icon: "text-secondary",
          };
        case "warning":
          return {
            card: "border-warning/30",
            iconWrapper: "bg-warning/40 border-warning/40",
            icon: "text-warning",
          };
        case "danger":
          return {
            card: "border-danger/30",
            iconWrapper: "bg-danger/40 border-danger/40",
            icon: "text-danger",
          };
        case "success":
          return {
            card: "border-success/30",
            iconWrapper: "bg-success/40 border-success/40",
            icon: "text-success",
          };

        default:
          return {
            card: "border-white/10",
            iconWrapper: "bg-white/5 border-white/10",
            icon: "text-foreground/60",
          };
      }
    }, [color]);

    return (
      <Card
        ref={ref}
        isPressable={!!onPress}
        className={cn("border-small", colors?.card, className)}
        shadow="sm"
        onPress={onPress}
      >
        <CardBody className="flex h-full flex-row items-start gap-3 p-4">
          <div
            className={cn(
              "item-center flex rounded-medium border p-2",
              colors?.iconWrapper
            )}
          >
            <div className={colors?.icon}>{getIcon()}</div>
          </div>
          <div className="flex flex-col">
            <p className="text-medium text-foreground">{title}</p>
            <p className="text-small text-foreground/60">{description}</p>
          </div>
        </CardBody>
      </Card>
    );
  }
);

export default ActionCard;
