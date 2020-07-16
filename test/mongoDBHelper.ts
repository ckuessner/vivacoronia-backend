import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";

const opts = { useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true }
let mongoServer: MongoMemoryServer;

async function start() {
    mongoServer = new MongoMemoryServer();
    const uri = await mongoServer.getUri()
    return mongoose.connect(uri, opts)
}

async function stop() {
    await mongoose.disconnect()
    await mongoServer.stop()
}

export default { start, stop }
