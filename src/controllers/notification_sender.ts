import notification_connections from "../controllers/notification_connections"
import { IContactRecord } from "../db/models/ContactRecord"

function sendInfectedContactNotification(contacts: Array<IContactRecord>): void {
    const socketMap = notification_connections.getUserIDToSocketMap();
    // send to each user who has contact a notification
    for (const contact of contacts) {
        console.log("contact: ", contact)
        const sock = socketMap.get(String(contact.userId))
        if (sock != null) {
            sock.send("you had contact with an infected person");
            console.log("user ", contact.userId, " had contact with an infected person")
        }
    }
}

export default { sendInfectedContactNotification }
