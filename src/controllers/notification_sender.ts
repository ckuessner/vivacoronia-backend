import notification_connections from "../controllers/notification_connections"
import { IContactRecord } from "../db/models/ContactRecord"



function sendInfectedContactNotification(contacts: Array<IContactRecord>) {
        const socketMap = notification_connections.getUserIDToSocketMap();
        let i;
        // send to each user who has contact a notification
        for (i=0; i<contacts.length; i++) {
            console.log("contact: ", contacts[i])
            const sock = socketMap.get(String(contacts[i].userId))
            if (sock !== null && sock !== undefined) {
                sock.send("you had contact with an infected person");
                console.log("user ", contacts[i].userId, " had contact with an infected person")
            }
        }
}

export default {sendInfectedContactNotification}