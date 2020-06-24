import UserAccountRecord, { IUserAccountRecord } from "./models/UserAccountRecord";

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

function hashString(str: String, salt: String): String {
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
