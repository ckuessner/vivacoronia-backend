import ContactRecord, { IContactRecord } from "./models/ContactRecord"
import LocationRecord, { ILocationRecord } from "./models/LocationRecord"

const EXPOSURE_MAX_DISTANCE = 10 // In meters
const TIME_RANGE_PER_LOCATIONRECORD = 20 * 1000 // In milliseconds

interface ILocationRecordGeoQueryResult extends ILocationRecord {
    distanceToInfected: number
}

async function findContacts(userId: String, infectionDate: Date): Promise<Array<IContactRecord>> {
    const TIME_DISTANCE = TIME_RANGE_PER_LOCATIONRECORD / 2;

    const infectedLocations: ILocationRecord[] = await LocationRecord.find({
        userId: userId,
        time: { $gte: infectionDate }
    })

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
            }
        ])
    });

    return (await Promise.all(contactRecordsQueries))
        .flat() // Flatten because each aggregate in contactRecordsQueries returns an array
        .reduce(// Create and return only ContactRecords that aren't duplicates
            contactRecordReducer(userId),
            []
        ) as IContactRecord[]
}

function contactRecordReducer(userId: String) {
    return async function appendCreatedDocumentIfNotExist(
        contacts: Array<IContactRecord>,
        locationRecord: ILocationRecordGeoQueryResult
    ): Promise<Array<IContactRecord>> {
        try {
            const document = await ContactRecord.create({
                infectedUserId: userId,
                userId: locationRecord.userId,
                locationRecord: locationRecord
            })
            contacts.push(document)
        } catch (err) {
            // Is duplicate
        }
        return contacts
    }
}

async function getAllContactRecords(): Promise<Array<IContactRecord>> {
    return ContactRecord.find().populate('locationRecord')
}

async function getAllContactRecordsForIDs(ids: number[]): Promise<Array<IContactRecord>> {
    const idContactRequests = ids.map((id: number) => ContactRecord.find({ $or: [{ userID: id }, { infectedUserId: id }] }).populate('locationRecord'))
    const idContacts = await Promise.all(idContactRequests)
    return idContacts.flat()
}

export default { findContacts, getAllContactRecords, getAllContactRecordsForIDs }
