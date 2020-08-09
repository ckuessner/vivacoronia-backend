import mongoose from "mongoose";
import bcrypt from 'bcryptjs';
import AdminPasswordRecord, { IAdminPasswordRecord } from "./Users/models/AdminPasswordRecord";
import { isNull } from "util";
import { promises as fs } from 'fs';
import path from 'path';

const connectionString: string = process.env.MONGODB_CONNECTION_STRING || 'mongodb://localhost/'

const opts = { useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true, useFindAndModify: false }

void mongoose.connect(connectionString, opts)
mongoose.connection.on('error', console.error.bind(console, 'connection error:'));
mongoose.connection.once('open', () => console.log('connected to db'))

async function setupAdminAccount(): Promise<void> {
    const adminPassword = await AdminPasswordRecord.findOne()

    if (isNull(adminPassword)) {
        // Check if the ADMIN_PASSWORD is set in the process environment. Ignore if the string is empty.
        let passwordHash;
        if (process.env.ADMIN_PASSWORD && process.env.ADMIN_PASSWORD !== "") {
            passwordHash = await bcrypt.hash(process.env.ADMIN_PASSWORD, 10)
        } else {
            const filePath = path.join(__dirname, '..', '..', 'res', 'adminPassword');
            const password = await fs.readFile(filePath, 'utf8');

            passwordHash = await bcrypt.hash(password, 10)
        }

        await AdminPasswordRecord.create({
            "timeCreated": new Date().toISOString(),
            "passwordHash": passwordHash,
        }).then((record: IAdminPasswordRecord) => {
            console.log("Created Admin account: \n" + String(record))
        })
    }
}

void setupAdminAccount()

export { opts, connectionString }
