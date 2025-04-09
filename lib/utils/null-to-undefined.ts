/**
 * Converts null values to undefined in an object
 * This is useful for handling database results where null values need to be converted to undefined
 * for component props that expect undefined instead of null
 */
export function nullToUndefined<T>(obj: T): T {
  if (obj === null) {
    return undefined as unknown as T;
  }

  if (typeof obj !== 'object' || obj === null) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(nullToUndefined) as unknown as T;
  }

  const result = { ...obj } as Record<string, any>;
  for (const key in result) {
    if (result[key] === null) {
      result[key] = undefined;
    } else if (typeof result[key] === 'object') {
      result[key] = nullToUndefined(result[key]);
    }
  }

  return result as T;
}