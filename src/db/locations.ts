import LocationRecord, { ILocationRecord } from "./models/LocationRecord";

async function addSingleLocationRecord(userId: ILocationRecord['userId'], location: ILocationRecord['location']): Promise<ILocationRecord> {
    return LocationRecord.create({
        userId,
        location
    }).then((record: ILocationRecord) => {
        return record
    }).catch((error: Error) => {
        throw error
    });
}

async function getAllLocationRecordsOfUser(userId: ILocationRecord['userId']): Promise<ILocationRecord[]> {
    return LocationRecord.find({ userId: userId })
}

export {
    addSingleLocationRecord,
    getAllLocationRecordsOfUser
}