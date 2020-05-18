import express from 'express'
import bodyParser from 'body-parser'
import { router } from "./routes";

const app = express();

// Load Middlewares
app.use(bodyParser.json())

// Routes
app.use('/', router)

// Connect to mongodb
require('./db/connection')

// Start HTTP Server
const portNumber: number = process.env.PORT ? parseInt(process.env.PORT) : 3000
app.listen(portNumber, () => {
  console.log('Server listening on port ' + portNumber + '.');
});