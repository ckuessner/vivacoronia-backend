import mongoDBHelper from "./mongoDBHelper";
import 'mocha';
import { expect } from 'chai'
import WebSocket from 'ws'
import notifications, { userIDToSocketMap, CONTACT_NOTIFICATION_STRING } from "../src/controllers/notifications";
import { AddressInfo } from "net";
import ContactRecord from "../src/db/Tracking/models/ContactRecord";
import LocationRecord from "../src/db/Tracking/models/LocationRecord";
import ProductOfferRecord from "../src/db/trading/models/ProductOffer"
import ProductNeedRecord from "../src/db/trading/models/ProductNeed"
import request from 'supertest';
import app from '../src/app'
import { getAdminJWT, getUserAccountRecords } from "./userAccountsSetup";
import { generateAccessJWT } from "../src/validators/jsonWebTokenValidator";

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

var wss: WebSocket.Server;
before('setup websocket server', () => {
    wss = new WebSocket.Server({ port: 0 })
    notifications.setupSocketManagement(wss)
})

after('close WebSocket server', function (done) {
    wss.close(done)
})

async function createWSClient(userId: string) {
    const jwt = await generateAccessJWT(userId)
    return new WebSocket(`http://localhost:${(wss.address() as AddressInfo).port}`, { headers: { userid: userId, jwt: jwt } })
}


describe('connection', async function () {
    let ws: WebSocket;
    it('client connects', function (done) {
        createWSClient("0").then((createdWS) => {
            ws = createdWS
            ws.on('open', () => {
                setTimeout(() => {
                    const map = userIDToSocketMap
                    expect(map.has("0")).to.be.true
                    done()
                }, 10)
            });
        })
    });

    it('client disconnects', function (done) {
        ws.close()
        setTimeout(() => {
            const map = userIDToSocketMap
            expect(map.get("0")).to.be.undefined
            done()
        }, 10)
    })
})


describe('notification sending', async function () {
    let ws: WebSocket;
    let wrongWs: WebSocket;

    const locRec = [
        await LocationRecord.create({ userId: "0", time: new Date(), location: { type: "Point", coordinates: [0, 0] } }),
        await LocationRecord.create({ userId: "0", time: new Date(), location: { type: "Point", coordinates: [1, 1] } }),
        await LocationRecord.create({ userId: "42", time: new Date(), location: { type: "Point", coordinates: [0, 0] } })
    ]

    const conRec = [
        await ContactRecord.create({ userId: "0", infectedUserId: "2", locationRecord: locRec[0] }),
        await ContactRecord.create({ userId: "42", infectedUserId: "2", locationRecord: locRec[2] }),
        await ContactRecord.create({ userId: "0", infectedUserId: "2", locationRecord: locRec[1] })
    ]

    it('buffers notifications', async function () {
        return new Promise(async (resolve, reject) => {
            await notifications.sendInfectedContactNotifications([conRec[0]])
            wrongWs = await createWSClient("2")
            wrongWs.on('message', () => { reject(Error("Should not send notifications to wrong socket")) })
            ws = await createWSClient("0")
            ws.on("message", (message) => message === CONTACT_NOTIFICATION_STRING && resolve())
        })
    })

    it('messages in buffer aren\'t sent again on second connect', async function () {
        ws.close()
        wrongWs.close()
        ws = await createWSClient("0")
        return new Promise((resolve, reject) => {
            ws.on('message', () => reject(new Error("Message received")))
            setTimeout(resolve, 10)
        })
    });
})

describe('notify only one time', async function () {
    let ws: WebSocket

    it('send only once per infected user', async function () {
        ws = await createWSClient("0")

        const locRec = [
            await LocationRecord.create({ userId: "0", time: new Date(), location: { type: "Point", coordinates: [0, 0] } }),
            await LocationRecord.create({ userId: "0", time: new Date(), location: { type: "Point", coordinates: [1, 1] } }),
            await LocationRecord.create({ userId: "42", time: new Date(), location: { type: "Point", coordinates: [0, 0] } })
        ]

        const conRec = [
            await ContactRecord.create({ userId: "0", infectedUserId: "2", locationRecord: locRec[0] }),
            await ContactRecord.create({ userId: "42", infectedUserId: "2", locationRecord: locRec[2] }),
            await ContactRecord.create({ userId: "0", infectedUserId: "2", locationRecord: locRec[1] })
        ]

        return new Promise(async (resolve) => {
            let counter = 0
            await notifications.sendInfectedContactNotifications(conRec)
            ws.on('message', () => { counter = counter + 1; expect(counter <= 1).to.be.true; })
            setTimeout(resolve, 10)
        })
    })
})

