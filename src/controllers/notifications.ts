import WebSocket from 'ws'
import express from 'express'
import { IContactRecord } from "../db/Tracking/models/ContactRecord"
import { ProductOfferDocument } from "../db/trading/models/ProductOffer"
import { ProductNeedDocument } from '../db/trading/models/ProductNeed'
import { checkUserIdForWebSockets } from '../middleware/auth'

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
        if (req.headers != null && typeof req.headers.userid === 'string' && typeof req.headers.jwt === 'string') {
            // since the function after connection event has to be synchron we first have to let the connection establish
            void checkUserIdForWebSockets(req, ws)
        } else {
            console.error("Client connected, but no userId found. Headers: ", req.headers)
            ws.close()
        }


        ws.on('message', function (message: string) {
            console.log(message)
        })

        ws.on('ping', function () {
            ws.pong()
        })

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

function addUserToSocketMapAfterAuthentication(userId: string, ws: WebSocket): void {
    userIDToSocketMap.set(userId, ws)
    console.log("added user ", userId, " to socket map")
    // if a new websocket connects, maybe it is a user with a pending notification
    const userBuffer = userContactNotificationBuffer.get(userId)
    if (userBuffer) {
        userContactNotificationBuffer.delete(userId)
        userBuffer.forEach((message) => {
            sendNotification(userId, message).catch(() => bufferMessage(userId, message))
        });
    }
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

async function sendMatchingProductsNotification(need: ProductNeedDocument, offers: Array<ProductOfferDocument>): Promise<void> {
    const notifiedUser = need.userId
    if (offers.length >= 1) {
        // the message contains the parameters for the product search
        const msg = JSON.stringify({ product: need.product.toLowerCase(), productCategory: need.productCategory.toLowerCase(), minAmount: need.amount, location: need.location.coordinates, perimeter: 30000, numberOfOffers: offers.length })
        try {
            await sendNotification(notifiedUser, msg)
        } catch (err) {
            console.error("Could not notifiy user ", notifiedUser)
            bufferMessage(notifiedUser, msg)
        }
    }
}

async function sendNoficationAfterOfferPost(offer: ProductOfferDocument, needs: Array<ProductNeedDocument>): Promise<void> {
    // if a user has a need matching his own offer he will no be notified 
    // if a user has more than one matching need it suffices to notify him once
    const userSet = new Set(needs.filter(n => offer.userId != n.userId).map(n => n.userId))
    const msg = JSON.stringify({ userId: offer.userId, product: offer.product.toLowerCase(), productCategory: offer.productCategory.toLowerCase(), minAmount: offer.amount, price: offer.price, location: offer.location.coordinates, perimeter: 30000 })
    for (const userId of userSet) {
        console.log("notify user ", userId)
        try {
            await sendNotification(userId, msg)
        } catch (err) {
            console.error("Could not notify user ", userId)
            bufferMessage(userId, msg)
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

function getConnectedUsers(): string[] {
    return Array.from(userIDToSocketMap.keys())
}

export const CONTACT_NOTIFICATION_STRING = "you had contact with an infected person"
export default { setupSocketManagement, sendInfectedContactNotifications, sendNotification, getConnectedUsers, sendMatchingProductsNotification, sendNoficationAfterOfferPost, addUserToSocketMapAfterAuthentication }
