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
    const longitude: number = +req.query.longitude
    const latitute: number = +req.query.latitute
    const distance: number = +req.query.distance
    const defaultLongitude: number = 151.20990
    const defaultLatitude: number = -33.865143
    const defaultDistance: number = 500
    if (checkForQueryParams(Array(longitude, latitute, distance))) {
        const records: ILocationRecord[] = await locationsDb.getAllLocationRecords([longitude, latitute], distance)
        res.json(records)
    }
    else {
        const records: ILocationRecord[] = await locationsDb.getAllLocationRecords([defaultLongitude, defaultLatitude], defaultDistance)
        res.json(records)
    }

}

function checkForQueryParams(params: Array<number>) {
    var result: Boolean = true
    params.forEach(param => {
        result = result && !isNaN(param) && isFinite(param)
    });
    return result
}

async function getUserLocationRecord(req: Request, res: Response): Promise<void> {
    const userId: number = parseInt(req.params.userId)
    var startTime: Date = new Date(-8640000000000000)
    var endTime: Date = new Date(8640000000000000)
    if (req.query.start != null) {
        startTime = new Date(req.query.start.toString())
    }
    if (req.query.end != null) {
        endTime = new Date(req.query.end.toString())
    }
    const records: ILocationRecord[] = await locationsDb.getAllLocationRecordsOfUser(userId, startTime, endTime)
    res.json(records)
}

export default { postLocationRecords, getAllLocationRecords, getUserLocationRecord }
