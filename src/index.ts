import fs from 'fs';
import yaml from 'js-yaml';
import http from 'http';
import https from 'https';
import path from 'path';
import swaggerUi from 'swagger-ui-express';
import app from './app'
import WebSocket from 'ws'
import notification_connections from './controllers/notifications'

// Connect to mongodb
require('./db/connection');

// Start HTTP Server
const httpPort: number = process.env.PORT ? parseInt(process.env.PORT) : 3000;
const httpServer = http.createServer(app)
httpServer.listen(httpPort, () => {
  console.log('HTTP server listening on port ', httpPort, '.');
});

// Start HTTPS Server
let httpsServer;
if (process.env.HTTPS_PORT === "-1") {
  console.log("Not using builtin HTTPS Server, falling back to HTTP only")
} else {
  const httpsPort: number = process.env.HTTPS_PORT
    ? parseInt(process.env.HTTPS_PORT)
    : 3443;

  const keyLocation = process.env.KEY_LOCATION || '/keys/server.key';
  const certLocation = process.env.CERT_LOCATION || '/keys/server.crt';
  try {
    const key = fs.readFileSync(keyLocation, 'utf-8');
    const cert = fs.readFileSync(certLocation, 'utf-8');

    httpsServer = https.createServer({ key, cert }, app);
    httpsServer.listen(httpsPort, () => {
      console.log('HTTPS server listening on port ', httpsPort, '.');
    });
  } catch (error) {
    console.error("Could not start https server and websocket", error)
  }
}

// create websocket for push notifications
// rest api and websocket can run over the same port, fall back to httpServer if the httpsServer is not in use
const wsServer = new WebSocket.Server({ server: (httpsServer || httpServer) });
notification_connections.setupSocketManagement(wsServer);


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
  app.use('/swagger/', swaggerUi.serve, swaggerUi.setup(swaggerApiJson as swaggerUi.JsonObject));
} catch (e) {
  console.error('Could not start swagger-ui\n', e);
}