describe('notifications for product matches', async function () {
    let ws: WebSocket
    let ws1: WebSocket
    let ws2: WebSocket

    it('send after posting need', async function () {
        await ProductOfferRecord.insertMany([
            { userId: "bli", product: "spaghetti", productCategory: "foods", amount: 5, price: 4.5, details: "lecker", location: { type: "Point", coordinates: [-123.356212, 50.113148] } },
            { userId: "bli", product: "spaghetti", productCategory: "foods", amount: 5, price: 4.5, details: "lecker", location: { type: "Point", coordinates: [-125.356212, 50.113148] } },    // does not match because to far away
            { userId: "bli", product: "SPAGHETTI", productCategory: "foods", amount: 2, price: 4.5, details: "lecker", location: { type: "Point", coordinates: [-122.96, 50.114] }, deactivatedAt: new Date() },    // does not match because deactivate
            { userId: "bli", product: "spagHEtti", productCategory: "foods", amount: 2, price: 4.5, details: "lecker", location: { type: "Point", coordinates: [-122.95, 50.114] } },
            { userId: "bli", product: "nudeln", productCategory: "foods", amount: 2, price: 4.5, details: "lecker", location: { type: "Point", coordinates: [-122.90, 50.114] } },  // does not match because other product name

        ])
        ws = await createWSClient(testAccounts[0].userId)
        const answer = JSON.stringify({ product: "spaghetti", productCategory: "foods", minAmount: 1, location: [-122.96, 50.114], perimeter: 30000, numberOfOffers: 2 })
        return new Promise(async (resolve) => {
            await request(app).post("/trading/needs")
                .set({ jwt: testAccounts[0].jwt })
                .send({ userId: testAccounts[0].userId, product: "SPAGHETTI", productCategory: "foods", amount: 1, location: { type: "Point", coordinates: [-122.96, 50.114] } })
            ws.on('message', (msg) => { console.log("here"); expect(msg).to.equal(answer) && resolve() })
        })
    })

    it('send after posting offer', async function () {
        // user0 should only be notified once, although he has two matching needs, user1 should be notified once and user2 is not notified 
        // because one time it doesnt matches and the other time it matches but user2 makes also the offer post
        await ProductNeedRecord.insertMany([
            { userId: testAccounts[0].userId, product: "apple", productCategory: "foods", amount: 1, location: { type: "Point", coordinates: [-123.356212, 50.113148] } },
            { userId: testAccounts[1].userId, product: "appLe", productCategory: "foods", amount: 1, location: { type: "Point", coordinates: [-122.96, 50.114] } },
            { userId: testAccounts[0].userId, product: "APPLE", productCategory: "foods", amount: 10, location: { type: "Point", coordinates: [-122.96, 50.114] } },
            { userId: testAccounts[2].userId, product: "apple", productCategory: "foods", amount: 100, location: { type: "Point", coordinates: [-122.96, 50.114] } },
            { userId: testAccounts[2].userId, product: "apple", productCategory: "foods", amount: 3, location: { type: "Point", coordinates: [-122.96, 50.114] } },
        ])
        ws = await createWSClient(testAccounts[0].userId) // ws has to be connected again because otherwise the ws.on("message") method would be called if a notifcation is send
        ws1 = await createWSClient(testAccounts[1].userId)
        ws2 = await createWSClient(testAccounts[2].userId)
        let counter0 = 0
        const offer = { userId: testAccounts[2].userId, product: "AppLE", productCategory: "foods", amount: 20, price: 50, location: { type: "Point", coordinates: [-122.96, 50.114] } }
        const answer = { userId: testAccounts[2].userId, product: "apple", productCategory: "foods", amount: 20, price: 50, location: [-122.96, 50.114] }
        return new Promise(async (resolve, reject) => {
            await request(app).post('/trading/offers')
                .set({ jwt: testAccounts[2].jwt })
                .send(offer)
                .expect(201)
            ws.on("message", () => { counter0 = counter0 + 1; expect(counter0 <= 1).to.be.true && resolve(); })
            ws1.on("message", (msg) => { expect(msg).to.equal(JSON.stringify(answer)) && resolve() })
            ws2.on("message", () => reject(Error("nothing should be sent")))
        })
    })
})
