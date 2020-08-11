import mongoDBHelper from "./mongoDBHelper";
import 'mocha';
import app from '../src/app'
import request from 'supertest';
import ProductNeedRecord from "../src/db/trading/models/ProductNeed"
import { expect } from "chai";

before('connect to MongoDB', async function () {
    await mongoDBHelper.start()
})

before('add foods category', async function() {
    await request(app)
        .post('/trading/categories/')
        .send({name: "foods"})
})

beforeEach('delete LocationRecords', async () => {
    await ProductNeedRecord.deleteMany({})
})

after('disconnect from MongoDB', async function () {
    await mongoDBHelper.stop()
})

function getValidProductNeed(){
    return {userId: 42, product: "Flour 1kg", productCategory: "foods", location: { type: "Point", coordinates: [-122.96, 50.114] } }
}

describe('POST /trading/needs/', function(){

    it("Successfull Post", async function(){
        await request(app)
            .post('/trading/needs/')
            .send(getValidProductNeed())
            .expect(201)
    })

    it("Failed Post", async function(){
        await request(app)
            .post('/trading/needs/')
            .send({userId: 45, product: "Flour 1kg"})
            .expect(400)
    })
})

describe('GET /trading/needs/', function(){

    it("Non-empty Get", async function(){
        await ProductNeedRecord.insertMany([getValidProductNeed()])
        const res = await request(app).get('/trading/needs/')
        expect(res.status).to.equal(200)
        expect(res.body).to.have.lengthOf(1)
    })

    it('empty Get', async function(){
        const res = await request(app).get('/trading/needs/')
        expect(res.status).to.equal(200)
        expect(res.body).to.have.lengthOf(0)
    })
})
