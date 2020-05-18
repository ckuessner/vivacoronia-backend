import mongoose from "mongoose";

const connectionString: string = process.env.MONGODB_CONNECTION_STRING || 'mongodb://localhost/'

mongoose.connect(connectionString, { useNewUrlParser: true, useUnifiedTopology: true })
mongoose.connection.on('error', console.error.bind(console, 'connection error:'));
mongoose.connection.once('open', () => console.log('connected to db'))

export default mongoose.connection