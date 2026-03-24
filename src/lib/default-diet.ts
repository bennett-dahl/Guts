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
};

export function defaultDietSettingsJson() {
  return JSON.stringify(DEFAULT_DIET_SETTINGS);
}
