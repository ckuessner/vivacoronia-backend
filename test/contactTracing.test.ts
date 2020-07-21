import LocationRecord from "../src/db/models/LocationRecord";
import 'mocha';
import { promises as fs } from 'fs';
import path from 'path'
import mongoDBHelper from "./mongoDBHelper";
import contactController from "../src/controllers/contacts"
import InfectionRecord from "../src/db/models/InfectionRecord";
import ContactRecord from "../src/db/models/ContactRecord";
import { expect } from "chai";

before('connect to MongoDB', async function () {
    await mongoDBHelper.start()
})

after('disconnect from MongoDB', async function () {
    await mongoDBHelper.stop()
})

const testData = [
    {
        userId: 42,
        time: new Date("2020-07-15T05:50:45"),
        location: {
            type: "Point",
            coordinates: [
                -122.90434040129186,
                50.10347630216543
            ]
        }
    },
    {
        userId: 42,
        time: new Date("2020-07-15T05:50:47"),
        location: {
            type: "Point",
            coordinates: [
                -122.90433771908282,
                50.103476517212584
            ] // In close proximity to the first two points
        }
    },
    {
        userId: 1234,
        time: new Date("2020-07-15T05:50:46"),
        location: {
            type: "Point",
            coordinates: [
                -122.90433704853056,
                50.103477162354004
            ]
        }
    },
    {
        userId: 1234,
        time: new Date("2020-07-15T05:50:45"),
        location: {
            type: "Point",
            coordinates: [
                -122.90426596999168,
                50.10339329389676
            ] // 11 meters away from the first 3 points
        }
    },
    {
        userId: 42,
        time: new Date("2020-07-15T05:50:25"), // Roughly 20 seconds before other points
        location: {
            type: "Point",
            coordinates: [
                -122.90426596999168,
                50.10339329389676
            ] // Close to 4th location record
        }
    },
]

describe('tracing works with simple example', function () {
    before('create noise', async function () {
        this.timeout(4000)
        await LocationRecord.syncIndexes()
        await ContactRecord.syncIndexes()
        const testDataFilePath = path.join(__dirname, 'res', 'locationrecords.json')
        const data = await fs.readFile(testDataFilePath)
        const locRecordsJson = JSON.parse(data as any)
        await LocationRecord.create(locRecordsJson)
    })

    it('finds contacts in test data', async function () {
        await LocationRecord.create(testData as any)
        const infectionRecord = await InfectionRecord.create(
            { userId: 1234, newStatus: "infected", dateOfTest: new Date("2020-07-20"), occuredDateEstimation: new Date("2020-07-10") }
        )
        await contactController.startContactTracing(infectionRecord)
        expect(await ContactRecord.countDocuments({})).to.equal(2)
        expect(await ContactRecord.countDocuments({ userId: 42 })).to.equal(2)
    })

    it('contact is not duplicated', async function () {
        const infectionRecord = await InfectionRecord.findOne({})
        await contactController.startContactTracing(infectionRecord!)
        expect(await ContactRecord.countDocuments({})).to.equal(2)
    })

    it('finds contacts in both directions', async function () {
        await ContactRecord.deleteMany({})
        await InfectionRecord.deleteMany({})
        await LocationRecord.create(testData as any)
        const infectionRecord = await InfectionRecord.create(
            { userId: 42, newStatus: "infected", dateOfTest: new Date("2020-07-20"), occuredDateEstimation: new Date("2020-07-10") }
        )
        await contactController.startContactTracing(infectionRecord)
        expect(await ContactRecord.countDocuments({})).to.equal(1)
        expect(await ContactRecord.countDocuments({ userId: 1234 })).to.equal(1)
    })
})
