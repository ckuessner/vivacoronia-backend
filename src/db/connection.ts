import mongoose from "mongoose";
import { promises as fs } from 'fs';
import path from 'path';
import { setupRootAdminAccount } from './Users/userAccounts'

const connectionString: string = process.env.MONGODB_CONNECTION_STRING || 'mongodb://localhost/'

const opts = { useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true, useFindAndModify: false }

void mongoose.connect(connectionString, opts)
mongoose.connection.on('error', console.error.bind(console, 'connection error:'));
mongoose.connection.once('open', () => console.log('connected to db'))

async function initRootAdmin(): Promise<void> {
    // Check if the ADMIN_PASSWORD is set in the process environment. Ignore if the string is empty.
    let passwordPlainText;
    if (process.env.ADMIN_PASSWORD && process.env.ADMIN_PASSWORD !== "") {
        passwordPlainText = process.env.ADMIN_PASSWORD
    } else {
        const filePath = path.join(__dirname, '..', '..', 'res', 'rootAdminPassword');
        const data = await fs.readFile(filePath, 'utf8');
        const lines = data.split(/\r?\n/);
        passwordPlainText = lines[0];
    }

    const root = await setupRootAdminAccount(passwordPlainText)
    console.log("Created root admin account: \n" + String(root._id))
}

export default { opts, connectionString, initRootAdmin }
