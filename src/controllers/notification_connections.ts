import WebSocket from 'ws'
import express from 'express'

// hashmap with userID and corresponding websocket
const userIDToSocketMap = new Map<string, WebSocket>()

function getUserIDToSocketMap(): Map<string, WebSocket> {
    return userIDToSocketMap;
}

function setupSocketManagement(wsServer: WebSocket.Server): void {
    // called when client connects
    wsServer.on('connection', function (ws: WebSocket, req: express.Request) {
        console.log('New Client connected ', req.headers.userid);
        console.log('ws has type: ', typeof (ws))
        // add socket to socket map
        const userid = req.headers.userid as string;
        userIDToSocketMap.set(userid, ws)
        console.log(userIDToSocketMap)

        ws.on('message', function (msg: string) {
            console.log('message received ' + msg);
            ws.send(msg)
        })

        ws.on('close', function () {
            userIDToSocketMap.forEach(function deleteSocket(value, key) {
                if (ws === value) {
                    userIDToSocketMap.delete(key);
                    console.log("closing websocket of user", key)
                    return;
                }
            });
        });
    });

    wsServer.on('error', function (e: Error) {
        console.log("Error in websocket ", e);
    });
}

export default { setupSocketManagement, getUserIDToSocketMap }


