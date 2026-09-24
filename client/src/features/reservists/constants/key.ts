export const reservistKeys = {
  all: ["reservists"] as const,

  lists: () => [...reservistKeys.all, "list"] as const,

  list: (search: string) => [...reservistKeys.lists(), { search }] as const,

  details: () => [...reservistKeys.all, "detail"] as const,

  detail: (id: string) => [...reservistKeys.details(), id] as const,
};

export const INITIAL_LIMIT = 3;
export const INCREMENT_LIMIT = 3;
