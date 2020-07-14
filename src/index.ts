import fs from 'fs';
import yaml from 'js-yaml';
import https from 'https';
import path from 'path';
import swaggerUi from 'swagger-ui-express';
import app from './app'

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

// Connect to mongodb
require('./db/connection');

// Start HTTP Server
const httpPort: number = process.env.PORT ? parseInt(process.env.PORT) : 3000;
app.listen(httpPort, () => {
  console.log('HTTP server listening on port ', httpPort, '.');
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
  console.log('HTTPS server listening on port ', httpsPort, '.');
});

// create websocket for push notifications
const WebSocket = require('ws');
const wsServer = new WebSocket.Server({server: httpsServer}); // rest api and websocket can run over the same port

// hashmap with userID and corresponding websocket
let userIDToSocketMap = new Map()

wsServer.on('connection', function(ws: any, req: any) {
  console.log('New Client connected ', req.headers.userid);
  // add socket to socket map
  const userid = req.headers.userid;
  userIDToSocketMap.set(userid, ws)

  ws.on('message', function(msg: String){
    console.log('message received ' + msg);
    ws.send(msg)
  })

  ws.on('close', function(){
    userIDToSocketMap.forEach(function deleteSocket(value, key){
        if (ws === value){
          userIDToSocketMap.delete(key);
          return;
        }
    });
    console.log("closing socket")
    console.log(userIDToSocketMap)
  });
});

wsServer.on('listening', function(){
  console.log("websocket listening");
});

wsServer.on('error', function(){
  console.log("error while connecting");
});

function getSockets (){
  return userIDToSocketMap
}

export default {getSockets}