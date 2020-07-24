import 'mocha'
import app from '../src/app'
import chai, { expect } from 'chai';
import request from 'supertest';
import { } from "chai-subset";
chai.use(require('chai-subset'))

var userId: string
var password = "abc"
var jwt: string

describe('Test user authentication process', function () {
    it('creates a new userAccount', function (done) {
        request(app)
            .post('/user/')
            .send({ password: password })
            .expect(200)
            .expect('Content-Type', /json/)
            .then(response => {
                expect(response.body.userId).to.be.an('string')
                userId = response.body.userId
                done()
            })

    })

    it('denies jwt because of wrong password', function (done) {
        request(app)
            .post('/userJWT/' + userId)
            .send({ password: 'wrong password' })
            .expect(401)
            .end(done)
    })

    it('returns a new jwt with correct password', function (done) {
        request(app)
            .post('/userJWT/' + userId + '/')
            .send({ password: password })
            .expect(200)
            .expect('Content-Type', /json/)
            .then(response => {
                expect(response.body.jwt).to.be.an('string')
                jwt = response.body.jwt
                done()
            })
    })

    it('returns locations for a userId with correct jwt', function (done) {
        request(app)
            .get('/locations/' + userId + '/')
            .set({ jwt: jwt })
            .expect(200)
            .end(done)
    })

    it('denies access locations for a userId with wrong jwt', function (done) {
        request(app)
            .get('/locations/' + userId + '/')
            .set({ jwt: 'abc.cdc.bla' })
            .expect(401)
            .end(done)
    })
})

var adminJWT: string

describe('Test admin authentication', function () {

    it('returns a new admin jwt for correct admin password', function (done) {
        request(app)
            .post('/adminJWT/')
            .send({ password: 'thisPasswordIsDamnStrong!!!' })
            .expect(200)
            .expect('Content-Type', /json/)
            .then(response => {
                expect(response.body.jwt).to.be.an('string')
                adminJWT = response.body.jwt
                done()
            })
    })

    it('denies a new admin jwt for incorrect admin password', function (done) {
        request(app)
            .post('/adminJWT/')
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
            .set({ adminjwt: 'abc.edf.aaa' })
            .expect(401)
            .end(done)
    })

})
