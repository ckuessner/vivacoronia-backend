import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import * as uac from '../src/db/Users/userAccounts'

const opts = { useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true, useFindAndModify: false }
let mongoServer: MongoMemoryServer;
let rootUserInfo: RootUserInfo;

async function setupRootAdminAccount(): Promise<RootUserInfo> {
    const password = "testPassword"
    const root = await uac.setupRootAdminAccount(password)
    return { password, userId: root._id }
}

export type RootUserInfo = {
    password: string,
    userId: string
}

async function start() {
    if (!mongoServer) {
        mongoServer = new MongoMemoryServer()
        const uri = await mongoServer.getUri()
        await mongoose.connect(uri, opts)
        rootUserInfo = await setupRootAdminAccount()
    } else {
        await clear()
    }
}

async function clear() {
    for (const collection in mongoose.connection.collections) {
        if (collection === 'useraccountrecords') {
            await mongoose.connection.collections[collection].deleteMany({ isRootAdmin: false })
        } else {
            await mongoose.connection.collections[collection].deleteMany({})
        }
    }
}

async function stop() {
    await clear()
}

function getRootUserInfo(): RootUserInfo {
    if (!rootUserInfo) {
        throw new Error("root user not created")
    } else {
        return rootUserInfo
    }
}

export default { start, stop, getRootUserInfo }
