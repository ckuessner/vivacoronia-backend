import LocationRecord, { ILocationRecord } from "./models/LocationRecord";

export async function addSingleLocationRecord(userId: ILocationRecord['userId'], location: ILocationRecord['location']): Promise<ILocationRecord> {
    return LocationRecord.create({
        userId,
        location
    }).then((record: ILocationRecord) => {
        return record
    }).catch((error: Error) => {
        throw error
    });
}

export async function getAllLocationRecordsOfUser(userId: ILocationRecord['userId']): Promise<ILocationRecord[]> {
    return LocationRecord.find({ userId: userId })
}

export async function getAllLocationRecords(): Promise<ILocationRecord[]> {
    return LocationRecord.find()
}