/* eslint-disable @typescript-eslint/interface-name-prefix */
import mongoose, { Schema, Document } from "mongoose";

const UserAccountRecordSchema: Schema = new Schema({
  userId: {
    type: String,
    required: true
  },
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

export interface IUserAccountRecord extends Document {
  userId: String;
  timeCreated: Date;
  password: String;
  salt: String;
}

export default mongoose.model<IUserAccountRecord>('UserAccountRecord', UserAccountRecordSchema);
