import mongoose, { Schema, Document } from "mongoose";

const ContactRecordSchema: Schema = new Schema({
    userId: {
        type: String,
        required: true
    },
    infectedUserId: {
        type: String,
        required: true
    },
    locationRecord: {
        type: Schema.Types.ObjectId,
        ref: 'LocationRecord',
        required: true
    },
})
// Make sure that the infected person doesn't create two ContactRecords using the same
// LocationRecord of the user that came in contact with the infected person.
ContactRecordSchema.index({ infectedUserId: 1, locationRecord: 1 }, { unique: true })

export interface IContactRecord extends Document {
    userId: string;
    infectedUserId: string;
    /**
     * The locationRecord of the person that comes in contact with the infected person.
     */
    locationRecord: Schema.Types.ObjectId;
}

export default mongoose.model<IContactRecord>('ContactRecord', ContactRecordSchema);
