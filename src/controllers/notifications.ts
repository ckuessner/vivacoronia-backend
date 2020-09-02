import WebSocket from 'ws'
import express from 'express'
import { IContactRecord } from "../db/Tracking/models/ContactRecord"

// map with userID and corresponding websocket
export const userIDToSocketMap = new Map<string, WebSocket>()
// map from userId to contact notification message buffer 
const userContactNotificationBuffer = new Map<string, string[]>()


function setupSocketManagement(wsServer: WebSocket.Server): void {
    // called when client connects
    wsServer.on('connection', function (ws: WebSocket, req: express.Request) {
        // TODO: user authentication
        console.log('New Client connected to websocket', req.headers.userid);
        // add socket to socket map
        if (req.headers != null && typeof req.headers.userid === 'string') {
            const userId = req.headers.userid;
            userIDToSocketMap.set(userId, ws)
            // if a new websocket connects, maybe it a user with a pending notification
            const userBuffer = userContactNotificationBuffer.get(userId)
            if (userBuffer) {
                userContactNotificationBuffer.delete(userId)
                userBuffer.forEach((message) => {
                    sendNotification(userId, message).catch(() => bufferMessage(userId, message))
                });
            }
        } else {
            console.error("Client connected, but no userId found. Headers: ", req.headers)
            ws.close()
        }

        ws.on('close', function () {
            userIDToSocketMap.forEach(function deleteSocket(value, key) {
                if (ws === value) {
                    userIDToSocketMap.delete(key);
                    return;
                }
            });
            console.log("closing socket")
        });
    });

    wsServer.on('error', function (e: Error) {
        console.log("Error in websocket ", e);
        userIDToSocketMap.clear();
    });
}

function bufferMessage(userId: string, message: string) {
    const buffer = userContactNotificationBuffer.get(userId)
    if (buffer == undefined || buffer.length === 0) {
        userContactNotificationBuffer.set(userId, [message])
    } else {
        buffer.push(message)
    }
}


async function sendInfectedContactNotifications(contacts: Array<IContactRecord>): Promise<void> {
    // send to each user who has contact a notification
    const usersToNotify = new Set(contacts.map(c => c.userId))
    for (const userId of usersToNotify) {
        // a user should only be notified once for a contact with another user
        try {
            await sendNotification(userId, CONTACT_NOTIFICATION_STRING)
        } catch (err) {
            console.error("Could not notifiy user ", userId)
            bufferMessage(userId, CONTACT_NOTIFICATION_STRING)
        }
    }
}

async function sendNotification(userId: string, message: string): Promise<void> {
    const sock = userIDToSocketMap.get(userId)
    if (sock != null) {
        return new Promise((resolve, reject) => {
            sock.send(message, (err?: Error) => {
                if (err) reject(err)
                resolve()
            });
        });
    } else {
        return Promise.reject("No open socket for user")
    }
}

export const CONTACT_NOTIFICATION_STRING = "you had contact with an infected person"
export default { setupSocketManagement, sendInfectedContactNotifications, sendNotification }
