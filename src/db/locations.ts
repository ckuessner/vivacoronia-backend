import LocationRecord, { ILocationRecord } from "./models/LocationRecord";

export async function addLocationRecords(locationRecords: ILocationRecord[]): Promise<ILocationRecord[]> {
    return LocationRecord.create(
        locationRecords
    ).then((record: Array<ILocationRecord>) => {
        return record
    }).catch((error: Error) => {
        throw error
    });
}

export async function getAllLocationRecordsOfUser(userId: ILocationRecord['userId'], start: Date, end: Date): Promise<ILocationRecord[]> {
    return LocationRecord.find({ userId: userId, "time": { "$gte": start, "$lt": end } })
}

export async function getAllLocationRecords(location: [number, number], distance: number): Promise<Array<ILocationRecord>> {

    const timeStart = process.hrtime.bigint()
    const lon = location[0]
    const lat = location[1]

    const nearbyLocationRecords = LocationRecord.aggregate([
        {
            $geoNear: {
                near: { type: "Point", coordinates: [lon, lat] },
                distanceField: "distanceToAdmin",
                maxDistance: distance
            }
        },
    ])

    const timeEnd = process.hrtime.bigint()
    console.log("Execution times: aggregate ", timeStampsToString(timeStart, timeEnd))
    return nearbyLocationRecords
}

function timeStampsToString(start: bigint, end: bigint): string {
    return `${(end - start) / BigInt(1000000)}ms`
}
