import WebSocket from 'ws'
import express from 'express'
import { IContactRecord } from "../db/models/ContactRecord"


// hashmap with userID and corresponding websocket
const userIDToSocketMap = new Map<string, WebSocket>()
const contactNotificationBuffer = new Array<IContactRecord>()


function setupSocketManagement(wsServer: WebSocket.Server) : void {
    // called when client connects
    wsServer.on('connection', function(ws: WebSocket, req: express.Request) {
        console.log('New Client connected ', req.headers.userid);
        // add socket to socket map
        if (req.headers !== null && req.headers.userid instanceof String || 
            typeof req.headers.userid === 'string'){
                const userid = req.headers.userid as string;
                userIDToSocketMap.set(userid, ws)
                // if a new websocket connects, maybe it a user with a pending notification
                sendInfectedContactNotification(contactNotificationBuffer, true)
            }      
        
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

    wsServer.on('error', function(e: Error){
        console.log("Error in websocket ", e);
        userIDToSocketMap.clear();
    });
}

function sendInfectedContactNotification(contacts: Array<IContactRecord>, bufferCall: boolean) : void {
    // send to each user who has contact a notification
    for (const contact of contacts) {
        console.log("contact: ", contact)
        const sock = userIDToSocketMap.get(String(contact.userId))
        if (sock != null ) {
            sock.send("you had contact with an infected person");
            if (bufferCall) {
                contactNotificationBuffer.splice(contactNotificationBuffer.indexOf(contact), 1);
            }
            console.log("user ", contact.userId, " had contact with an infected person")
        }
        else {
            // no socket for the user available so the message has to be buffered until one is available
            contactNotificationBuffer.push(contact)
        }
    }
}

export default {setupSocketManagement, sendInfectedContactNotification}


