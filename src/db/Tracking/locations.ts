import LocationRecord, { ILocationRecord } from "./models/LocationRecord";

export async function addLocationRecords(locationRecords: ILocationRecord[]): Promise<ILocationRecord[]> {
    return LocationRecord.create(
        locationRecords
    ).then((record: Array<ILocationRecord>) => {
        return record
    })
}

export async function getAllLocationRecordsOfUser(userId: ILocationRecord['userId'], start: string | undefined, end: string | undefined): Promise<ILocationRecord[]> {
    const time = {
        ...(start && { $gte: new Date(start) }),
        ...(end && { $lt: new Date(end) })
    }
    const conditions = { userId: userId }
    if (Object.keys(time).length)
        return LocationRecord.find({ ...conditions, time: time })
    return LocationRecord.find(conditions).sort({ "time": 1 })
}

export async function getNewestLocationRecords(): Promise<Array<ILocationRecord>> {
    return LocationRecord.find().sort({ "time": -1 }).limit(1000)
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
    return nearbyLocationRecords.sort({ "userId": 1, "time": 1 })
}

function timeStampsToString(start: bigint, end: bigint): string {
    return `${(end - start) / BigInt(1000000)}ms`
}
