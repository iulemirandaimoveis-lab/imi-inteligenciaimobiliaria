/**
 * Validates whether a lat/lng pair is geographically plausible for IMI markets
 * (Brazil, Dubai, USA). Rejects null island (0,0), out-of-range values, and nulls.
 */
export function isValidCoordinate(
    lat: number | null | undefined,
    lng: number | null | undefined,
): boolean {
    if (lat == null || lng == null) return false;
    if (typeof lat !== 'number' || typeof lng !== 'number') return false;
    if (isNaN(lat) || isNaN(lng)) return false;
    if (lat === 0 && lng === 0) return false; // null island
    if (lat < -90 || lat > 90) return false;
    if (lng < -180 || lng > 180) return false;
    return true;
}

/**
 * Splits an array of items into those with valid coordinates and those without.
 * Items without valid coords are counted for the "X imóveis sem localização" UI badge.
 */
export function partitionByCoordinates<
    T extends { location?: { coordinates?: { lat?: number | null; lng?: number | null } } },
>(items: T[]): { withCoords: T[]; withoutCoords: T[] } {
    const withCoords: T[] = [];
    const withoutCoords: T[] = [];

    for (const item of items) {
        const lat = item.location?.coordinates?.lat;
        const lng = item.location?.coordinates?.lng;
        if (isValidCoordinate(lat, lng)) {
            withCoords.push(item);
        } else {
            withoutCoords.push(item);
        }
    }

    return { withCoords, withoutCoords };
}
