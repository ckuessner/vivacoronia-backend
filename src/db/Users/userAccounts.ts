import bcrypt from 'bcryptjs';
import AdminPasswordRecord, { IAdminPasswordRecord } from "./models/AdminPasswordRecord";
import UserAccountRecord, { IUserAccountRecord } from "./models/UserAccountRecord";

export async function createNewUserAccount(password: String): Promise<IUserAccountRecord> {
  var date: String = new Date().toISOString()

  const saltRounds = 10;

  const salt = await bcrypt.genSalt(saltRounds)
  const hashPassword = await bcrypt.hash(password.toString(), salt)

  return UserAccountRecord.create({
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

  if (adminPassword.length === 0) {
    const saltRounds = 10

    const password: String = "thisPasswordIsDamnStrong!!!"

    const salt = await bcrypt.genSalt(saltRounds)
    const hashPassword = await bcrypt.hash(password.toString(), salt)

    return AdminPasswordRecord.create({
      "timeCreated": new Date().toISOString(),
      "password": hashPassword,
      "salt": salt
    }).then((record: IAdminPasswordRecord) => {
      return record
    }).catch((error: Error) => {
      throw error
    });
  }

  return adminPassword[0]
}

export async function getAllUserAccounts(): Promise<IUserAccountRecord[]> {
  return UserAccountRecord.find()
}

export async function getUserAccount(userId: String): Promise<IUserAccountRecord[]> {
  return UserAccountRecord.find({ _id: userId })
}

export async function validatePassword(userId: String, password: String): Promise<boolean> {
  const userAccount: IUserAccountRecord[] = await getUserAccount(userId)

  console.log(userAccount)

  if (userAccount.length > 0) {
    const salt = userAccount[0].salt.toString()

    const hashPassword: string = await bcrypt.hash(password.toString(), salt)

    const checkPasswordHash: boolean = await bcrypt.compare(hashPassword, userAccount[0].password.toString())


    console.log("HashPass: " + hashPassword)
    console.log("CheckPass: " + userAccount[0].password)
    console.log(checkPasswordHash)

    if (checkPasswordHash) {
      return true
    }
  }

  return false
}

export async function validateAdminPassword(password: String): Promise<boolean> {
  const adminPassword: IAdminPasswordRecord[] = await AdminPasswordRecord.find()

  if (adminPassword.length === 0) {
    console.log("Setup admin Account")
    console.log(await setupAdminAccount())
  }

  // we assume that there is only one password saved in the db so we take the first one
  if (adminPassword.length > 0) {
    const salt = adminPassword[0].salt.toString()

    const hashPassword = await bcrypt.hash(password.toString(), salt)
    const checkPassHash: Boolean = await bcrypt.compare(adminPassword[0].password.toString(), hashPassword)

    if (checkPassHash) {
      return true
    }
  }
  return false
}
