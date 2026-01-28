import { fetch } from "@tauri-apps/plugin-http";
import { getApiBaseUrl } from "./apiConfig";
import { createSupabaseClient } from "./createSupabaseClient";

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
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function generateUUID(rand: () => number): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (rand() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function generateMockSessions(startDate: string, endDate: string): FetchSessionsResponse {
  const sessions: SessionData[] = [];

  // Categories for realistic distribution
  const categories = [
    "Development",
    "Communication",
    "Meetings",
    "Docs and Writing",
    "Productivity and Planning",
    "Browsing and Research",
    "Design and Creative",
    "Data and Analytics",
    "Media and Entertainment",
    "Other",
  ];

  // Generate sessions for each day in the range
  const start = new Date(`${startDate}T00:00:00.000Z`);
  const end = new Date(`${endDate}T23:59:59.999Z`);
  
  for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
    const dateStr = date.toISOString().split("T")[0];
    const daySeed = hashStringToU32(`${dateStr}|cognivibe-mock-sessions`);
    const dayRand = mulberry32(daySeed);

    // Generate 2-4 sessions per day, spread evenly across the day
    const sessionCount = 2 + Math.floor(dayRand() * 3);
    
    // Distribute sessions evenly across the 9-hour window (10:00-19:00 UTC)
    const dayStartHour = 10;
    const dayEndHour = 19;
    const dayDurationHours = dayEndHour - dayStartHour;
    const timeSlots = sessionCount + 1; // +1 to create gaps between sessions
    
    for (let i = 0; i < sessionCount; i++) {
      // Distribute sessions evenly with some randomness
      const slotPosition = (i + 1) / timeSlots; // Position in the day (0-1)
      const baseHour = dayStartHour + slotPosition * dayDurationHours;
      
      // Add some randomness (±30 minutes) but keep them spread out
      const randomOffset = (dayRand() - 0.5) * 0.5; // -0.25 to +0.25 hours
      const startHour = Math.floor(baseHour + randomOffset);
      const startMinute = Math.floor(((baseHour + randomOffset) % 1) * 60);
      
      // Clamp to valid range
      const clampedHour = Math.max(dayStartHour, Math.min(dayEndHour - 1, startHour));
      const clampedMinute = Math.max(0, Math.min(59, startMinute));
      
      const timestampStart = new Date(`${dateStr}T${String(clampedHour).padStart(2, "0")}:${String(clampedMinute).padStart(2, "0")}:00.000Z`);
      
      // Session duration: 45 minutes to 2.5 hours (shorter to avoid overlap)
      const durationMinutes = 45 + Math.floor(dayRand() * 105); // 45-150 minutes
      const timestampEnd = new Date(timestampStart.getTime() + durationMinutes * 60 * 1000);
      
      // Skip if session extends beyond the date range
      if (timestampEnd > end) continue;

      // Generate cognitive load score (0-100)
      // Morning sessions tend to have lower load, afternoon higher
      const timeOfDay = timestampStart.getUTCHours();
      let baseScore = 40;
      if (timeOfDay >= 9 && timeOfDay < 12) {
        baseScore = 30 + dayRand() * 25; // Morning: 30-55
      } else if (timeOfDay >= 12 && timeOfDay < 15) {
        baseScore = 45 + dayRand() * 30; // Midday: 45-75
      } else {
        baseScore = 50 + dayRand() * 40; // Afternoon: 50-90
      }
      const scoreTotal = Math.round(Math.max(0, Math.min(100, baseScore + (dayRand() - 0.5) * 10)));

      // Generate category share (top 2-3 categories)
      const topCategoryCount = 2 + Math.floor(dayRand() * 2); // 2 or 3 categories
      const selectedCategories: string[] = [];
      const remainingCategories = [...categories];
      
      for (let j = 0; j < topCategoryCount; j++) {
        const idx = Math.floor(dayRand() * remainingCategories.length);
        selectedCategories.push(remainingCategories.splice(idx, 1)[0]);
      }

      // Assign percentages (must sum to 100)
      const percentages: number[] = [];
      let remaining = 100;
      for (let j = 0; j < selectedCategories.length - 1; j++) {
        const pct = Math.floor(dayRand() * remaining * 0.7) + Math.floor(remaining * 0.3);
        percentages.push(pct);
        remaining -= pct;
      }
      percentages.push(remaining); // Last category gets the remainder

      const categoryShare: Record<string, number> = {};
      selectedCategories.forEach((cat, idx) => {
        categoryShare[cat] = percentages[idx];
      });

      // Ensure all categories sum to 100
      const total = Object.values(categoryShare).reduce((sum, val) => sum + val, 0);
      if (total !== 100) {
        const diff = 100 - total;
        categoryShare[selectedCategories[0]] = (categoryShare[selectedCategories[0]] || 0) + diff;
      }

      sessions.push({
        id: generateUUID(dayRand),
        timestamp_start: timestampStart.toISOString(),
        timestamp_end: timestampEnd.toISOString(),
        length: durationMinutes * 60, // in seconds
        score_total: scoreTotal,
        category_share: categoryShare,
      });
    }
  }

  // Sort by timestamp_start
  sessions.sort((a, b) => 
    new Date(a.timestamp_start).getTime() - new Date(b.timestamp_start).getTime()
  );

  return {
    success: true,
    message: "Mock sessions data (web)",
    data: sessions,
  };
}

