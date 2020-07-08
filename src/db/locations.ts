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

export async function getAllLocationRecordsOfUser(userId: ILocationRecord['userId'], start: any, end: any): Promise<ILocationRecord[]> {
    if (start == undefined && end == undefined) {
        return LocationRecord.find({ userId: userId })
    }
    if (start == undefined) {
        const endDate = new Date(end.toString())
        return LocationRecord.find({ userId: userId, "time": { "$lt": endDate } })
    }
    if (end == undefined) {
        const startDate = new Date(start.toString())
        return LocationRecord.find({ userId: userId, "time": { "$gte": startDate } })
    }
    const startDate = new Date(start.toString())
    const endDate = new Date(end.toString())
    return LocationRecord.find({ userId: userId, "time": { "$gte": startDate, "$lt": endDate } })
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
    return nearbyLocationRecords
}

function timeStampsToString(start: bigint, end: bigint): string {
    return `${(end - start) / BigInt(1000000)}ms`
}
