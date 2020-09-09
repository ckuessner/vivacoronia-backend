import AchievementRecord, { AchievementStatus, AchievementsInformations, AchievementBadges } from "./models/AchievementRecord";
import UserAccountRecord from "../Users/models/UserAccountRecord";
import { toInteger } from "lodash";

export async function createAchievementsForNewUser(userId: string): Promise<void> {

    // create a record for each achievement for the user
    for (let index = 0; index < AchievementsInformations.length; index++) {
        const info = AchievementsInformations[index];
        await AchievementRecord.create({
            userId: userId,
            name: info.name,
            badge: "none",
            remaining: info.forBronce
        })
    }

    console.log("created achievements for user " + userId)
}

export async function getAchievementStatus(userId: string): Promise<AchievementStatus[]> {

    // get achievements of user from request
    const ach = await AchievementRecord.find({ userId: userId })

    const ret: AchievementStatus[] = []

    // compute for every achievement how many users do have this particular badge or above
    for (let index = 0; index < ach.length; index++) {
        const record = ach[index];

        // count users with better or equal batches than current user from request
        let howmany = 0
        for (let i = AchievementBadges.length - 1; i >= 0; i--) {
            const tmpBadge = AchievementBadges[i]

            howmany += await AchievementRecord.countDocuments({ name: record.name, badge: record.badge })

            // we finish counting if we reach all possible badges that are better or equal than the user badge
            if (tmpBadge === record.badge) break
        }

        // count all user except the rootAdmin (we assume that the rootAdmin does not use the app)
        const user = await UserAccountRecord.countDocuments({ isRootAdmin: false })

        const fraction = howmany == 0 ? 0 : (toInteger)(howmany / user * 100)

        ret.push({
            name: record.name,
            badge: record.badge,
            remaining: record.remaining,
            howmany: fraction
        })
    }

    return ret
}
