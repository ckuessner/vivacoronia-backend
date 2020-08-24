import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import UserAccountRecord, { IUserAccountRecord } from "../src/db/Users/models/UserAccountRecord";
import bcrypt from 'bcryptjs';

const opts = { useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true }
let mongoServer: MongoMemoryServer;

async function setupRootAdminAccount(): Promise<Record<string, string>> {
    const password = "testPassword"
    let recordId

    const passwordHash = await bcrypt.hash(password, 10)

    await UserAccountRecord.create({
        "timeCreated": new Date().toISOString(),
        "passwordHash": passwordHash,
        "isAdmin": true,
        "isRootAdmin": true
    }).then((record: IUserAccountRecord) => {
        console.log("Created Admin account: \n" + String(record))
        recordId = record._id as string
    })

    return { userId: String(recordId), password: password }
}

async function start() {
    if (!mongoServer) {
        mongoServer = new MongoMemoryServer()
        const uri = await mongoServer.getUri()
        await mongoose.connect(uri, opts)
    }

    for (const collection in mongoose.connection.collections) {
        await mongoose.connection.collections[collection].deleteMany({})
    }
}

async function stop() {
    for (const collection in mongoose.connection.collections) {
        await mongoose.connection.collections[collection].deleteMany({})
    }
}

export default { start, stop, setupRootAdminAccount }
