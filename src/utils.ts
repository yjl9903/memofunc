export function isPrimitiveType(value: unknown) {
  return (typeof value !== 'object' && typeof value !== 'function') || value === null;
}
