import { invoke } from "@tauri-apps/api/core";

export interface DateRange {
  start: string;
  end: string;
}

export interface MissingDataPoint {
  timestamp: string;
  score_total: number | null;
  score_focus: number | null;
  score_strain: number | null;
  score_energy: number | null;
}

export interface BatchScoresResponse {
  success: boolean;
  message: string;
  user_id: string;
  date_range: DateRange;
  data: any; // Replace with actual data structure when known
  missing_data: MissingDataPoint[];
}

function envTruthy(value: unknown): boolean {
  if (typeof value !== "string") return false;
  switch (value.trim().toLowerCase()) {
    case "1":
    case "true":
    case "yes":
    case "y":
    case "on":
      return true;
    default:
      return false;
  }
}

function isTauriRuntime(): boolean {
  // Tauri injects globals; this is a lightweight runtime check for `npm run dev` (web).
  const w = globalThis as unknown as { __TAURI__?: unknown; __TAURI_INTERNALS__?: unknown };
  return Boolean(w.__TAURI__ || w.__TAURI_INTERNALS__);
}

function clamp0to100(v: number): number {
  if (!Number.isFinite(v)) return 0;
  return Math.max(0, Math.min(100, v));
}

function hashStringToU32(input: string): number {
  // FNV-1a 32-bit
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

function mulberry32(seed: number): () => number {
  // Deterministic PRNG in [0,1)
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function minutesToMs(minutes: number): number {
  return minutes * 60 * 1000;
}

function generateMockBatchScores(startDate: string, endDate: string): BatchScoresResponse {
  // Simulate a “realistic” workday: 10:00–19:00 UTC with a few gaps.
  const start = new Date(`${startDate}T10:00:00.000Z`);
  const end = new Date(`${endDate}T19:00:00.000Z`);

  const points: Array<{
    timestamp: string;
    score_total: number;
    score_frustration: number;
    score_pressure: number;
    score_concentration: number;
  }> = [];

  const fiveMin = 5 * 60 * 1000;
  const seed = hashStringToU32(`${startDate}|${endDate}|cognivibe-mock`);
  const rand = mulberry32(seed);

  // Fixed gaps (minutes since midnight UTC)
  const fixedGaps = [
    { startMin: 12 * 60 + 15, endMin: 12 * 60 + 55 }, // lunch-ish
    { startMin: 14 * 60 + 40, endMin: 15 * 60 + 10 }, // meeting
    { startMin: 16 * 60 + 20, endMin: 16 * 60 + 35 }, // short break
  ];

  // Add 1–2 deterministic “random” gaps per day for variety
  const randomGapsCount = rand() > 0.35 ? 2 : 1;
  const randomGaps: Array<{ startMin: number; endMin: number }> = [];
  for (let i = 0; i < randomGapsCount; i++) {
    const startWindowMin = 10 * 60 + 20; // after 10:20
    const endWindowMin = 18 * 60; // before 18:00
    const span = endWindowMin - startWindowMin;
    const startMin =
      startWindowMin + Math.floor((rand() * span) / 5) * 5; // align to 5m
    const durationMin = 10 + Math.floor((rand() * 25) / 5) * 5; // 10..35
    randomGaps.push({ startMin, endMin: startMin + durationMin });
  }

  const isInGap = (dt: Date): boolean => {
    const mins = dt.getUTCHours() * 60 + dt.getUTCMinutes();
    for (const g of fixedGaps) {
      if (mins >= g.startMin && mins < g.endMin) return true;
    }
    for (const g of randomGaps) {
      if (mins >= g.startMin && mins < g.endMin) return true;
    }
    return false;
  };

  // Random-walk state for “chaotic but smooth-ish” series.
  let rwFocus = (rand() * 2 - 1) * 2;
  let rwFrus = (rand() * 2 - 1) * 2;
  let rwPress = (rand() * 2 - 1) * 2;
  const drift = () => rand() * 2 - 1;

  for (let t = start.getTime(); t <= end.getTime(); t += fiveMin) {
    const dt = new Date(t);
    if (isInGap(dt)) continue;

    // Normalize within the simulated work window for day-shape (0..1)
    const minsSinceStart = (t - start.getTime()) / minutesToMs(1);
    const workMinutes = (end.getTime() - start.getTime()) / minutesToMs(1);
    const u = workMinutes > 0 ? minsSinceStart / workMinutes : 0;
    const phase = u * 2 * Math.PI;

    // Chaotic-ish: deterministic random walk + time-of-day shape.
    rwFocus = rwFocus * 0.86 + drift() * 0.75;
    rwFrus = rwFrus * 0.83 + drift() * 0.9;
    rwPress = rwPress * 0.85 + drift() * 0.8;

    const spikeChance = rand();
    const spike = spikeChance > 0.992 ? (rand() * 2 - 1) * 18 : 0; // rare spikes

    // Day shape: focus peaks mid-morning then dips slightly; pressure/frustration rise afternoon.
    const baseFocus = 74 + 8 * Math.sin(phase * 1.1) - 10 * Math.max(0, u - 0.65);
    const baseFrus = 32 + 10 * Math.sin(phase * 1.7 + 1.1) + 14 * Math.max(0, u - 0.55);
    const basePress = 40 + 12 * Math.sin(phase * 0.9 + 2.2) + 16 * Math.max(0, u - 0.5);

    const score_concentration = clamp0to100(
      baseFocus + rwFocus * 6 + spike * 0.25,
    );
    const score_frustration = clamp0to100(
      baseFrus + rwFrus * 8 + spike * 0.7,
    );
    const score_pressure = clamp0to100(
      basePress + rwPress * 7 + spike * 0.35,
    );
    const score_total = clamp0to100(
      0.42 * score_frustration +
        0.42 * score_pressure +
        0.16 * (100 - score_concentration),
    );

    points.push({
      timestamp: dt.toISOString(),
      score_total,
      score_frustration,
      score_pressure,
      score_concentration,
    });
  }

  return {
    success: true,
    message: "Mock dashboard data (web)",
    user_id: "local-demo-user",
    date_range: { start: startDate, end: endDate },
    data: points,
    missing_data: [],
  };
}

/**
 * Fetches batch scores from the server API
 * Note: API base URL is read from VITE_SERVER_URL environment variable in Rust
 * Note: userId and jwtToken will be retrieved from app state in Rust
 * @param startDate - Start date in ISO format (e.g., "2024-01-01")
 * @param endDate - End date in ISO format (e.g., "2024-01-31")
 * @returns Promise with the batch scores response
 */
export async function fetchBatchScores(
  startDate: string,
  endDate: string
): Promise<BatchScoresResponse> {
  console.log("[BATCH_SCORES_API] Fetching batch scores:", { startDate, endDate });
  const useMock = envTruthy(import.meta.env.VITE_USE_MOCK_DATA);

  // When running `npm run dev` (web), Tauri commands are unavailable.
  // In that case, allow a demo mode so the dashboard UI can still be tested.
  if (!isTauriRuntime()) {
    if (useMock) {
      return generateMockBatchScores(startDate, endDate);
    }
    throw new Error(
      "Batch scores require the Tauri desktop runtime. Run `npm run tauri:dev`, or set `VITE_USE_MOCK_DATA=1` to simulate dashboard data in web dev.",
    );
  }

  try {
    console.log("[BATCH_SCORES_API] Invoking Tauri command fetch_batch_scores_cmd...");
    const response = await invoke<BatchScoresResponse>(
      "fetch_batch_scores_cmd",
      {
        startDate,
        endDate,
      }
    );

    console.log("[BATCH_SCORES_API] ✅ Batch scores fetched successfully:", {
      success: response.success,
      dataCount: response.data?.length || 0,
      hasMissingData: !!response.missing_data,
    });
    return response;
  } catch (error) {
    console.error("[BATCH_SCORES_API] ❌ Failed to fetch batch scores:", error);
    if (error instanceof Error) {
      console.error("[BATCH_SCORES_API] Error details:", {
        message: error.message,
        stack: error.stack,
      });
    }
    throw error;
  }
}

// Example usage:
// const scores = await fetchBatchScores(
//   '2024-01-01',
//   '2024-01-31'
// );