export interface QuestionnaireScores {
  oa?: number;
  ft1?: number;
  ft2?: number;
  wom?: number;
  wot?: number;
  fo1?: number;
  fo2?: number;
}

export interface SessionData {
  id: string;
  timestamp_start: string;
  timestamp_end: string;
  length: number;
  score_total: number | null;
  category_share: Record<string, number>;
}

export interface FetchSessionsResponse {
  success: boolean;
  message: string;
  data: SessionData[];
  error?: string;
}

export interface EndSessionResponse {
  success: boolean;
  message: string;
  data?: {
    session_id: string;
    timestamp_start: string;
    timestamp_end: string;
    length: number;
    category_share: Record<string, number>;
    score_total: number | null;
    score_frustration: number | null;
    score_pressure: number | null;
    score_concentration: number | null;
  };
  error?: string;
}

/**
 * Ends a session with optional questionnaire scores.
 * This function calls the session end API endpoint and includes survey responses.
 *
 * @param sessionId - The UUID of the session to end
 * @param scores - Optional questionnaire scores to include with the session
 * @returns Promise with the end session response
 */
export async function endSessionWithSurvey(
  sessionId: string,
  scores?: QuestionnaireScores
): Promise<EndSessionResponse> {
  console.log("[SESSION] Starting endSessionWithSurvey", {
    sessionId,
    hasScores: !!scores,
    scoreKeys: scores ? Object.keys(scores) : [],
  });

  try {
    const supabase = createSupabaseClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      console.error("[SESSION] ❌ No session found - authentication required");
      throw new Error("Authentication required. Please log in again.");
    }

    console.log("[SESSION] ✅ Session found, proceeding with end request");

    const baseUrl = getApiBaseUrl();
    const url = `${baseUrl}/api/sessions/${sessionId}/end`;

    console.log("[SESSION] Sending POST request to:", url);

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        survey_scores: scores,
      }),
    });

    console.log("[SESSION] Response status:", response.status, response.statusText);

    const result = await response.json();
    console.log("[SESSION] Response data:", result);

    if (!response.ok) {
      console.error("[SESSION] ❌ HTTP error response:", {
        status: response.status,
        error: result.error,
        message: result.message,
      });
      throw new Error(
        result.error || result.message || `HTTP error! status: ${response.status}`
      );
    }

    if (!result.success) {
      console.error("[SESSION] ❌ API returned success=false:", {
        error: result.error,
        message: result.message,
      });
      throw new Error(result.error || result.message || "Failed to end session");
    }

    console.log("[SESSION] ✅ Session ended successfully:", {
      session_id: result.data?.session_id,
      length: result.data?.length,
    });

    return result;
  } catch (error) {
    console.error("[SESSION] ❌ Exception in endSessionWithSurvey:", error);
    if (error instanceof Error) {
      console.error("[SESSION] Error details:", {
        message: error.message,
        stack: error.stack,
      });
    }
    throw error;
  }
}

