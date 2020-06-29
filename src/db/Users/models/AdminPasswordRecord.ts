/* eslint-disable @typescript-eslint/interface-name-prefix */
import mongoose, { Schema, Document } from "mongoose";

const AdminPasswordRecordSchema: Schema = new Schema({
    timeCreated: {
        type: Date,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    salt: {
        type: String,
        required: true
    }

})

export interface IAdminPasswordRecord extends Document {
    timeCreated: Date;
    password: String;
    salt: String;
}

export default mongoose.model<IAdminPasswordRecord>('AdminPasswordRecord', AdminPasswordRecordSchema);
