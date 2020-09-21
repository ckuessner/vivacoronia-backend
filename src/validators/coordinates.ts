export function checkLat(latitude: number): boolean {
    return !isNaN(latitude) && isFinite(latitude) && Math.abs(latitude) <= 90
}

export function checkLon(longitude: number): boolean {
    return !isNaN(longitude) && isFinite(longitude) && Math.abs(longitude) <= 180
}

export function checkDist(dist: number): boolean {
    return !isNaN(dist) && isFinite(dist) && dist >= 0
}

export function checkCoordinatePair(coord: number[]): boolean {
    return Array.isArray(coord)
        && coord.length === 2
        && checkLon(coord[0])
        && checkLat(coord[1])
}
