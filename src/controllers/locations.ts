import { Request, Response } from "express";
import * as locationsDb from "../db/locations";
import LocationRecord, { ILocationRecord } from "../db/models/LocationRecord";

export async function postLocationData(req: Request, res: Response): Promise<Response> {
    try {
        const userId: number = parseInt(req.params.userId)
        const record = await LocationRecord.create({
            userId,
            location: req.body.location
        })
        await record.save()
        return res.send()
    } catch (error) {
        console.log("Did not add location record")
        console.error(error)
        return res.status(400).send()
    }
}

export async function getUserLocationData(req: Request, res: Response): Promise<Response> {
    const userId: number = parseInt(req.params.userId)
    const records: ILocationRecord[] = await locationsDb.getAllLocationRecordsOfUser(userId)
    return res.send(JSON.stringify(records))
}