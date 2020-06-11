import UserAccountRecord, {IUserAccountRecord} from "./models/UserAccountRecord";

export async function createNewUserAccount(password: String): Promise<IUserAccountRecord> {
  const date: String = new Date().toISOString()
  const salt: String = Math.random().toString(36).substr(2, 4)

  var randomStuff = Math.random().toString(36)
  const userId: String = (randomStuff.substr(2, 5) + Date.now().toString(36) + randomStuff.substr(5, 9))

  const crypto = require('crypto')
  const hash = crypto.createHash('sha256')

  hash.update(password.concat(salt.toString()))

  const hashPassword:String = hash.digest('hex')

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
