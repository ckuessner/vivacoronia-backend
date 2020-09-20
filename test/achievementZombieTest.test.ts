import 'mocha';
import mongoDBHelper from "./mongoDBHelper";
import LocationRecord from "../src/db/Tracking/models/LocationRecord"
import { getUserAccountRecords } from "./userAccountsSetup";
import { updateZombie } from '../src/db/achievements/achievements';
import AchievementRecord, { AchievementNames, AchievementsInformations } from '../src/db/achievements/models/AchievementRecord';
import { expect } from 'chai';
import InfectionRecord from '../src/db/Tracking/models/InfectionRecord';

describe("zombie achievement", function () {
    let testAccount: Record<string, string>

    function getTestRecords() {
        return [
            { userId: "42", time: new Date(Date.parse("2020-04-10T19:39:08.000Z")), location: { type: "Point", coordinates: [-122.96, 50.225] } },
            { userId: "99", time: new Date(Date.parse("2020-04-11T21:50:42.000Z")), location: { type: "Point", coordinates: [-122.80, 50.225] } },
            { userId: "99", time: new Date(Date.parse("2020-04-12T21:50:42.000Z")), location: { type: "Point", coordinates: [-122.70, 50.225] } },
            { userId: "42", time: new Date(Date.parse("2020-04-13T19:39:08.000Z")), location: { type: "Point", coordinates: [-122.60, 50.225] } },
            { userId: "99", time: new Date(Date.parse("2020-04-14T21:50:42.000Z")), location: { type: "Point", coordinates: [-122.50, 50.225] } },
            { userId: "99", time: new Date(Date.parse("2020-04-15T21:50:42.000Z")), location: { type: "Point", coordinates: [-122.10, 50.225] } },
            { userId: "42", time: new Date(Date.parse("2020-04-16T19:39:08.000Z")), location: { type: "Point", coordinates: [-122.50, 50.225] } },
            { userId: "99", time: new Date(Date.parse("2020-04-17T21:50:42.000Z")), location: { type: "Point", coordinates: [-122.30, 50.225] } },
            { userId: "99", time: new Date(Date.parse("2020-04-18T21:50:42.000Z")), location: { type: "Point", coordinates: [-122.10, 50.225] } },
            { userId: "42", time: new Date(Date.parse("2020-04-19T19:39:08.000Z")), location: { type: "Point", coordinates: [-122.96, 50.225] } },
            { userId: "99", time: new Date(Date.parse("2020-04-20T21:50:42.000Z")), location: { type: "Point", coordinates: [-122.30, 50.225] } },
            { userId: "99", time: new Date(Date.parse("2020-04-21T21:50:42.000Z")), location: { type: "Point", coordinates: [-122.10, 50.225] } },
            { userId: "42", time: new Date(Date.parse("2020-04-22T19:39:08.000Z")), location: { type: "Point", coordinates: [-122.96, 50.225] } },
            { userId: "99", time: new Date(Date.parse("2020-04-23T21:50:42.000Z")), location: { type: "Point", coordinates: [-122.30, 50.225] } },
            { userId: "99", time: new Date(Date.parse("2020-04-24T21:50:42.000Z")), location: { type: "Point", coordinates: [-122.10, 50.225] } },
            { userId: "42", time: new Date(Date.parse("2020-04-25T19:39:08.000Z")), location: { type: "Point", coordinates: [-122.96, 50.225] } },
            { userId: "99", time: new Date(Date.parse("2020-04-26T21:50:42.000Z")), location: { type: "Point", coordinates: [-122.30, 50.225] } },
            { userId: "99", time: new Date(Date.parse("2020-04-27T21:50:42.000Z")), location: { type: "Point", coordinates: [-122.10, 50.225] } },
            { userId: "99", time: new Date(Date.parse("2020-06-01T21:50:42.000Z")), location: { type: "Point", coordinates: [-122.30, 50.225] } },
            { userId: "99", time: new Date(Date.parse("2020-06-02T21:50:42.000Z")), location: { type: "Point", coordinates: [-122.10, 50.225] } },
            { userId: "42", time: new Date(Date.parse("2020-06-03T19:39:08.000Z")), location: { type: "Point", coordinates: [-122.96, 50.225] } },
            { userId: "99", time: new Date(Date.parse("2020-06-04T21:50:42.000Z")), location: { type: "Point", coordinates: [-122.30, 50.225] } },
            { userId: "99", time: new Date(Date.parse("2020-06-05T21:50:42.000Z")), location: { type: "Point", coordinates: [-122.10, 50.225] } },
            { userId: "42", time: new Date(Date.parse("2020-06-06T19:39:08.000Z")), location: { type: "Point", coordinates: [-122.96, 50.225] } },
            { userId: "99", time: new Date(Date.parse("2020-06-07T21:50:42.000Z")), location: { type: "Point", coordinates: [-122.30, 50.225] } },
            { userId: "99", time: new Date(Date.parse("2020-06-08T21:50:42.000Z")), location: { type: "Point", coordinates: [-122.10, 50.225] } },
        ]
    }
    const testRecords = getTestRecords();

    before('connect to MongoDB', async function () {
        await mongoDBHelper.start()

        testAccount = (await getUserAccountRecords(1))[0]

        testRecords.forEach(e => e.userId = testAccount.userId)
    })

    after('disconnect from MongoDB', async function () {
        await mongoDBHelper.stop()
    })

    describe("Test Zombie Infected", async function () {

        before("before forEverAlone", async function () {
            await InfectionRecord.create(
                { userId: testAccount.userId, newStatus: "infected", dateOfTest: new Date("2020-04-10"), occuredDateEstimation: new Date("2020-04-10") }
            )
        })

        beforeEach("print achivement", async function () {
            await AchievementRecord.updateOne({ userId: testAccount.userId, name: AchievementNames[1] }, { badge: "none", remaining: AchievementsInformations[1].bronce })
            LocationRecord.deleteMany({})
            const ach = await AchievementRecord.find({ userId: testAccount.userId, name: AchievementNames[1] })
            console.log("before: ", ach)
        })

        afterEach("print achivement", async function () {
            const ach = await AchievementRecord.find({ userId: testAccount.userId, name: AchievementNames[1] })
            console.log("after: ", ach)
        })

        it("clear db and not yet bronce test", async function () {
            const data = await LocationRecord.insertMany(testRecords.slice(0, 2))
            await LocationRecord.deleteMany({})

            await updateZombie(testAccount.userId, data)

            const ach = await AchievementRecord.find({ userId: testAccount.userId, name: AchievementNames[1] })
            expect(ach[0].badge).to.eql("none")
        })

        it("not yet bronce", async function () {
            const data = await LocationRecord.insertMany(testRecords.slice(0, 2))

            await updateZombie(testAccount.userId, data.slice(1, 2))

            const ach = await AchievementRecord.find({ userId: testAccount.userId, name: AchievementNames[1] })
            expect(ach[0].badge).to.eql("none")
        })

        it("yet bronce", async function () {
            const data = await LocationRecord.insertMany(testRecords.slice(0, 6))

            await updateZombie(testAccount.userId, data.slice(1, 6))

            const ach = await AchievementRecord.find({ userId: testAccount.userId, name: AchievementNames[1] })
            expect(ach[0].badge).to.eql("bronce")
        })

        it("yet silver", async function () {
            const data = await LocationRecord.insertMany(testRecords.slice(0, 17))

            await updateZombie(testAccount.userId, data.slice(3, 5))
            await updateZombie(testAccount.userId, data.slice(5, 6))
            await updateZombie(testAccount.userId, data.slice(6, 8))
            await updateZombie(testAccount.userId, data.slice(8, 17))

            const ach = await AchievementRecord.find({ userId: testAccount.userId, name: AchievementNames[1] })
            expect(ach[0].badge).to.eql("silver")
        })

        it("yet gold", async function () {
            const data = await LocationRecord.insertMany(testRecords.slice(0, testRecords.length))

            await updateZombie(testAccount.userId, data.slice(3, 5))
            await updateZombie(testAccount.userId, data.slice(5, 6))
            await updateZombie(testAccount.userId, data.slice(6, 8))
            await updateZombie(testAccount.userId, data.slice(8, 20))
            await updateZombie(testAccount.userId, data.slice(20, 22))

            await updateZombie(testAccount.userId, data.slice(22, testRecords.length))

            const ach = await AchievementRecord.find({ userId: testAccount.userId, name: AchievementNames[1] })
            expect(ach[0].badge).to.eql("gold")
        })
    })
})
