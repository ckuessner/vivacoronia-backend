import mongoose from "mongoose";
import bcrypt from 'bcryptjs';
import AdminPasswordRecord, { IAdminPasswordRecord } from "./Users/models/AdminPasswordRecord";
import { isNull } from "util";

const connectionString: string = process.env.MONGODB_CONNECTION_STRING || 'mongodb://localhost/'

const opts = { useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true, useFindAndModify: false }

void mongoose.connect(connectionString, opts)
mongoose.connection.on('error', console.error.bind(console, 'connection error:'));
mongoose.connection.once('open', () => console.log('connected to db'))

export { opts, connectionString }

export async function setupAdminAccount(): Promise<void> {
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
            console.log("Created Admin account: \n" + record)
        }).catch((error: Error) => {
            throw error
        });
    }
}

setupAdminAccount()
