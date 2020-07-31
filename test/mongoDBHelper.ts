import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import AdminPasswordRecord, { IAdminPasswordRecord } from "../src/db/Users/models/AdminPasswordRecord";
import { isNull } from "util";
import bcrypt from 'bcryptjs';

const opts = { useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true }
let mongoServer: MongoMemoryServer;

async function setupAdminAccount(): Promise<void> {
    const adminPassword = await AdminPasswordRecord.findOne()

    if (isNull(adminPassword)) {

        const password = "testPassword!!!"
        const hashPassword = await bcrypt.hash(password.toString(), 10)

        AdminPasswordRecord.create({
            "timeCreated": new Date().toISOString(),
            "passwordHash": hashPassword,
        }).then((record: IAdminPasswordRecord) => {
            console.log("Created Admin account: \n" + String(record))
        }).catch((error: Error) => {
            throw error
        });
    }
}

async function start() {
    mongoServer = new MongoMemoryServer();
    const uri = await mongoServer.getUri()
    return mongoose.connect(uri, opts)
}

async function stop() {
    await mongoose.disconnect()
    await mongoServer.stop()
}

export default { start, stop, setupAdminAccount }
