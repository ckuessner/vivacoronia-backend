import 'mocha';
import mongoDBHelper from "./mongoDBHelper";
import LocationRecord from "../src/db/Tracking/models/LocationRecord"
import ContactRecord from "../src/db/Tracking/models/ContactRecord";
import { getUserAccountRecords } from "./userAccountsSetup";
import { updateForeverAlone } from '../src/db/achievements/achievements';
import AchievementRecord, { AchievementNames } from '../src/db/achievements/models/AchievementRecord';
import { expect } from 'chai';

describe("foreveralone achievement", function () {
    let testAccount: Record<string, string>

    const locTestRecords = [
        { userId: "0", time: "2020-09-20T19:39:08.000Z", location: { type: "Point", coordinates: [-122.96, 50.114] } },
        { userId: "0", time: "2020-09-21T21:50:42.000Z", location: { type: "Point", coordinates: [-8.454, 50.225] } },
    ]

    const contactTestRecords = [
        { userId: "0", infectedUserId: "1", locationRecord: locTestRecords[0] },
        { userId: "0", infectedUserId: "1", locationRecord: locTestRecords[1] },
    ]

    before('connect to MongoDB', async function () {
        await mongoDBHelper.start()

        testAccount = (await getUserAccountRecords(1))[0]
        locTestRecords[0].userId = testAccount.userId
        locTestRecords[1].userId = testAccount.userId

        contactTestRecords[0].userId = testAccount.userId
        contactTestRecords[1].userId = testAccount.userId
    })

    after('disconnect from MongoDB', async function () {
        await mongoDBHelper.stop()
    })

    describe("Test forEverAlone", async function () {

        before("before forEverAlone", async function () {
            const ids = await LocationRecord.insertMany(locTestRecords)
            contactTestRecords[0].locationRecord = ids[0]._id
            contactTestRecords[1].locationRecord = ids[1]._id
            await ContactRecord.insertMany(contactTestRecords)
        })

        beforeEach("print achivement", async function () {
            const ach = await AchievementRecord.find({ userId: testAccount.userId, name: AchievementNames[0] })
            console.log("before: ", ach)
        })

        afterEach("print achivement", async function () {
            const ach = await AchievementRecord.find({ userId: testAccount.userId, name: AchievementNames[0] })
            console.log("after: ", ach)
        })

        it("not yet bronce test", async function () {
            await updateForeverAlone(testAccount.userId, new Date("2020-09-23T14:38:12.000Z"))
            const ach = await AchievementRecord.find({ userId: testAccount.userId, name: AchievementNames[0] })
            expect(ach[0].badge).to.eql("none")
        })

        it("now bronce test", async function () {
            await updateForeverAlone(testAccount.userId, new Date("2020-09-24T14:38:12.000Z"))
            const ach = await AchievementRecord.find({ userId: testAccount.userId, name: AchievementNames[0] })
            expect(ach[0].badge).to.eql("bronce")
        })

        it("silver test", async function () {
            await updateForeverAlone(testAccount.userId, new Date("2020-09-26T21:50:42.000Z"))
            const ach = await AchievementRecord.find({ userId: testAccount.userId, name: AchievementNames[0] })
            expect(ach[0].badge).to.eql("silver")
        })

        it("remain silver test", async function () {
            // here it stays silver because 10-01-2020 is 10 days from 21-09-2020 but we need from 27-09-2020 because this is the newest contact record
            const id = (await LocationRecord.insertMany([{ userId: testAccount.userId, time: "2020-09-27T12:13:12.000Z", location: { type: "Point", coordinates: [-8.454, 50.225] } }]))[0]._id
            await ContactRecord.insertMany({ userId: testAccount.userId, infectedUserId: "blub", locationRecord: id })
            await updateForeverAlone(testAccount.userId, new Date("2020-10-01T22:50:42.000Z"))
            const ach = await AchievementRecord.find({ userId: testAccount.userId, name: AchievementNames[0] })
            expect(ach[0].badge).to.eql("silver")
        })

        it("gold test", async function () {
            await updateForeverAlone(testAccount.userId, new Date("2020-10-07T21:50:42.000Z"))
            const ach = await AchievementRecord.find({ userId: testAccount.userId, name: AchievementNames[0] })
            expect(ach[0].badge).to.eql("gold")
        })
    })

})
