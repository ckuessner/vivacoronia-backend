import mongoDBHelper from "./mongoDBHelper";
import 'mocha';
import { expect } from 'chai'
import WebSocket from 'ws'
import notification_connections from "../src/controllers/notification_connections";
import { AddressInfo } from "net";

before('connect to MongoDB', async function () {
    await mongoDBHelper.start()
})

after('disconnect from MongoDB', async function () {
    await mongoDBHelper.stop()
})

after('close WebSocket server', function (done) {
    wss.close(done)
})

let wss: WebSocket.Server;
before('setup websocket server', () => {
    wss = new WebSocket.Server({ port: 0 })
    notification_connections.setupSocketManagement(wss)
})

describe('connection', async function () {
    let ws: WebSocket;
    it('client connects', function (done) {
        ws = new WebSocket(`http://localhost:${(wss.address() as AddressInfo).port}`, { headers: { "userId": "42" } })
        ws.on('open', () => {
            const map = notification_connections.getUserIDToSocketMap()
            expect(map.has("42")).to.be.true
            done()
        })
    })

    it('client disconnects', function (done) {
        ws.close()
        setTimeout(() => {
            const map = notification_connections.getUserIDToSocketMap()
            expect(map.has("42")).to.be.false
            done()
        })
    })

})
