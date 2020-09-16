import { Request, Response } from "express";
import * as achievementDB from "../db/achievements/achievements"

export async function getAchievementsStatus(req: Request, res: Response): Promise<void> {
    const userId = req.params.userId

    try {
        const status = await achievementDB.getAchievementStatus(userId)

        res.json(status)
    }
    catch (err) {
        console.error("Error getting achievements: " + String(err))
        res.status(500).send("Could not get achievements for user")
    }
}

export async function getInfectionScore(req: Request, res: Response): Promise<void> {
    const userId = req.params.userId

    try {
        // get a number as infection score
        const score = await achievementDB.calculateInfectionScore(userId)

        res.json({
            infectionScore: score
        })
    }
    catch (err) {
        console.error("Error getting infectionScore: " + String(err))
    }
}
