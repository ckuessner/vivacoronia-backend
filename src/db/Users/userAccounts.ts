import bcrypt from 'bcryptjs';
import AdminPasswordRecord from "./models/AdminPasswordRecord";
import UserAccountRecord, { IUserAccountRecord } from "./models/UserAccountRecord";
import { isNull } from 'util';
import mongoose from 'mongoose'

export async function createNewUserAccount(password: string): Promise<IUserAccountRecord> {
  const date = new Date().toISOString()

  const hashPassword = await bcrypt.hash(password, 10)

  return UserAccountRecord.create({
    "timeCreated": date,
    "passwordHash": hashPassword,
  }).then((record: IUserAccountRecord) => {
    return record
  })
}

export async function getAllUserAccounts(): Promise<IUserAccountRecord[]> {
  return await UserAccountRecord.find()
}

export async function getUserAccount(userId: string): Promise<IUserAccountRecord | null> {

  // check if valid ObjectId format, otherwise findOne will raise an CastError
  if (mongoose.Types.ObjectId.isValid(userId))
    return await UserAccountRecord.findOne({ _id: userId })

  return Promise.reject()
}

export async function validatePassword(userId: string, password: string): Promise<boolean> {
  const userAccount = await getUserAccount(userId)

  if (!isNull(userAccount)) {

    const checkPasswordHash: boolean = await bcrypt.compare(password.toString(), userAccount.passwordHash.toString())

    if (checkPasswordHash) {
      return true
    }
  }

  return false
}

export async function validateAdminPassword(password: string): Promise<boolean> {
  const adminPassword = await AdminPasswordRecord.findOne()

  if (isNull(adminPassword)) {
    console.log("No Admin Account exists")
    return false
  }
  else {

    const checkPassHash: boolean = await bcrypt.compare(password, adminPassword.passwordHash.toString())

    if (checkPassHash) {
      return true
    }
  }
  return false
}
