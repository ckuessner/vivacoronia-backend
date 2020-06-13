import { Request, Response } from "express";
import * as locationsDb from "../db/locations";
import { ILocationRecord } from "../db/models/LocationRecord";

export async function postLocationRecords(req: Request, res: Response): Promise<void> {
    const userId: number = parseInt(req.params.userId)
    if (!Array.isArray(req.body) || isNaN(userId)) {
        res.sendStatus(400)
    } else {
        try {
            // Set userId of each field to userId of request
            req.body.forEach((record: any) => {
                record.userId = userId
            });
            try {
                await locationsDb.addLocationRecords(req.body)
            } catch (e) {
                console.error("Could not create location record from POST body: ", e)
                res.sendStatus(400)
                return
            }
            res.sendStatus(201)
        } catch (error) {
            console.error(error)
            res.sendStatus(400)
        }
    }
}

export async function getAllLocationRecords(_: Request, res: Response): Promise<void> {
    const records: ILocationRecord[] = await locationsDb.getAllLocationRecords()
    res.json(records)
}

export async function getUserLocationRecord(req: Request, res: Response): Promise<void> {
    const userId: number = parseInt(req.params.userId)
    const records: ILocationRecord[] = await locationsDb.getAllLocationRecordsOfUser(userId)
    res.json(records)
}
