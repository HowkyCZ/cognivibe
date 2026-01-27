import React from "react";
import { useMeasuring } from "../../hooks";

const MeasureButton: React.FC = () => {
  const { isMeasuring, toggleMeasuring, loading } = useMeasuring();
  return (
    <div className="flex justify-center hover:scale-105 transition-all active:scale-95">
      <button
        onClick={toggleMeasuring}
        disabled={loading}
        className={`relative inline-flex h-12 w-48 overflow-hidden rounded-full p-[1px] transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary/60 ${
          isMeasuring
            ? "shadow-[0_0_30px_rgba(255,112,155,0.25)]"
            : "shadow-small"
        } ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
      >
        {isMeasuring ? (
          <span className="absolute inset-[-800%] animate-[spin_2.5s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#A07CEF_0%,#FF709B_60%,#A07CEF_100%)]" />
        ) : (
          <span className="absolute inset-0 bg-[linear-gradient(45deg,#A07CEF_0%,#A07CEF_60%,#FF709B_100%)] opacity-25" />
        )}
        <span
          className={`relative inline-flex h-full w-full items-center justify-center rounded-full px-6 py-1 text-sm font-medium backdrop-blur-3xl transition-all duration-300 ${
            isMeasuring
              ? "bg-content1 text-foreground"
              : "bg-content1 text-foreground border border-white/10 hover:border-primary/30"
          }`}
        >
          {loading ? (
            <>
              <div className="w-2 h-2 bg-warning-400 rounded-full mr-2"></div>
              Loading...
            </>
          ) : isMeasuring ? (
            <>
              <div className="w-2 h-2 bg-danger rounded-full mr-2 animate-pulse"></div>
              Measuring
            </>
          ) : (
            <>
              <div className="w-2 h-2 bg-secondary rounded-full mr-2"></div>
              Start Measuring
            </>
          )}
        </span>
      </button>
    </div>
  );
};

export default MeasureButton;
