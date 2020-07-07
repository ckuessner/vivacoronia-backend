import { Request, Response } from "express";
import contactsDb from "../db/Tracking/contacts";
import { IContactRecord } from "../db/Tracking/models/ContactRecord";
import { IInfectionRecord } from "../db/Tracking/models/InfectionRecord";
import tracing from "../db/Tracking/contacts";
import notifications from "./notifications"

const TWO_WEEKS_MS = 14 * 24 * 60 * 60 * 1000

async function getContactRecords(req: Request, res: Response): Promise<void> {
    if (typeof req.query.ids === 'string') {
        const ids: number[] = req.query.ids.replace(/[^0-9,]/g, "").split(',').map(Number)
        const records: IContactRecord[] = await contactsDb.getAllContactRecordsForIDs(ids)
        res.json(records)
    }
    else {
        const records: IContactRecord[] = await contactsDb.getAllContactRecords()
        res.json(records)
    }
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
        void notifications.sendInfectedContactNotifications(contacts)
    }
}

export default { getContactRecords, startContactTracing }
