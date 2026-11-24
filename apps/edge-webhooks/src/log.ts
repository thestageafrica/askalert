/** Safe structured logs — never include message bodies or phone numbers. */
export function logInfo(
  action: string,
  fields: Record<string, string | number | boolean> = {},
): void {
  console.log(JSON.stringify({ level: 'info', action, ...fields }));
}

export function logError(
  action: string,
  fields: Record<string, string | number | boolean> = {},
): void {
  console.error(JSON.stringify({ level: 'error', action, ...fields }));
}
