import 'mocha'
import mongoDBHelper from './mongoDBHelper'
import QuizQuestion, { LeanQuizQuestion } from '../src/db/Quiz/models/QuizQuestion';
import { expect } from 'chai';
import { getUserAccountRecords } from './userAccountsSetup';
import LocationRecord from '../src/db/Tracking/models/LocationRecord';
import * as locationsDb from '../src/db/Tracking/locations';

describe('Quiz', function () {
    //let rootAdmin: RootUserInfo
    //let adminJWT: string

    before('connect to MongoDB', async function () {
        await mongoDBHelper.start()
        //rootAdmin = mongoDBHelper.getRootUserInfo()
        //adminJWT = await getAdminJWT(rootAdmin.userId, rootAdmin.password)
    })

    after('disconnect from MongoDB', async function () {
        await mongoDBHelper.stop()
    })

    describe('validators', function () {
        afterEach('delete QuizQuestions', async function () {
            await QuizQuestion.deleteMany({})
        })

        it('creates correct QuizQuestions', async function () {
            await QuizQuestion.create({ question: "a,b,c,d", answers: ["a", "b", "c", "d"], correctAnswer: "a" })
            expect(await QuizQuestion.estimatedDocumentCount({})).to.equal(1)
        })

        it('doesn\'t create incorrect QuizQuestions', async function () {
            await shouldntCreate({ question: "a,b,c,d", answers: ["a", "b", "c"], correctAnswer: "a" })
            await shouldntCreate({ question: "a,b,c,d", answers: ["a", "b", "c", "d"], correctAnswer: "z" })
        })
    })

    async function shouldntCreate(doc: LeanQuizQuestion) {
        try { await QuizQuestion.create(doc) } catch (err) { }
        expect(await QuizQuestion.find(doc)).to.be.empty
    }

    describe('closest person online', function () {
        let userIds: any;
        before('create users', async function () {
            const userAccounts = await getUserAccountRecords(5)
            userIds = Array.from(userAccounts.map(acc => acc.userId))
            const timestamp = Date.now()
            await LocationRecord.create([
                // Earlier than second entry
                { userId: userAccounts[0].userId, time: new Date(timestamp - 1000), location: { type: "Point", coordinates: [10, 3] } },
                // Should match
                { userId: userAccounts[0].userId, time: new Date(timestamp), location: { type: "Point", coordinates: [10, 4] } },
                // Further away than user 0
                { userId: userAccounts[1].userId, time: new Date(timestamp), location: { type: "Point", coordinates: [10, 5] } },
                // Not online
                { userId: userAccounts[2].userId, time: new Date(timestamp), location: { type: "Point", coordinates: [10, 2] } },
                // Too long ago (> 10 Min.)
                { userId: userAccounts[3].userId, time: new Date(timestamp - 11 * 60 * 1000), location: { type: "Point", coordinates: [10, 3] } }
            ])

            return new Promise((resolve) => setTimeout(resolve, 100))
        })

        it('chooses clostest user online', async function () {
            const res = await locationsDb.getClosestUser([userIds[3], userIds[1], userIds[0], userIds[4]], [10, 1])
            expect(res, "Closest user should not be null").to.not.be.null
            if (res === null) throw new Error() // for tsc
            expect(res.userId).to.eq(userIds[0])
        })
    })
})
