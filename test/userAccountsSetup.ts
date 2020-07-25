import app from '../src/app'
import request from 'supertest';

export async function createUserAccount(password: string): Promise<string> {
    let ret = ""
    await request(app)
        .post('/user/')
        .send({ password: password })
        .then(response => {
            ret = response.body.userId
        })

    return ret
}

export async function getUserJWT(userId: string, password: string): Promise<string> {
    let ret = ""
    await request(app)
        .post('/userJWT/' + userId + '/')
        .send({ password: password })
        .then(response => {
            ret = response.body.jwt
        })

    return ret
}

export async function getAdminJWT(): Promise<string> {
    let ret = ""
    await request(app)
        .post('/adminJWT/')
        .send({ password: "thisPasswordIsDamnStrong!!!" })
        .then(response => {
            ret = response.body.jwt
        })

    return ret
}

export async function getUserAccountRecords(amount: number): Promise<Array<Record<string, string>>> {
    let userAccountRecords: Array<Record<string, string>> = []

    let password = "123"
    let userId = ""

    for (let index = 0; index < amount; index++) {
        userId = await createUserAccount("123")
        userAccountRecords.push({ userId: userId, jwt: await getUserJWT(userId, password), password: password })
    }

    return userAccountRecords
}
