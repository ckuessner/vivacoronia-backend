import bcrypt from 'bcryptjs';
import UserAccountRecord, { IUserAccountRecord, UserAccountPatch } from "./models/UserAccountRecord";
import { isNull } from 'util';
import mongoose from 'mongoose'
import sanitize from "mongo-sanitize";

export async function createNewUserAccount(password: string): Promise<IUserAccountRecord> {
  const date = new Date().toISOString()

  const hashPassword = await bcrypt.hash(password, 10)

  return UserAccountRecord.create({
    "timeCreated": date,
    "passwordHash": hashPassword,
    "isAdmin": false,
    "isRootAdmin": false,
  }).then((record: IUserAccountRecord) => {
    return record
  })
}

export async function updateUserAccount(patch: UserAccountPatch): Promise<IUserAccountRecord> {
  const { _id, isAdmin } = sanitize(patch)
  const ret = await UserAccountRecord.findOneAndUpdate({ _id: _id }, { isAdmin: isAdmin }, { new: true, runValidators: true })

  if (isNull(ret)) {
    return Promise.reject('Could not update user')
  }

  return ret
}

export async function getAllUserAccounts(): Promise<IUserAccountRecord[]> {
  return await UserAccountRecord.find()
}

export async function hasAdminRights(userId: string): Promise<boolean> {
  if (mongoose.Types.ObjectId.isValid(userId)) {
    return await UserAccountRecord.exists({ _id: userId, isAdmin: true })
  }

  return Promise.reject("Invalid userId")
}

export async function isRootAdmin(userId: string): Promise<boolean> {
  if (mongoose.Types.ObjectId.isValid(userId)) {
    return await UserAccountRecord.exists({ _id: userId, isRootAdmin: true })
  }

  return Promise.reject("Invalid userId")
}

export async function getUserAccount(userId: string): Promise<IUserAccountRecord | null> {

  // check if valid ObjectId format, otherwise findOne will raise an CastError
  if (mongoose.Types.ObjectId.isValid(userId)) {
    return await UserAccountRecord.findOne({ _id: userId })
  }

  return Promise.reject("Invalid userId")
}

export async function validatePassword(userId: string, password: string): Promise<boolean> {
  const userAccount = await getUserAccount(userId)

  if (!isNull(userAccount)) {

    const checkPasswordHash: boolean = await bcrypt.compare(password, userAccount.passwordHash)

    if (checkPasswordHash) {
      return true
    }
  }

  return false
}
