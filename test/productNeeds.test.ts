import mongoDBHelper from "./mongoDBHelper";
import 'mocha';
import app from '../src/app'
import request from 'supertest';
import ProductNeedRecord from "../src/db/trading/models/ProductNeed"

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

describe('POST /trading/product_need/', function(){

    it("Successfull Post", async function(){
        await request(app)
            .post('/trading/product_need/')
            .send(getValidProductNeed())
            .expect(201)
    })

    it("Failed Post", async function(){
        await request(app)
            .post('/trading/product_need/')
            .send({userId: 45, product: "Flour 1kg"})
            .expect(400)
    })
})