/**
 * Fetches sessions for a given date range.
 * Returns completed sessions with their cognitive load scores and category breakdown.
 *
 * @param startDate - Start date in YYYY-MM-DD format
 * @param endDate - End date in YYYY-MM-DD format
 * @returns Promise with the sessions data
 */
export async function fetchSessions(
  startDate: string,
  endDate: string
): Promise<FetchSessionsResponse> {
  console.log("[SESSION] Starting fetchSessions", { startDate, endDate });
  const useMock = envTruthy(import.meta.env.VITE_USE_MOCK_DATA);
  const isDev = import.meta.env.DEV;

  // If mock mode is enabled, use mock data directly (skip API call)
  if (useMock) {
    console.log("[SESSION] Using mock sessions data (mock mode enabled)");
    return generateMockSessions(startDate, endDate);
  }

  // When running `npm run dev` (web), Tauri commands are unavailable.
  // In that case, allow a demo mode so the dashboard UI can still be tested.
  if (!isTauriRuntime()) {
    return {
      success: false,
      message: "Sessions require the Tauri desktop runtime. Run `npm run tauri:dev`, or set `VITE_USE_MOCK_DATA=1` to simulate dashboard data in web dev.",
      data: [],
      error: "Tauri runtime required",
    };
  }

  // In development, use mock data if API fails or returns empty
  const shouldUseMockFallback = isDev;

  try {
    const supabase = createSupabaseClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      console.error("[SESSION] ❌ No session found - authentication required");
      return {
        success: false,
        message: "Authentication required",
        data: [],
        error: "Authentication required. Please log in again.",
      };
    }

    console.log("[SESSION] ✅ Session found, fetching sessions");

    const baseUrl = getApiBaseUrl();
    const url = `${baseUrl}/api/sessions?start_date=${startDate}&end_date=${endDate}`;

    console.log("[SESSION] Sending GET request to:", url);

    let response;
    try {
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error("Request timeout after 5 seconds")), 5000);
      });

      const fetchPromise = fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      response = await Promise.race([fetchPromise, timeoutPromise]);
      console.log("[SESSION] Response received, status:", response.status, response.statusText);
    } catch (fetchError) {
      console.error("[SESSION] ❌ Fetch error:", fetchError);
      // If API fails and mock/dev mode is enabled, fall back to mock data
      if (shouldUseMockFallback) {
        console.log("[SESSION] Falling back to mock data due to fetch error");
        return generateMockSessions(startDate, endDate);
      }
      return {
        success: false,
        message: "Failed to fetch sessions",
        data: [],
        error: fetchError instanceof Error ? fetchError.message : "Unknown error",
      };
    }

    const result = await response.json();
    console.log("[SESSION] Response data:", {
      success: result.success,
      count: result.data?.length || 0,
    });

    if (!response.ok) {
      console.error("[SESSION] ❌ HTTP error response:", {
        status: response.status,
        error: result.error,
      });
      // If API fails and mock/dev mode is enabled, fall back to mock data
      if (shouldUseMockFallback) {
        console.log("[SESSION] Falling back to mock data due to HTTP error");
        return generateMockSessions(startDate, endDate);
      }
      return {
        success: false,
        message: result.message || "Failed to fetch sessions",
        data: [],
        error: result.error || `HTTP error! status: ${response.status}`,
      };
    }

    // If API returns empty array and mock/dev mode is enabled, use mock data
    if (shouldUseMockFallback && (!result.data || result.data.length === 0)) {
      console.log("[SESSION] API returned empty array, using mock data instead");
      return generateMockSessions(startDate, endDate);
    }

    console.log("[SESSION] ✅ Sessions fetched successfully:", {
      count: result.data?.length || 0,
    });

    return {
      success: true,
      message: result.message || "Sessions retrieved successfully",
      data: result.data || [],
    };
  } catch (error) {
    console.error("[SESSION] ❌ Exception in fetchSessions:", error);
    if (error instanceof Error) {
      console.error("[SESSION] Error details:", {
        message: error.message,
        stack: error.stack,
      });
    }
    return {
      success: false,
      message: "Failed to fetch sessions",
      data: [],
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
