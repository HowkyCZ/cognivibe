import React from "react";
import { Button } from "@heroui/button";
import { Tooltip } from "@heroui/tooltip";
import { IconHelpCircle } from "@tabler/icons-react";

type HelpButtonProps = {
  tooltipTitle: string;
  tooltipText: string;
  className?: string;
  isInAbsoluteCard?: boolean;
};

/**
 * HelpButton Component
 * 
 * A button that displays helpful information in a tooltip when hovered or clicked.
 * 
 * @param tooltipTitle - The title text for the tooltip
 * @param tooltipText - The main content text for the tooltip (supports HTML)
 * @param className - Additional CSS classes to apply to the button
 * @param isInAbsoluteCard - If true, positions the button absolutely (top-2 right-2 z-40).
 *                          When true, ensure the parent container has `relative` positioning.
 * 
 * @example
 * // Basic usage
 * <HelpButton tooltipTitle="Help" tooltipText="This is helpful information" />
 * 
 * @example
 * // Usage in a card with absolute positioning
 * <div className="relative">
 *   <HelpButton 
 *     tooltipTitle="Card Help" 
 *     tooltipText="Information about this card"
 *     isInAbsoluteCard={true}
 *   />
 * </div>
 */
const HelpButton: React.FC<HelpButtonProps> = ({
  tooltipTitle,
  tooltipText,
  className,
  isInAbsoluteCard = false,
}) => {
  return (
    <Tooltip
      content={
        <div className="px-1 py-2">
          <div className="text-small font-bold pb-1">{tooltipTitle}</div>
          <div
            className="text-tiny"
            dangerouslySetInnerHTML={{ __html: tooltipText }}
          />
        </div>
      }
    >
      <Button
        isIconOnly
        size="sm"
        variant="light"
        className={`ml-1 ${isInAbsoluteCard ? "absolute top-2 right-2 z-40" : ""} ${className || ""}`}
      >
        <IconHelpCircle className="text-default-400" size={16} />
      </Button>
    </Tooltip>
  );
};

export default HelpButton;
