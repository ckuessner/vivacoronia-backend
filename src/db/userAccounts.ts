import UserAccountRecord, { IUserAccountRecord } from "./models/UserAccountRecord";
import AdminPasswordRecord, { IAdminPasswordRecord } from "./models/AdminPasswordRecord";

export async function createNewUserAccount(password: String): Promise<IUserAccountRecord> {
  do {
    var date: String = new Date().toISOString()
    var salt: String = Math.random().toString(36).substr(2, 4)

    var randomStuff = Math.random().toString(36)
    var userId: String = (randomStuff.substr(2, 5) + Date.now().toString(36) + randomStuff.substr(5, 9))

    var hashPassword: String = hashString(password, salt)
  } while ((await getUserAccount(userId)).length > 0);

  return UserAccountRecord.create({
    "userId": userId,
    "timeCreated": date,
    "password": hashPassword,
    "salt": salt
  }).then((record: IUserAccountRecord) => {
    return record
  }).catch((error: Error) => {
    throw error
  });
}

export async function setupAdminAccount(): Promise<IAdminPasswordRecord> {
  const adminPassword: IAdminPasswordRecord[] = await AdminPasswordRecord.find()

  if (adminPassword.length == 0) {
    const salt: String = "thisIsMySalt"
    const password: String = hashString("thisPasswordIsDamnStrong!!!", salt)

    return AdminPasswordRecord.create({
      "timeCreated": new Date().toISOString(),
      "password": password,
      "salt": salt
    }).then((record: IAdminPasswordRecord) => {
      return record
    }).catch((error: Error) => {
      throw error
    });
  }

  return adminPassword[0]
}

export function hashString(str: String, salt: String): String {
  const crypto = require('crypto')
  const hash = crypto.createHash('sha256')

  hash.update(str.concat(salt.toString()))

  const hashStr: String = hash.digest('hex')

  return hashStr
}

export async function getAllUserAccounts(): Promise<IUserAccountRecord[]> {
  return UserAccountRecord.find()
}

export async function getUserAccount(userId: String): Promise<IUserAccountRecord[]> {
  return UserAccountRecord.find({ userId: userId })
}

export async function validatePassword(userId: String, password: String): Promise<boolean> {
  const userAccount: IUserAccountRecord[] = await getUserAccount(userId)

  if (userAccount.length > 0) {
    var salt: String = userAccount[0].salt

    var checkPassHash: String = hashString(password, salt)

    if (checkPassHash == userAccount[0].password) {
      return true
    }
  }

  return false
}

export async function validateAdminPassword(password: String): Promise<boolean> {
  const adminPassword: IAdminPasswordRecord[] = await AdminPasswordRecord.find()

  if (adminPassword.length == 0) {
    console.log("Setup admin Account")
    console.log(await setupAdminAccount())
  }

  // we assume that there is only one password saved in the db so we take the first one
  if (adminPassword.length > 0) {
    var salt: String = adminPassword[0].salt

    var checkPassHash: String = hashString(password, salt)

    if (checkPassHash == adminPassword[0].password) {
      return true
    }
  }
  return false
}
