import React from "react";
import { useMeasuring } from "../../hooks";

const MeasureButton: React.FC = () => {
  const { isMeasuring, toggleMeasuring, loading } = useMeasuring();
  return (
    <div className="flex justify-center hover:scale-105 transition-all active:scale-95">
      <button
        onClick={toggleMeasuring}
        disabled={loading}
        className={`relative inline-flex h-12 w-48 overflow-hidden rounded-full p-[1px] focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 focus:ring-offset-slate-50 transition-all duration-300 ${
          isMeasuring ? "shadow-lg shadow-purple-500/25" : ""
        } ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
      >
        {isMeasuring && (
          <span className="absolute inset-[-1000%] animate-[spin_2s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#E2CBFF_0%,#393BB2_50%,#E2CBFF_100%)]" />
        )}
        <span
          className={`inline-flex h-full w-full cursor-pointer items-center justify-center rounded-full px-6 py-1 text-sm font-medium backdrop-blur-3xl transition-all duration-300 ${
            isMeasuring
              ? "bg-slate-950 text-white"
              : "bg-white text-slate-950 border border-slate-300 hover:bg-slate-50"
          }`}
        >
          {loading ? (
            <>
              <div className="w-2 h-2 bg-warning-400 rounded-full mr-2 animate-bounce"></div>
              Loading...
            </>
          ) : isMeasuring ? (
            <>
              <div className="w-2 h-2 bg-success-400 rounded-full mr-2 animate-pulse"></div>
              Measuring
            </>
          ) : (
            <>
              <div className="w-2 h-2 bg-primary-100 rounded-full mr-2"></div>
              Start Measuring
            </>
          )}
        </span>
      </button>
    </div>
  );
};

export default MeasureButton;
