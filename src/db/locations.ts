import LocationRecord, { ILocationRecord } from "./models/LocationRecord";

interface LocationRecordInput {
    userId: number;
    time: Date;
    location: {
        coordinates: LocationFieldInput;
    };
}

interface LocationFieldInput {
    coordinates: Array<number>;
}

export async function addLocationRecords(locationRecords: LocationRecordInput[]): Promise<ILocationRecord> {
    return LocationRecord.create(
        // There is an error in the type definitions for mongoose
        // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
        // @ts-ignore
        locationRecords
    ).then((record: ILocationRecord) => {
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
