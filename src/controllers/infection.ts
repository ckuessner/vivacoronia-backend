import { Request, Response } from "express";
import { getInfectionStatusOfUser } from "../db/infection";
import InfectionRecord from "../db/models/InfectionRecord";
import validateSignature from "../validators/rsaSignatureValidator";

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

        try {
            await InfectionRecord.create(req.body);
        } catch (error) {
            console.error('Could not create infection record:', error);
            res.sendStatus(400);
            return;
        }

        // TODO invoke infection status calculation and notifications in new thread

        res.sendStatus(201);
    } catch (error) {
        console.error(error);
        res.sendStatus(400);
    }
}
