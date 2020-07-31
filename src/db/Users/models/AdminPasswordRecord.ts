import mongoose, { Schema, Document } from "mongoose";

const AdminPasswordRecordSchema: Schema = new Schema({
    timeCreated: {
        type: Date,
        required: true
    },
    passwordHash: {
        type: String,
        required: true
    }

})

export interface IAdminPasswordRecord extends Document {
    timeCreated: Date;
    passwordHash: string;
}

export default mongoose.model<IAdminPasswordRecord>('AdminPasswordRecord', AdminPasswordRecordSchema);
