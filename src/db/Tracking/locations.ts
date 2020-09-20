import LocationRecord, { ILocationRecord } from "./models/LocationRecord";

const TEN_MINUTES = 10 * 60 * 1000

export async function addLocationRecords(locationRecords: ILocationRecord[]): Promise<ILocationRecord[]> {
    return LocationRecord.create(
        locationRecords
    )
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

export async function getAllLocationRecords(location: [number, number], distance: number, start: Date, end: Date): Promise<Array<ILocationRecord>> {

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
        {
            $match: {
                time: {
                    $gte: start,
                    $lt: end
                }
            }
        },
    ])

    return nearbyLocationRecords.sort({ "userId": 1, "time": 1 })
}


interface UserWithDistance { userId: string, distance: number }
export async function getClosestUser(userIds: string[], location: [number, number]): Promise<UserWithDistance | null> {
    const results = await LocationRecord.aggregate([
        {
            $geoNear: {
                near: { type: "Point", coordinates: location },
                distanceField: "distance",
                query: {
                    $and: [
                        { userId: { $in: userIds } },
                        { time: { $gte: new Date(Date.now() - TEN_MINUTES) } } // Optimization
                    ]
                }
            }
        },
        { $sort: { time: -1 } },
        { $group: { _id: "$userId", distance: { $first: "$distance" }, userId: { $first: "$userId" } } },
        { $sort: { distance: 1 } },
        { $limit: 1 },
    ])

    if (results.length > 0) {
        return results[0] as UserWithDistance
    } else {
        return null
    }
}
