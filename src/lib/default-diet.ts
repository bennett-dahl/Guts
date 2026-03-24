import { isValidDiscoverDiet } from "@/lib/spoonacular-filters";

/** Bulsiewicz-inspired defaults (wellness template — not medical advice). */
export const DEFAULT_DIET_SETTINGS = {
  template: "fiber_fueled" as const,
  plantWeeklyGoal: 30,
  countHerbsAsPlants: true,
  fiberDailyGoal: 35,
  rampMode: false,
  minLegumesWeek: 3,
  minWholeGrainsWeek: 5,
  minFermentsWeek: 4,
  /** Spoonacular `diet` param, or "" for any (includes meat/fish). */
  discoverDefaultDiet: "",
  /** Default search query on Discover; plant-leaning without excluding omnivore hits. */
  discoverDefaultQuery: "vegetables",
};

export type DietSettingsStored = typeof DEFAULT_DIET_SETTINGS;

export function defaultDietSettingsJson() {
  return JSON.stringify(DEFAULT_DIET_SETTINGS);
}

export function parseDietSettings(raw: string): Partial<DietSettingsStored> {
  try {
    return JSON.parse(raw) as Partial<DietSettingsStored>;
  } catch {
    return {};
  }
}

/** Merged Discover defaults for API + UI (profile may omit keys). */
export function getDiscoverSearchDefaults(
  settingsRaw: string | null | undefined,
): { diet: string; query: string } {
  const parsed = settingsRaw ? parseDietSettings(settingsRaw) : {};
  const diet =
    typeof parsed.discoverDefaultDiet === "string" &&
    isValidDiscoverDiet(parsed.discoverDefaultDiet)
      ? parsed.discoverDefaultDiet
      : DEFAULT_DIET_SETTINGS.discoverDefaultDiet;

  let query: string;
  if (
    !("discoverDefaultQuery" in parsed) ||
    parsed.discoverDefaultQuery === null ||
    parsed.discoverDefaultQuery === undefined
  ) {
    query = DEFAULT_DIET_SETTINGS.discoverDefaultQuery;
  } else if (typeof parsed.discoverDefaultQuery === "string") {
    query = parsed.discoverDefaultQuery.slice(0, 120).trim();
  } else {
    query = DEFAULT_DIET_SETTINGS.discoverDefaultQuery;
  }

  return { diet, query };
}
