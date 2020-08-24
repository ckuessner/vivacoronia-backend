import mongoose from "mongoose";
import bcrypt from 'bcryptjs';
import UserAccountRecord, { IUserAccountRecord } from "./Users/models/UserAccountRecord";
import { isNull } from "util";
import { promises as fs } from 'fs';
import path from 'path';

const connectionString: string = process.env.MONGODB_CONNECTION_STRING || 'mongodb://localhost/'

const opts = { useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true, useFindAndModify: false }

void mongoose.connect(connectionString, opts)
mongoose.connection.on('error', console.error.bind(console, 'connection error:'));
mongoose.connection.once('open', () => console.log('connected to db'))


async function setupRootAdminAccount(): Promise<void> {
    const rootAdmin = await UserAccountRecord.findOne({ isRootAdmin: true })
    let recordId

    if (isNull(rootAdmin)) {
        // Check if the ADMIN_PASSWORD is set in the process environment. Ignore if the string is empty.
        let passwordHash;
        if (process.env.ADMIN_PASSWORD && process.env.ADMIN_PASSWORD !== "") {
            passwordHash = await bcrypt.hash(process.env.ADMIN_PASSWORD, 10)
        } else {
            const filePath = path.join(__dirname, '..', '..', 'res', 'rootAdminPassword');
            const data = await fs.readFile(filePath, 'utf8');
            const lines = data.split(/\r?\n/);
            const password = lines[0]

            passwordHash = await bcrypt.hash(password, 10)
        }

        await UserAccountRecord.create({
            "timeCreated": new Date().toISOString(),
            "passwordHash": passwordHash,
            "isAdmin": true,
            "isRootAdmin": true
        }).then((record: IUserAccountRecord) => {
            console.log("Created Admin account: \n" + String(record))
            recordId = record._id as string
        })
    }
    else {
        recordId = rootAdmin._id as string
    }

    await fs.writeFile(path.join(__dirname, '..', '..', 'res', 'rootAdminUserId'), String(recordId))
}

void setupRootAdminAccount()

export { opts, connectionString }
