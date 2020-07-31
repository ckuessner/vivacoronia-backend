/* eslint-disable @typescript-eslint/interface-name-prefix */
import mongoose, { Schema, Document } from "mongoose";

const UserAccountRecordSchema: Schema = new Schema({
  timeCreated: {
    type: Date,
    required: true
  },
  passwordHash: {
    type: String,
    required: true
  }
})

export interface IUserAccountRecord extends Document {
  timeCreated: Date;
  passwordHash: String;
}

export default mongoose.model<IUserAccountRecord>('UserAccountRecord', UserAccountRecordSchema);
