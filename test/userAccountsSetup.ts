import app from '../src/app'
import request from 'supertest';

export async function createUserAccount(password: string): Promise<string> {
    return await request(app)
        .post('/user/')
        .send({ password: password })
        .then(response => {
            return response.body.userId
        })
}

export async function getUserJWT(userId: string, password: string): Promise<string> {
    return await request(app)
        .post('/user/' + userId + '/login/')
        .send({ password: password })
        .then(response => {
            return response.body.jwt
        })
}

export async function getAdminJWT(): Promise<string> {
    return await request(app)
        .post('/admin/login/')
        .send({ password: "testPassword!!!" })
        .then(response => {
            return response.body.jwt
        })
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
