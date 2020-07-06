import 'mocha'
import mongoose from 'mongoose';
import { MongoMemoryServer } from "mongodb-memory-server";
import app from '../src/app'
import LocationRecord, { ILocationRecord } from '../src/db/models/LocationRecord';
import chai, { expect } from 'chai';
import request from 'supertest';
import { } from "chai-subset";
chai.use(require('chai-subset'))

let mongoServer: MongoMemoryServer;

before('connect to MongoDB', (done) => {
    mongoServer = new MongoMemoryServer();
    mongoServer.getUri()
        .then((uri) => {
            process.env.MONGODB_CONNECTION_STRING = uri
            require('../src/db/connection')
            mongoose.connection.on('open', done)
        })
})

after('disconnect from MongoDB', async () => {
    await mongoose.disconnect()
    await mongoServer.stop()
})

beforeEach('delete LocationRecords', async () => {
    await LocationRecord.deleteMany({})
})

function getTestRecords() {
    return [
        { userId: 42, time: "2020-05-21T19:39:08.000Z", location: { type: "Point", coordinates: [-122.96, 50.114] } },
        { userId: 99, time: "2020-04-12T21:50:42.000Z", location: { type: "Point", coordinates: [-8.454, 50.225] } },
        { userId: 99, time: "2020-05-12T21:50:42.000Z", location: { type: "Point", coordinates: [-9.454, 42.225] } }
    ]
}
const testRecords = getTestRecords();


describe('GET /locations/', function () {

    it('responds with empty array as JSON when no LocationRecords exist', function (done) {
        request(app)
            .get('/locations/')
            .expect(200)
            .expect('Content-Type', /json/)
            .expect([])
            .end(done)
    })

    it('responds with correct LocationRecords when multiple exist', async function () {
        await LocationRecord.insertMany(testRecords)
        const res = await request(app).get('/locations/')
        expect(res.status).to.equal(200)
        expect(res.body).to.be.an('array')
        expect(res.body).to.have.lengthOf(testRecords.length)
        expect(res.body).to.containSubset(testRecords)
    })

    it('responds with correct LocationRecords', async function () {
        const testRecord = testRecords[0]
        await LocationRecord.insertMany(testRecord)
        const res = await request(app).get('/locations/')
        expect(res.status).to.equal(200)
        expect(res.body).to.be.an('array')
        expect(res.body).to.have.lengthOf(1)
        expect(res.body).to.containSubset([testRecord])
    })
})

describe('GET /locations/:userId/', function () {
    it('responds with single location record for user with one location record', async function () {
        await LocationRecord.insertMany(testRecords)
        const res = await request(app).get('/locations/' + testRecords[0].userId + '/')
        expect(res.status).to.equal(200)
        expect(res.body).to.be.an('array')
        expect(res.body).to.have.lengthOf(1)
        expect(res.body).to.containSubset([testRecords[0]])
    })
    it('responds with 200 when user nonexistent', async function () {
        await LocationRecord.insertMany(testRecords)
        const res = await request(app).get('/locations/10101010/')
        expect(res.status).to.equal(200)
        expect(res.body).to.be.an('array')
        expect(res.body).to.have.lengthOf(0)
    })
    it('responds with multiple location records for user with multiple location records', async function () {
        await LocationRecord.insertMany(testRecords)
        const res = await request(app).get('/locations/99/')
        expect(res.status).to.equal(200)
        expect(res.body).to.be.an('array')
        expect(res.body).to.have.lengthOf(2)
        expect(res.body).to.containSubset([testRecords[1], testRecords[2]])
    })
})

describe('POST /locations/:userId/', function () {
    it('stores all records with userId from URI', async function () {
        await request(app)
            .post('/locations/1234/')
            .send(testRecords)
            .expect(201)
        const records = await LocationRecord.find().exec()
        expect(records).to.have.lengthOf(3)
        // Creates a deep copy
        const testRecordsWithCorrectUserId = JSON.parse(JSON.stringify(testRecords))
        testRecordsWithCorrectUserId.forEach((rec: ILocationRecord) => rec.userId = 1234)
        expect(JSON.parse(JSON.stringify(records))).to.containSubset(testRecordsWithCorrectUserId)
    })

    it('doesn\'t create records when not all fields are provided', async function () {
        let record = getTestRecords()[0]
        record.location.coordinates = []
        await request(app)
            .post('/locations/1234/')
            .send(record)
            .expect(400)

        record = getTestRecords()[0]
        record.location.type = "invalid"
        await request(app)
            .post('/locations/1234/')
            .send(record)
            .expect(400)

        record = getTestRecords()[0]
        // @ts-ignore
        record.location = undefined
        await request(app)
            .post('/locations/1234/')
            .send(record)
            .expect(400)

        record = getTestRecords()[0]
        record.time = "2020"
        await request(app)
            .post('/locations/1234/')
            .send(record)
            .expect(400)

        expect(await LocationRecord.estimatedDocumentCount() === 0)

        let records = getTestRecords()
        // @ts-ignore
        records[2].location = undefined
        await request(app)
            .post('/locations/1234/')
            .send(record)
            .expect(400)
        expect(await LocationRecord.estimatedDocumentCount() === 0)

    })

    it('doesn\'t create records when lon/lat invalid', async function () {
        const record = getTestRecords()[0]
        record.location.coordinates = [90, 180]
        await request(app)
            .post('/locations/1234/')
            .send(record)
            .expect(400)
    })
})
