import mongoose from "mongoose";
import bcrypt from 'bcryptjs';
import AdminPasswordRecord, { IAdminPasswordRecord } from "./Users/models/AdminPasswordRecord";
import { isNull } from "util";
import { readFileSync } from 'fs';
import path from 'path';

const connectionString: string = process.env.MONGODB_CONNECTION_STRING || 'mongodb://localhost/'

const opts = { useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true, useFindAndModify: false }

void mongoose.connect(connectionString, opts)
mongoose.connection.on('error', console.error.bind(console, 'connection error:'));
mongoose.connection.once('open', () => console.log('connected to db'))

async function setupAdminAccount(): Promise<void> {
    const adminPassword = await AdminPasswordRecord.findOne()

    if (isNull(adminPassword)) {

        const filePath = path.join(__dirname, '..', '..', 'res', 'adminPassword');
        const password = readFileSync(filePath, 'utf8');

        const hashPassword = await bcrypt.hash(password, 10)

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

void setupAdminAccount()

export { opts, connectionString }
