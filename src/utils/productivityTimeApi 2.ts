import { invoke } from "@tauri-apps/api/core";

export interface ProductivityTimeResponse {
  success: boolean;
  message: string;
  user_id: string;
  date: string;
  data: Record<string, number>;
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

function generateMockProductivityTime(date: string): ProductivityTimeResponse {
  const categories = [
    "Communication",
    "Meetings",
    "Docs and Writing",
    "Productivity and Planning",
    "Browsing and Research",
    "Development",
    "Design and Creative",
    "Data and Analytics",
    "Media and Entertainment",
    "Other",
  ];

  const seed = hashStringToU32(`${date}|cognivibe-mock-productivity`);
  const rand = mulberry32(seed);

  const categoryCounts: Record<string, number> = {};
  const totalMinutes = 480; // 8 hours
  let remaining = totalMinutes;

  // Different categories get different base distributions
  const baseWeights: Record<string, number> = {
    Development: 0.25,
    Communication: 0.15,
    Meetings: 0.10,
    "Docs and Writing": 0.12,
    "Productivity and Planning": 0.08,
    "Browsing and Research": 0.10,
    "Design and Creative": 0.05,
    "Data and Analytics": 0.05,
    "Media and Entertainment": 0.05,
    Other: 0.05,
  };

  categories.forEach((category, i) => {
    const baseWeight = baseWeights[category] || 0.05;
    const weight = baseWeight * (0.8 + rand() * 0.4); // ±20% variation
    const minutes =
      i === categories.length - 1
        ? Math.max(0, remaining) // Last category gets remaining time
        : Math.round(totalMinutes * weight);
    remaining -= minutes;
    categoryCounts[category] = minutes;
  });

  return {
    success: true,
    message: "Mock productivity time data (web)",
    user_id: "local-demo-user",
    date,
    data: categoryCounts,
  };
}

/**
 * Fetches productivity time data from the server API
 * Note: API base URL is read from VITE_SERVER_URL environment variable in Rust
 * Note: userId and jwtToken will be retrieved from app state in Rust
 * @param date - Date in ISO format (e.g., "2025-01-28")
 * @returns Promise with the productivity time response
 */
export async function fetchProductivityTime(
  date: string
): Promise<ProductivityTimeResponse> {
  const useMock = envTruthy(import.meta.env.VITE_USE_MOCK_DATA);

  // When running `npm run dev` (web), Tauri commands are unavailable.
  // In that case, allow a demo mode so the dashboard UI can still be tested.
  if (!isTauriRuntime()) {
    if (useMock) {
      return generateMockProductivityTime(date);
    }
    throw new Error(
      "Productivity time requires the Tauri desktop runtime. Run `npm run tauri:dev`, or set `VITE_USE_MOCK_DATA=1` to simulate dashboard data in web dev."
    );
  }

  try {
    const response = await invoke<ProductivityTimeResponse>(
      "fetch_productivity_time_cmd",
      {
        date,
      }
    );

    console.log("Productivity time fetched successfully:", response);
    return response;
  } catch (error) {
    console.error("Failed to fetch productivity time:", error);
    throw error;
  }
}
