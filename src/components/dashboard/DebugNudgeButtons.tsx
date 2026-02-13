import { useState } from "react";
import { Button } from "@heroui/react";
import { invoke } from "@tauri-apps/api/core";
import { isDevMode } from "../../utils/constants";

const COOLDOWN_MS = 10000;

const DebugNudgeButtons = () => {
  const [disabled, setDisabled] = useState(false);

  const handleBreakNudge = async () => {
    if (disabled) return;
    setDisabled(true);
    setTimeout(() => setDisabled(false), COOLDOWN_MS);
    try {
      await invoke("trigger_debug_break_nudge");
    } catch (e) {
      console.error("[DEBUG] trigger_debug_break_nudge failed:", e);
      setDisabled(false);
    }
  };

  const handleFocusNudge = async () => {
    if (disabled) return;
    setDisabled(true);
    setTimeout(() => setDisabled(false), COOLDOWN_MS);
    try {
      await invoke("trigger_debug_focus_nudge");
    } catch (e) {
      console.error("[DEBUG] trigger_debug_focus_nudge failed:", e);
      setDisabled(false);
    }
  };

  if (!isDevMode) return null;

  return (
    <div className="flex items-center gap-2 mt-6 pt-4 border-t border-white/10">
      <span className="btn-plain text-foreground/50 text-xs mr-2">Debug:</span>
      <Button
        size="sm"
        variant="bordered"
        className="btn-plain text-foreground/50 text-xs border-white/10"
        onPress={handleBreakNudge}
        isDisabled={disabled}
      >
        Break Nudge (5s)
      </Button>
      <Button
        size="sm"
        variant="bordered"
        className="btn-plain text-foreground/50 text-xs border-white/10"
        onPress={handleFocusNudge}
        isDisabled={disabled}
      >
        Focus Nudge (5s)
      </Button>
    </div>
  );
};

export default DebugNudgeButtons;
