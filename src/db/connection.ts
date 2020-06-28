import mongoose from "mongoose";

const connectionString: string = process.env.MONGODB_CONNECTION_STRING || 'mongodb://localhost/'

const opts = { useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true }

void mongoose.connect(connectionString, opts)
mongoose.connection.on('error', console.error.bind(console, 'connection error:'));
mongoose.connection.once('open', () => console.log('connected to db'))
