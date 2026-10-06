export function formatHistoryDate(value: string): string {
  return new Date(value).toLocaleString();
}
