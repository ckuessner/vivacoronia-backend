import LocationRecord, { ILocationRecord } from "./models/LocationRecord"

const EXPOSURE_MAX_DISTANCE = 10 // In meters
const TIME_RANGE_PER_LOCATIONRECORD = 5 * 10000 // In milliseconds

function timeStampsToString(start: bigint, end: bigint): string {
    return `${(end - start) / BigInt(1000000)}ms`
}

export async function findOverlappingUsers(userId: number, infectionDate: Date): Promise<Array<ILocationRecord>> {
    const TIME_DISTANCE = TIME_RANGE_PER_LOCATIONRECORD / 2;

    const timeStart = process.hrtime.bigint()

    const infectedLocations: ILocationRecord[] = await LocationRecord.find({
        userId: userId,
        time: { $gte: infectionDate }
    })

    const timeBeforeMap = process.hrtime.bigint();

    const contactRecordsQueries = infectedLocations.map((infectedLocation: ILocationRecord) => {
        const timeMin = new Date(infectedLocation.time.getTime() - TIME_DISTANCE)
        const timeMax = new Date(infectedLocation.time.getTime() + TIME_DISTANCE)
        const lon = infectedLocation.location.coordinates[0]
        const lat = infectedLocation.location.coordinates[1]

        return LocationRecord.aggregate([
            {
                $geoNear: {
                    near: { type: "Point", coordinates: [lon, lat] },
                    distanceField: "distanceToInfected",
                    maxDistance: EXPOSURE_MAX_DISTANCE,
                    query: {
                        $and: [
                            { time: { $gte: timeMin } },
                            { time: { $lte: timeMax } },
                            { $expr: { $ne: ["$userId", userId] } }]
                    }
                }
            },

        ])
    });
    const timeBeforeAggregate = process.hrtime.bigint();
    const contactRecordsQueryResult = await Promise.all(contactRecordsQueries)

    const timeBeforeFlat = process.hrtime.bigint();
    const contactRecords = contactRecordsQueryResult.flat()

    const timeEnd = process.hrtime.bigint();
    console.log("Execution times: overall ", timeStampsToString(timeStart, timeEnd),
        " | find ", timeStampsToString(timeStart, timeBeforeMap),
        " | map ", timeStampsToString(timeBeforeMap, timeBeforeAggregate),
        " | aggregate ", timeStampsToString(timeBeforeAggregate, timeBeforeFlat),
        " | flat ", timeStampsToString(timeBeforeFlat, timeEnd))

    return contactRecords
}

