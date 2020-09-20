import mongoDBHelper from "./mongoDBHelper";
import 'mocha';
import { expect } from 'chai'
import ProductNeedRecord from "../src/db/trading/models/ProductNeed"
import ProductOfferRecord from "../src/db/trading/models/ProductOffer"
import request from 'supertest';
import app from '../src/app'
import { getAdminJWT, getUserAccountRecords } from "./userAccountsSetup";
import tradingDb from "../src/db/trading/trading"

describe('Trading', function () {
    let adminJWT: string
    let testAccounts: Record<string, string>[]

    before('connect to MongoDB', async function () {
        await mongoDBHelper.start()

        const rootAdmin = mongoDBHelper.getRootUserInfo()
        adminJWT = await getAdminJWT(rootAdmin.userId, rootAdmin.password)
        testAccounts = await getUserAccountRecords(3)
    })

    before('add categories to db', async function () {
        await request(app)
            .post('/trading/categories/')
            .set({ adminjwt: adminJWT })
            .send({ name: "foods" })
            .expect(201)

        await request(app)
            .post('/trading/categories/')
            .set({ adminjwt: adminJWT })
            .send({ name: "sanitary" })
            .expect(201)
    })

    after('disconnect from MongoDB', async function () {
        await mongoDBHelper.stop()
    })

    describe("right getNeedsMatchesWithOffer", async function () {
        it("right getNeedsMatchesWithOffer", async function () {
            await ProductNeedRecord.insertMany([
                { userId: testAccounts[0].userId, product: "apple", productCategory: "foods", amount: 1, location: { type: "Point", coordinates: [-123.356212, 50.113148] } },
                { userId: testAccounts[0].userId, product: "apple", productCategory: "foods", amount: 2, location: { type: "Point", coordinates: [-125.356212, 50.113148] } },
                { userId: testAccounts[1].userId, product: "appLe", productCategory: "foods", amount: 1, location: { type: "Point", coordinates: [-122.96, 50.114] } },
                { userId: testAccounts[0].userId, product: "APPLE", productCategory: "foods", amount: 10, location: { type: "Point", coordinates: [-122.96, 50.114] } },
                { userId: testAccounts[2].userId, product: "apple", productCategory: "foods", amount: 100, location: { type: "Point", coordinates: [-122.96, 50.114] } },
                { userId: testAccounts[2].userId, product: "apple", productCategory: "foods", amount: 3, location: { type: "Point", coordinates: [-122.96, 50.114] } },
            ])

            const offer = { userId: testAccounts[2].userId, product: "AppLE", productCategory: "foods", amount: 20, price: 50, location: { type: "Point", coordinates: [-122.96, 50.114] } }
            const res = await request(app).post('/trading/offers')
                .set({ jwt: testAccounts[2].jwt })
                .send(offer)
            expect(res.status).to.equal(201)

            const offerDocument = res.body
            const needs = await tradingDb.getNeedsMatchesWithOffer(offerDocument)
            expect(needs).to.have.lengthOf(4)
        })
    })

    describe("right getOffersMatchesWithNeed", async function () {
        it("right getOffersMatchesWithNeed", async function () {
            await ProductOfferRecord.insertMany([
                { userId: "bli", product: "spaghetti", productCategory: "foods", amount: 5, price: 4.5, details: "lecker", location: { type: "Point", coordinates: [-123.356212, 50.113148] } },
                { userId: "bli", product: "spaghetti", productCategory: "foods", amount: 5, price: 4.5, details: "lecker", location: { type: "Point", coordinates: [-125.356212, 50.113148] } },    // does not match because to far away
                { userId: "bli", product: "SPAGHETTI", productCategory: "foods", amount: 2, price: 4.5, details: "lecker", location: { type: "Point", coordinates: [-122.96, 50.114] }, deactivatedAt: new Date() },    // does not match because deactivate
                { userId: "bli", product: "spagHEtti", productCategory: "foods", amount: 2, price: 4.5, details: "lecker", location: { type: "Point", coordinates: [-122.95, 50.114] } },
                { userId: "bli", product: "nudeln", productCategory: "foods", amount: 2, price: 4.5, details: "lecker", location: { type: "Point", coordinates: [-122.90, 50.114] } },  // does not match because other product name
                { userId: testAccounts[0].userId, product: "spaghetti", productCategory: "foods", amount: 3, price: 4.5, details: "lecker", location: { type: "Point", coordinates: [-122.90, 50.114] } } // does not match because same userid as posted need
            ])

            const res = await request(app).post("/trading/needs")
                .set({ jwt: testAccounts[0].jwt })
                .send({ userId: testAccounts[0].userId, product: "SPAGHETTI", productCategory: "foods", amount: 1, location: { type: "Point", coordinates: [-122.96, 50.114] } })

            expect(res.status).to.equal(201)

            const needDocument = res.body
            const needs = await tradingDb.getOffersMatchesWithNeed(needDocument)
            expect(needs).to.have.lengthOf(2)
        })
    })
})
