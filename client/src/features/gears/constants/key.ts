export const reservistGearKeys = {
  all: (id: string) => ["reservists", id, "gears"] as const,
  history: (id: string) => [...reservistGearKeys.all(id), "history"] as const,
};
