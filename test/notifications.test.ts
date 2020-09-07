import mongoDBHelper from "./mongoDBHelper";
import 'mocha';
import { expect } from 'chai'
import WebSocket from 'ws'
import notifications, { userIDToSocketMap, CONTACT_NOTIFICATION_STRING } from "../src/controllers/notifications";
import { AddressInfo } from "net";
import ContactRecord from "../src/db/Tracking/models/ContactRecord";
import LocationRecord from "../src/db/Tracking/models/LocationRecord";
import { generateAccessJWT } from "../src/validators/jsonWebTokenValidator";

before('connect to MongoDB', async function () {
    await mongoDBHelper.start()
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
