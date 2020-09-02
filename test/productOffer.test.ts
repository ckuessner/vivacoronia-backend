import mongoDBHelper from "./mongoDBHelper";
import 'mocha';
import app from '../src/app'
import request from 'supertest';
import ProductofferRecord from "../src/db/trading/models/ProductOffer"
import { expect } from "chai";
import { getAdminJWT, getUserAccountRecords } from "./userAccountsSetup";

let adminJWT: string
let testAccounts: Record<string, string>[]
let testOffers = getValidProductOffers()

before('connect to MongoDB', async function () {
    await mongoDBHelper.start()
    await mongoDBHelper.setupAdminAccount()

    adminJWT = await getAdminJWT()
    testAccounts = await getUserAccountRecords(2)

    testOffers[0].userId = testAccounts[0].userId
    testOffers[1].userId = testAccounts[1].userId

    await request(app)
        .post('/trading/categories/')
        .set({ adminjwt: adminJWT })
        .send({ name: "foods" })
        .expect(201)
})

beforeEach('delete LocationRecords', async () => {
    await ProductofferRecord.deleteMany({})
})

after('disconnect from MongoDB', async function () {
    await mongoDBHelper.stop()
})

function getValidProductOffers() {
    return [
        { userId: "bli", product: "apple", productCategory: "foods", amount: 2, priceTotal: 4.5, details: "lecker", location: { type: "Point", coordinates: [-122.96, 50.114] } },
        { userId: "bla", product: "strawberry", productCategory: "foods", amount: 65, priceTotal: 100, details: "nicht lecker", location: { type: "Point", coordinates: [-122.90, 50.114] } },
    ]
}

describe('GET /trading/offers/', async function () {
    it("user gets only his own offers", async function () {
        await ProductofferRecord.insertMany(testOffers)
        const res = await request(app).get('/trading/offers')
            .set({ jwt: testAccounts[0].jwt })
            .query({ userId: testAccounts[0].userId })
        expect(res.status).to.equal(200)
        expect(res.body).to.have.lengthOf(1)
        expect(res.body[0].product).to.equal('apple')
    })
})
