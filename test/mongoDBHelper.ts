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

        const saltRounds = 10

        const password = "thisPasswordIsDamnStrong!!!"

        const salt = await bcrypt.genSalt(saltRounds)
        const hashPassword = await bcrypt.hash(password.toString(), salt)

        AdminPasswordRecord.create({
            "timeCreated": new Date().toISOString(),
            "password": hashPassword,
            "salt": salt
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
