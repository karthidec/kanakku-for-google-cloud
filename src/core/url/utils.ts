/**
 * Decodes a single URL path segment, returning null if empty or malformed.
 */
export function decodeSegment(raw: string | undefined): string | null {
  if (!raw) {
    return null;
  }

  try {
    const decoded = decodeURIComponent(raw).trim();
    return decoded.length > 0 ? decoded : null;
  } catch {
    return null;
  }
}

/**
 * Splits a URL pathname into non-empty raw segments.
 */
export function getPathSegments(pathname: string): string[] {
  return pathname.split('/').filter((segment) => segment.length > 0);
}
