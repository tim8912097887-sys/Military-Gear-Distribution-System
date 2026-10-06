export const reservistGearKeys = {
  all: (id: string) => ["reservists", id, "gears"] as const,
  history: (id: string, offset: number) =>
    [...reservistGearKeys.all(id), "history", offset] as const,
};
