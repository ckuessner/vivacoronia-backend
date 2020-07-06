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

export async function getAllLocationRecordsOfUser(userId: ILocationRecord['userId']): Promise<ILocationRecord[]> {
    return LocationRecord.find({ userId: userId })
}

export async function getAllLocationRecords(): Promise<Array<ILocationRecord>> {
    return LocationRecord.find()
}
