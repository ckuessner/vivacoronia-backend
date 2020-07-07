import { Request, Response } from "express";
import contactsDb from "../db/contacts";
import { IContactRecord } from "../db/models/ContactRecord";
import { IInfectionRecord } from "../db/models/InfectionRecord";
import tracing from "../db/contacts";
import index from "../index"

const TWO_WEEKS_MS = 14 * 24 * 60 * 60 * 1000

async function getAllContactRecords(_: Request, res: Response): Promise<void> {
    const records: IContactRecord[] = await contactsDb.getAllContactRecords()
    res.json(records)
}

async function startContactTracing(infectionRecord: IInfectionRecord): Promise<void> {
    const contacts = await tracing.findContacts(
        infectionRecord.userId,
        infectionRecord.occuredDateEstimation || new Date(infectionRecord.dateOfTest.getTime() - TWO_WEEKS_MS)
    )

    if (contacts.length === 0) {
        console.log("No contacts found for infectionRecord", infectionRecord)
    }
    else {
        console.log("Contacts found for infectionRecord", infectionRecord,
        "\ncontacts:\n", contacts)
        const socketMap = index.getSockets();
        // console.log(socketMap);
        var i;
        for (i=0; i<contacts.length; i++) {
            console.log("contact: ", contacts[i])
            const sock = socketMap.get(String(contacts[i].userId))
            if (sock !== undefined) {
                sock.send("you are infected");
                console.log("user ", contacts[i].userId, " is infected")
            }
        }
    }
}

export default { getAllContactRecords, startContactTracing }
