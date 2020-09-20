import 'mocha'
import app from '../src/app'
import chai, { expect } from 'chai';
import request from 'supertest';
import { } from "chai-subset";
import mongoDBHelper, { RootUserInfo } from './mongoDBHelper';
chai.use(require('chai-subset'))

describe('Auth', function () {
    let adminInfo: RootUserInfo

    before('connect to MongoDB', async function () {
        await mongoDBHelper.start()
        adminInfo = mongoDBHelper.getRootUserInfo()
    })

    after('disconnect from MongoDB', async function () {
        await mongoDBHelper.stop()
    })

    describe('Test user authentication process', function () {
        let newUserPassword = "abc"
        let newUserUserId: string
        let newUserJwt: string
        let wrongJwt = 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI1ZjQ5MTdmZDBjMTNkZDAwNjEwNTlkM2UiLCJqdGkiOiJ1c2VyIn0.Jwp_1h1vNMu2ZHx5_WIqAYPRqa0ZhHmbeV-wwvyaDneaft3uNUbBSETP4iq2Oh5zp2Kil4vlqJ3qa1aEB4l1gAd8j3BS61Xk2IZ3MUL-AJDzt1-LoLK2xxdlRokGr5P290SEZSh9R6cl9Y6ncrnO_924ejuzfzn9BJTYOJj2buhUp071f7S-PB44plz8YGBz9DtOULtdnu-DFvKICYNCJlCxut8rcwVlPbF6z16ekybR0ekyDOCTI9ftYExLlK-inkUPnfzr-MK5p_lnlCxDurT4S8nMaXKWvWUAfA3gAyVvNEpTLMXV0-a47oxcLcosfkch6GYwqxWkk39zQDa8Hw'

        it('creates a new userAccount', function (done) {
            request(app)
                .post('/user/')
                .send({ password: newUserPassword })
                .expect(200)
                .expect('Content-Type', /json/)
                .then(response => {
                    expect(response.body.userId).to.be.an('string')
                    newUserUserId = response.body.userId
                    done()
                })
        })

        it('denies jwt because of wrong password', function (done) {
            request(app)
                .post('/user/' + newUserUserId + '/login/')
                .send({ password: 'wrong password' })
                .expect(401)
                .end(done)
        })

        it('returns a new jwt with correct password', function (done) {
            request(app)
                .post('/user/' + newUserUserId + '/login/')
                .send({ password: newUserPassword })
                .expect(200)
                .expect('Content-Type', /json/)
                .then(response => {
                    expect(response.body.jwt).to.be.an('string')
                    newUserJwt = response.body.jwt
                    done()
                })
        })

        it('returns locations for a userId with correct jwt', function (done) {
            request(app)
                .get('/locations/' + newUserUserId + '/')
                .set({ jwt: newUserJwt })
                .expect(200)
                .end(done)
        })

        it('denies access locations for a userId with wrong jwt', function (done) {
            request(app)
                .get('/locations/' + newUserUserId + '/')
                .set({ jwt: wrongJwt })
                .expect(401)
                .end(done)
        })
    })


    describe('Test admin authentication', function () {
        let adminJWT: string

        it('returns a new admin jwt for correct admin password', function (done) {
            request(app)
                .post('/admin/' + adminInfo.userId + '/login/')
                .send({ password: adminInfo.password })
                .expect(200)
                .expect('Content-Type', /json/)
                .end((err, res) => {
                    expect(err).to.be.null
                    expect(res.body.jwt).to.not.be.undefined
                    expect(res.body.jwt).to.be.an('string')
                    adminJWT = res.body.jwt
                    done()
                })
        })

        it('denies a new admin jwt for incorrect admin password', function (done) {
            request(app)
                .post('/admin/' + adminInfo.userId + '/login/')
                .send({ password: 'wrongPassword' })
                .expect(401)
                .end(done)
        })

        it('grants access to all locations with correct admin jwt', function (done) {
            request(app)
                .get('/locations/')
                .set({ adminjwt: adminJWT })
                .expect(200)
                .end(done)
        })

        it('denies access to all locations with incorrect admin jwt', function (done) {
            request(app)
                .get('/locations/')
                .set({ adminjwt: 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI1ZjQ5MTdmZDBjMTNkZDAwNjEwNTlkM2UiLCJqdGkiOiJ1c2VyIn0.Jwp_1h1vNMu2ZHx5_WIqAYPRqa0ZhHmbeV-wwvyaDneaft3uNUbBSETP4iq2Oh5zp2Kil4vlqJ3qa1aEB4l1gAd8j3BS61Xk2IZ3MUL-AJDzt1-LoLK2xxdlRokGr5P290SEZSh9R6cl9Y6ncrnO_924ejuzfzn9BJTYOJj2buhUp071f7S-PB44plz8YGBz9DtOULtdnu-DFvKICYNCJlCxut8rcwVlPbF6z16ekybR0ekyDOCTI9ftYExLlK-inkUPnfzr-MK5p_lnlCxDurT4S8nMaXKWvWUAfA3gAyVvNEpTLMXV0-a47oxcLcosfkch6GYwqxWkk39zQDa8Hw' })
                .expect(401)
                .end(done)
        })

        it('denies access to all locations without admin jwt', function (done) {
            request(app)
                .get('/locations/')
                .expect(400)
                .end(done)
        })

    })
})
