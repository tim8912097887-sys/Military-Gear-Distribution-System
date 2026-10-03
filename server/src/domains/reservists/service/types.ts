export type CacheClientType = {
  get: (key: string) => Promise<string | null>;
  set: (
    key: string,
    value: string,
    options?: { expiration: { type: 'EX' | 'PX' | 'EXAT' | 'PXAT'; value: number } },
  ) => Promise<string | null>;
};
