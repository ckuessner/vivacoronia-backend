import mongoDBHelper from "./mongoDBHelper";
import 'mocha';
import app from '../src/app'
import request from 'supertest';
import ProductNeedRecord from "../src/db/trading/models/ProductNeed"
import { expect } from "chai";
import { getAdminJWT, getUserAccountRecords } from "./userAccountsSetup";

let adminJWT: string
let testAccounts: Record<string, string>[]
let testNeeds = getValidProductNeed()

before('connect to MongoDB', async function () {
    await mongoDBHelper.start()
    await mongoDBHelper.setupAdminAccount()

    adminJWT = await getAdminJWT()
    testAccounts = await getUserAccountRecords(2)

    testNeeds[0].userId = testAccounts[0].userId
    testNeeds[1].userId = testAccounts[1].userId

    await request(app)
        .post('/trading/categories/')
        .set({ adminjwt: adminJWT })
        .send({ name: "foods" })
        .expect(201)
})

beforeEach('delete LocationRecords', async () => {
    await ProductNeedRecord.deleteMany({})
})

after('disconnect from MongoDB', async function () {
    await mongoDBHelper.stop()
})

function getValidProductNeed() {
    return [
        { userId: "42", product: "Flour 1kg", productCategory: "foods", location: { type: "Point", coordinates: [-122.96, 50.114] } },
        { userId: "1234", product: "Spaghetti", productCategory: "foods", location: { type: "Point", coordinates: [49.532287, 8.827652] } }
    ]
}

describe('POST /trading/needs/', function () {

    it("Successfull Post", async function () {
        const need = testNeeds[1]
        const res = await request(app)
            .post('/trading/needs/')
            .set({ jwt: testAccounts[1].jwt })
            .send(need)
        expect(res.status).to.equal(201)
    })

    it("Failed Post", async function () {
        await request(app)
            .post('/trading/needs/')
            .set({ jwt: testAccounts[0].jwt })
            .send({ userId: testAccounts[0].userId, product: "Flour 1kg" })
            .expect(400)
    })
})

describe('GET /trading/needs/', function () {

    it("Right user-only get", async function () {
        await ProductNeedRecord.insertMany(testNeeds)
        const res = await request(app).get('/trading/needs')
            .set({ jwt: testAccounts[1].jwt })
            .query({ userId: testAccounts[1].userId })
        expect(res.status).to.equal(200)
        expect(res.body).to.have.lengthOf(1)
        expect(res.body[0].product).to.equal("Spaghetti")
    })

    it('No authentication', async function () {
        const res = await request(app).get('/trading/needs/')
        expect(res.status).to.equal(400)
    })
})
