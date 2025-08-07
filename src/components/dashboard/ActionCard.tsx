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
            card: "border-default-200",
            iconWrapper: "bg-primary-50 border-primary-100",
            icon: "text-primary",
          };
        case "secondary":
          return {
            card: "border-secondary-100",
            iconWrapper: "bg-secondary-50 border-secondary-100",
            icon: "text-secondary",
          };
        case "warning":
          return {
            card: "border-warning-500",
            iconWrapper: "bg-warning-50 border-warning-100",
            icon: "text-warning-600",
          };
        case "danger":
          return {
            card: "border-danger-300",
            iconWrapper: "bg-danger-50 border-danger-100",
            icon: "text-danger",
          };
        case "success":
          return {
            card: "border-success-300",
            iconWrapper: "bg-success-50 border-success-100",
            icon: "text-success",
          };

        default:
          return {
            card: "border-default-200",
            iconWrapper: "bg-default-50 border-default-100",
            icon: "text-default-500",
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
            <p className="text-medium">{title}</p>
            <p className="text-small text-default-400">{description}</p>
          </div>
        </CardBody>
      </Card>
    );
  }
);

export default ActionCard;
