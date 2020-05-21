import { Request, Response } from "express";
import * as locationsDb from "../db/locations";
import LocationRecord, { ILocationRecord } from "../db/models/LocationRecord";

export async function postLocationRecord(req: Request, res: Response): Promise<Response> {
    try {
        const userId: number = parseInt(req.params.userId)
        const record = await LocationRecord.create({
            userId,
            location: req.body.location
        })
        await record.save()
        return res.sendStatus(201)
    } catch (error) {
        console.log("Did not add location record")
        console.error(error)
        return res.sendStatus(400)
    }
}

export async function getAllLocationRecords(_: Request, res: Response): Promise<Response> {
    const records: ILocationRecord[] = await locationsDb.getAllLocationRecords()
    return res.json(records)
}

export async function getUserLocationRecord(req: Request, res: Response): Promise<Response> {
    const userId: number = parseInt(req.params.userId)
    const records: ILocationRecord[] = await locationsDb.getAllLocationRecordsOfUser(userId)
    return res.json(records)
}