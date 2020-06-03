import { Request, Response } from "express";
import InfectionRecord from "../db/models/InfectionRecord";

export async function postInfection(req: Request, res: Response): Promise<void> {
    const userId: number = parseInt(req.params.userId)
    console.log(userId)
    if (isNaN(userId)) {
        res.sendStatus(400)
    } else {
        try {
            // Set userId of each field to userId of request
            req.body.userId = userId;

            // TODO verify signature
            // ...
            delete req.body.signature;

            console.log(req.body)
            await InfectionRecord.create(req.body)

            // TODO invoke infection status calculation and notifications in new thread

            res.sendStatus(201)
        } catch (error) {
            console.error(error)
            res.sendStatus(400)
        }
    }
}
