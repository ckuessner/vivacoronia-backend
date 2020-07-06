import { Request, Response } from "express";
import * as locationsDb from "../db/locations";
import { ILocationRecord } from "../db/models/LocationRecord";

async function postLocationRecords(req: Request, res: Response): Promise<void> {
    const userId: number = parseInt(req.params.userId)
    if (!Array.isArray(req.body) || isNaN(userId)) {
        res.sendStatus(400)
    } else {
        try {
            // Set userId of each field to userId of request
            req.body.forEach((record: unknown) => {
                if (typeof record == 'object' && record !== null) {
                    (record as ILocationRecord).userId = userId
                }
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

async function getAllLocationRecords(req: Request, res: Response): Promise<void> {
    const records: ILocationRecord[] = await locationsDb.getAllLocationRecords([+req.query.longitude, +req.query.latitute], +req.query.distance)
    res.json(records)
}

async function getUserLocationRecord(req: Request, res: Response): Promise<void> {
    const userId: number = parseInt(req.params.userId)
    const startTime: Date = new Date(req.query.start.toString())
    const endTime: Date = new Date(req.query.end.toString())
    const records: ILocationRecord[] = await locationsDb.getAllLocationRecordsOfUser(userId, startTime, endTime)
    res.json(records)
}

export default { postLocationRecords, getAllLocationRecords, getUserLocationRecord }
