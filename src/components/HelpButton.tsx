import React from "react";
import { Tooltip } from "@heroui/tooltip";
import { IconHelpCircle } from "@tabler/icons-react";

type HelpButtonProps = {
  tooltipTitle: string;
  tooltipText: string;
  className?: string;
};

/**
 * HelpButton Component
 *
 * A simple icon that displays helpful information in a tooltip when hovered.
 *
 * @param tooltipTitle - The title text for the tooltip
 * @param tooltipText - The main content text for the tooltip (supports HTML)
 * @param className - Additional CSS classes to apply (e.g., for positioning)
 *
 * @example
 * // Usage in a card
 * <Card className="relative">
 *   <HelpButton
 *     tooltipTitle="Card Help"
 *     tooltipText="Information about this card"
 *     className="absolute top-2 right-2"
 *   />
 * </Card>
 */
const HelpButton: React.FC<HelpButtonProps> = ({
  tooltipTitle,
  tooltipText,
  className,
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
      placement="top"
      showArrow
      delay={200}
      closeDelay={100}
      offset={8}
    >
      <button
        type="button"
        className={`inline-flex items-center justify-center cursor-help hover:opacity-80 transition-opacity z-10 ${className || ""}`}
        aria-label="Help"
      >
        <IconHelpCircle className="text-foreground/60" size={16} />
      </button>
    </Tooltip>
  );
};

export default HelpButton;
