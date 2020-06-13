import bodyParser from 'body-parser';
import express from 'express';
import fs from 'fs';
import yaml from 'js-yaml';
import https from 'https';
import path from 'path';
import swaggerUi from 'swagger-ui-express';
import { router } from './routes';

const app = express();

// Load Middlewares
app.use(bodyParser.json());

// Routes
app.use('/', router);

// swagger-ui
try {
  const swaggerApiYaml = fs.readFileSync(
    path.join(__dirname, '..', 'api.yaml'),
    'utf8'
  );
  // Convert YAML to JSON, swagger-ui-express doesn't support YAML
  const swaggerApiJson = yaml.safeLoad(swaggerApiYaml, {
    filename: 'api.yaml',
  });
  app.use('/swagger/', swaggerUi.serve, swaggerUi.setup(swaggerApiJson));
} catch (e) {
  console.error('Could not start swagger-ui\n', e);
}

// Connect to mongodb
require('./db/connection');

// Start HTTP Server
const httpPort: number = process.env.PORT ? parseInt(process.env.PORT) : 3000;
app.listen(httpPort, () => {
  console.log('HTTP server listening on port ' + httpPort + '.');
});

// Start HTTPS Server
const httpsPort: number = process.env.HTTPS_PORT
  ? parseInt(process.env.HTTPS_PORT)
  : 3443;
const keyLocation = process.env.KEY_LOCATION || '/keys/server.key';
const certLocation = process.env.CERT_LOCATION || '/keys/server.crt';
const key = fs.readFileSync(keyLocation, 'utf-8');
const cert = fs.readFileSync(certLocation, 'utf-8');

const httpsServer = https.createServer({ key, cert }, app);
httpsServer.listen(httpsPort, () => {
  console.log('HTTPS server listening on port ' + httpsPort + '.');
});
