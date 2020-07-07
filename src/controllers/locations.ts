import { Request, Response } from "express";
import * as locationsDb from "../db/Tracking/locations";
import { ILocationRecord } from "../db/Tracking/models/LocationRecord";

async function postLocationRecords(req: Request, res: Response): Promise<void> {
    const userId = req.params.userId

    if (!Array.isArray(req.body)) {
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
    if (req.query.longitude == undefined && req.query.latitute == undefined && req.query.distance == undefined) {
        const records: ILocationRecord[] = await locationsDb.getNewestLocationRecords()
        res.json(records)
        return
    }
    const longitude: number = +req.query.longitude
    const latitude: number = +req.query.latitude
    const distance: number = +req.query.distance
    const longValid: boolean = checkLong(longitude)
    const latValid: boolean = checkLat(latitude)
    const distValid: boolean = checkDist(distance)
    //check if all query parameter exist and are valid
    if (longValid && latValid && distValid) {
        const records: ILocationRecord[] = await locationsDb.getAllLocationRecords([longitude, latitude], distance)
        res.json(records)
    }
    //check if some query parameter exist and is valid
    else {
        res.sendStatus(400)
    }
}

function checkLat(lat: number) {
    return !isNaN(lat) && isFinite(lat) && Math.abs(lat) <= 90
}
function checkLong(long: number) {
    return !isNaN(long) && isFinite(long) && Math.abs(long) <= 180
}
function checkDist(dist: number) {
    return !isNaN(dist) && isFinite(dist) && dist >= 0
}

async function getUserLocationRecord(req: Request, res: Response): Promise<void> {
    const userId = req.params.userId
    const records: ILocationRecord[] = await locationsDb.getAllLocationRecordsOfUser(userId, req.query.start?.toString(), req.query.end?.toString())
    res.json(records)
}

export default { postLocationRecords, getAllLocationRecords, getUserLocationRecord }
