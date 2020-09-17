import AchievementRecord, { AchievementStatus, AchievementsInformations, AchievementBadges, AchievementNameType } from "./models/AchievementRecord";
import UserAccountRecord from "../Users/models/UserAccountRecord";
import { toInteger, isEmpty, isNull } from "lodash";
import LocationRecord, { ILocationRecord } from "../Tracking/models/LocationRecord";
import ContactRecord from "../Tracking/models/ContactRecord"
import { getInfectionStatusOfUser } from "../Tracking/infection"
import notifications from "../../controllers/notifications";

export async function calculateInfectionScore(userId: string): Promise<number> {
    console.log("Infection Score for " + userId)
    return 0.4
}

export async function createAchievementsForNewUser(userId: string): Promise<void> {

    // create a record for each achievement for the user
    for (let index = 0; index < AchievementsInformations.length; index++) {
        const info = AchievementsInformations[index];
        await AchievementRecord.create({
            userId: userId,
            name: info.name,
            badge: "none",
            remaining: info.bronce
        })
    }

    console.log("created achievements for user " + userId)
}

export async function updateForeverAlone(userId: string, date: Date): Promise<void> {
    // increases if the user does not have contact with infected persons over a long period of time
    // you cannot skip from none to gold or bronce to gold 

    const locIds = (await ContactRecord.find({ userId: userId }, { locationRecord: 1 })).map(r => r.locationRecord)
    //console.log("locIds ", locIds)
    const locRecs = await LocationRecord.find({ _id: { $in: locIds } }).sort({ time: -1 })
    console.log("locRecs ", locRecs)

    if (locRecs.length > 0) {
        // millsecs from 1970-1-1
        const dayDiff = date.valueOf() - new Date(locRecs[0].time).valueOf()
        const days = Math.floor(dayDiff / 1000 / 60 / 60 / 24)
        console.log("dayDiff ", days)

        await updateAchievement(userId, "foreveralone", days)
    }
}

export async function updateZombie(userId: string, locations: ILocationRecord[]): Promise<void> {
    // infection dates descending
    const infectionDates = await getInfectionStatusOfUser(userId)

    // location records ascending
    const sortedLocations = locations.sort((a: ILocationRecord, b: ILocationRecord) => a.time < b.time ? -1 : 1)

    if (!isEmpty(infectionDates)) {

        // compute distance of user while he is infected
        const infectedLocations = infectionDates.map(infection => {
            const ret = []
            if (infection.newStatus === "infected") {
                // find locations for specific infection time and return if it has status infected

                for (let i = sortedLocations.length - 1; i >= 0; i--) {
                    const locationCand = sortedLocations[i]

                    if (locationCand.time >= infection.dateOfTest) {
                        ret.push(locationCand)
                        sortedLocations.pop()
                    }
                    else {
                        break
                    }
                }
            }

            return ret
        })

        // compute all infected distances
        let dist = 0

        // compute distances of each array in infectedLocations
        for (let i = 0; i < infectedLocations.length; i++) {
            const locationsArray = infectedLocations[i]

            let tmpDist = 0
            for (let i = 1; i < locationsArray.length; i++) {
                const point1 = locationsArray[i - 1].location.coordinates
                const point2 = locationsArray[i].location.coordinates

                tmpDist += calcCrow(point1[0], point1[1], point2[0], point2[1])
            }

            dist += tmpDist
        }

        await updateAchievement(userId, "zombie", dist)
    }
}

//This function takes in latitude and longitude of two location and returns the distance between them as the crow flies (in km)
function calcCrow(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371; // km
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    lat1 = toRad(lat1);
    lat2 = toRad(lat2);

    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c;
    return d;
}

// Converts numeric degrees to radians
function toRad(value: number) {
    return value * Math.PI / 180;
}

export async function updateMoneyboy(userId: string, numberOfSoldItems: number): Promise<void> {
    await updateAchievement(userId, "moneyboy", numberOfSoldItems)
}

export async function updateHamsterbuyer(userId: string, numberOfBuyedItems: number): Promise<void> {
    await updateAchievement(userId, "hamsterbuyer", numberOfBuyedItems)
}

export async function updateSuperspreader(): Promise<void> {
    // TODO
    console.log("superspreader")
}

export async function updateQuizmaster(): Promise<void> {
    // TODO
    console.log("quizmaster")
}

async function updateAchievement(userId: string, achievement: AchievementNameType, updateRemaining: number): Promise<void> {
    // update specific achievement in database for user
    // if user unlocks a new badge, send a notification to the user

    // get user achievement that should be updated (user and name should be unique)
    const ach = await AchievementRecord.findOne({ userId: userId, name: achievement })

    if (!isNull(ach)) {
        // how many steps the user needs to unlock the new badge (zero or negative if he unlocks it)
        const newRemaining = ach.remaining - updateRemaining

        // if user does not already have the highest badge type we check how far he is from the next badge now
        if (ach.badge !== AchievementBadges[AchievementBadges.length - 1]) {
            // get information of the current badge
            const achievementInfo = AchievementsInformations.find(e => e.name === achievement)
            // get information of the next badge
            const currentBadge = AchievementBadges[AchievementBadges.indexOf(ach.badge) + 1]
            const nextBadge = AchievementBadges[AchievementBadges.indexOf(ach.badge) + 1]

            if (!(achievementInfo === undefined || nextBadge === undefined || currentBadge === undefined || currentBadge === "none" || nextBadge === "none")) {
                // value for the next badge
                const remainingForNextBadge = achievementInfo[nextBadge]
                const remainingForCurrentBadge = achievementInfo[currentBadge]

                const update = { badge: ach.badge, remaining: newRemaining }

                if (newRemaining <= 0) {
                    // user unlocks the next achievement

                    // update to new achievement
                    update.badge = nextBadge

                    // update to new remaining value
                    update.remaining = remainingForNextBadge - newRemaining

                    // send notification to user
                    await notifications.sendAchievementNotification(userId, achievement, nextBadge)
                }

                // if achievement is hamsterbuyer or foreveralone we do not count intermediate steps
                // TODO: for foreveralone too???
                if (newRemaining <= 0 && achievement in ["hamsterbuyer"]) {
                    update.remaining = remainingForNextBadge
                }
                else if (achievement in ["hamsterbuyer"]) {
                    update.remaining = remainingForCurrentBadge
                }

                // update db
                await AchievementRecord.update({ userId: userId, name: achievement }, update)
            }
            else {
                throw new Error("achievementInfo is undefined or nextBadge has illegal value");
            }
        }

        return
    }

    return Promise.reject("Cannot get Achievement " + achievement + " for user " + userId)
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

            const tmp = await AchievementRecord.countDocuments({ name: record.name, badge: tmpBadge })
            howmany += tmp

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


// -------------------------- Test Functions ---------------------------------
// TODO: delete
/*export async function testFunction(): Promise<void> {
    const a = [13, 11, 9, 7, 6, 5, 4, 2, 1, 0].reverse()
    const b = [10, 8, 3]

    const c = b.map(valueB => {
        const ret = []

        // find every element that
        for (let i = a.length - 1; i >= 0; i--) {
            const aCand = a[i]
            if (aCand >= valueB) {
                ret.push(aCand)
                a.pop()
            }
            else {
                break
            }
        }

        console.log(ret)

        return ret
    })

    console.log(c)
}*/
