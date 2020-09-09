import bcrypt from 'bcryptjs';
import UserAccountRecord, { IUserAccountRecord, UserAccountPatch } from "./models/UserAccountRecord";
import { isNull } from 'util';
import mongoose from 'mongoose'
import sanitize from "mongo-sanitize";
import { createAchievementsForNewUser } from '../achievements/achievements';

export async function createNewUserAccount(password: string): Promise<IUserAccountRecord> {
  const date = new Date().toISOString()

  const hashPassword = await bcrypt.hash(password, 10)

  const newUser = await UserAccountRecord.create({
    "timeCreated": date,
    "passwordHash": hashPassword,
    "isAdmin": false,
    "isRootAdmin": false,
  })

  await createAchievementsForNewUser(newUser._id)

  return newUser
}

export async function updateUserAccount(userId: string, patch: UserAccountPatch): Promise<IUserAccountRecord> {
  if (mongoose.Types.ObjectId.isValid(userId)) {
    const patchObject = sanitize(patch)
    const document = await UserAccountRecord.findOneAndUpdate({ _id: userId }, patchObject, { new: true, runValidators: true })

    if (isNull(document)) {
      return Promise.reject('Could not update user')
    }

    return document
  }

  return Promise.reject("Invalid userId")
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

export async function getRootAdminUserId(): Promise<string> {
  const ret = await UserAccountRecord.findOne({ isRootAdmin: true })

  if (ret !== null) {
    return ret._id as string
  }

  return Promise.reject("Cannot get root user id")
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

export async function setupRootAdminAccount(plainTextPassword: string): Promise<IUserAccountRecord> {
  const rootAdmin = await UserAccountRecord.findOne({ isRootAdmin: true })

  if (isNull(rootAdmin)) {
    const passwordHash = await bcrypt.hash(plainTextPassword, 10)

    return await UserAccountRecord.create({
      "timeCreated": new Date().toISOString(),
      "passwordHash": passwordHash,
      "isAdmin": true,
      "isRootAdmin": true
    })
  } else if (!await bcrypt.compare(plainTextPassword, rootAdmin.passwordHash)) {
    const passwordHash = await bcrypt.hash(plainTextPassword, 10)
    rootAdmin.passwordHash = passwordHash
    await rootAdmin.save()
  }

  return rootAdmin
}
