import express from 'express'
import bodyParser from 'body-parser'
import { router } from "./routes";
import swaggerUi from 'swagger-ui-express'
import fs from 'fs'
import path from "path";
import yaml from "js-yaml";

const app = express();

// Load Middlewares
app.use(bodyParser.json())

// Routes
app.use('/', router)

// swagger-ui
try {
  const swaggerApiYaml = fs.readFileSync(path.join(__dirname, '..', 'api.yaml'), 'utf8')
  // Convert YAML to JSON, swagger-ui-express doesn't support YAML
  const swaggerApiJson = yaml.safeLoad(swaggerApiYaml, { filename: 'api.yaml' })
  app.use('/swagger/', swaggerUi.serve, swaggerUi.setup(swaggerApiJson))
} catch (e) {
  console.error('Could not start swagger-ui\n', e)
}

// Connect to mongodb
require('./db/connection')

// Start HTTP Server
const portNumber: number = process.env.PORT ? parseInt(process.env.PORT) : 3000
app.listen(portNumber, () => {
  console.log('Server listening on port ' + portNumber + '.');
});