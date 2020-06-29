import { Request, Response } from "express";
import { isString } from "util";
import { getInfectionStatusOfUser } from "../db/Tracking/infection";
import InfectionRecord, { IInfectionRecord } from "../db/Tracking/models/InfectionRecord";
import { validateJWT } from "../validators/jsonWebTokenValidator";
import validateSignature from "../validators/rsaSignatureValidator";
import contacts from "./contacts";

export async function getInfection(req: Request, res: Response): Promise<void> {
    const userId: String = req.params.userId;
    const latestInfection = (await getInfectionStatusOfUser(userId));
    if (latestInfection.length == 0) {
        res.sendStatus(404);
        return;
    }
    res.json(latestInfection[0]);
}

export async function postInfection(req: Request, res: Response): Promise<void> {
    const userId: String = req.params.userId;
    const body = req.body as Record<string, unknown>

    if (typeof body.signature !== 'string') {
        res.sendStatus(400);
        return;
    }

    if (!isString(req.headers.jwt)) {
        console.error("Invalid JWT format")
        res.sendStatus(400)
        return
    }
    const token: String = req.headers.jwt;

    if (!validateJWT(token, userId)) {
        // invalid token
        console.error("Invalid JWT or userID")
        res.sendStatus(400)
        return
    }

    try {
        const signature = body.signature;
        delete body.signature;

        if (!validateSignature(req.body, signature)) {
            res.status(400).send("Signature doesn't match content");
            return;
        }

        body.userId = userId;

        let infectionRecord: IInfectionRecord;
        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            infectionRecord = await InfectionRecord.create(body as any);
        } catch (error) {
            console.error('Could not create infection record:', error);
            res.sendStatus(400);
            return;
        }

        if (infectionRecord.newStatus === "infected") {
            // Start contact tracing for new infection in background
            void contacts.startContactTracing(infectionRecord)
        }

        res.sendStatus(201);
    } catch (error) {
        console.error(error);
        res.sendStatus(400);
    }
}
