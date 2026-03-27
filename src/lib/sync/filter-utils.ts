/** Escape a string value for safe use in PocketBase filter expressions */
export function escapeFilterValue(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}
