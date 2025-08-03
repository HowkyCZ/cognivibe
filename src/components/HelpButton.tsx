import React from "react";
import { Button } from "@heroui/button";
import { Tooltip } from "@heroui/tooltip";
import { IconHelpCircle } from "@tabler/icons-react";

type HelpButtonProps = {
  tooltipTitle: string;
  tooltipText: string;
};

const HelpButton: React.FC<HelpButtonProps> = ({
  tooltipTitle,
  tooltipText,
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
      <Button isIconOnly size="sm" variant="light" className="ml-1">
        <IconHelpCircle className="text-default-400" size={16} />
      </Button>
    </Tooltip>
  );
};

export default HelpButton;
