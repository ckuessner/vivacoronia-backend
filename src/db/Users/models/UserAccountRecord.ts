import mongoose, { Schema, Document } from "mongoose";

const UserAccountRecordSchema: Schema = new Schema({
  timeCreated: {
    type: Date,
    required: true
  },
  passwordHash: {
    type: String,
    required: true
  },
  isAdmin: {
    type: Boolean,
    required: true
  },
  isRootAdmin: {
    type: Boolean,
    required: true
  }
})

export interface LeanUserAccount {
  timeCreated: Date;
  passwordHash: string;
  isAdmin: boolean;
  isRootAdmin: boolean;
}

export interface IUserAccountRecord extends Document, LeanUserAccount { }

export interface UserAccountPatch {
  isAdmin: boolean;
}

export default mongoose.model<IUserAccountRecord>('UserAccountRecord', UserAccountRecordSchema);
