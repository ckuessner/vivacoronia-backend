import { Request, Response } from "express";
import { getInfectionStatusOfUser } from "../db/infection";
import InfectionRecord, { IInfectionRecord } from "../db/models/InfectionRecord";
import validateSignature from "../validators/rsaSignatureValidator";
import contacts from "./contacts";

export async function getInfection(req: Request, res: Response): Promise<void> {
    const userId: number = parseInt(req.params.userId);
    if (isNaN(userId)) {
        res.sendStatus(400);
        return;
    }
    const latestInfection = (await getInfectionStatusOfUser(userId))[0];
    res.json(latestInfection);
}

export async function postInfection(req: Request, res: Response): Promise<void> {
    const userId: number = parseInt(req.params.userId);
    if (isNaN(userId)) {
        res.sendStatus(400);
        return;
    }
    try {
        const signature = req.body.signature;
        delete req.body.signature;

        if (!validateSignature(req.body, signature)) {
            res.status(400).send("Signature doesn't match content");
            return;
        }

        req.body.userId = userId;

        let infectionRecord: IInfectionRecord;
        try {
            infectionRecord = await InfectionRecord.create(req.body);
        } catch (error) {
            console.error('Could not create infection record:', error);
            res.sendStatus(400);
            return;
        }

        // Start contact tracing for new infection in background
        contacts.startContactTracing(infectionRecord)

        res.sendStatus(201);
    } catch (error) {
        console.error(error);
        res.sendStatus(400);
    }
}
