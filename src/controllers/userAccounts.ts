import { Request, Response } from "express";
import { IUserAccountRecord } from "../db/Users/models/UserAccountRecord";
import * as userAccountDb from "../db/Users/userAccounts";
import { generateAdminJWT, generateJWT } from "../validators/jsonWebTokenValidator";
import { isString } from "util";

export async function createNewUserId(req: Request, res: Response): Promise<void> {
  const password = req.body.password

  if (!isString(password) || password === "") {
    console.error("Invalid password")
    res.sendStatus(400)
    return
  }

  const record: IUserAccountRecord = await userAccountDb.createNewUserAccount(password)

  console.log(record)

  const json = {
    "userId": record._id,
    "timeCreated": record.timeCreated
  }
  res.json(json)
}

export async function newJSONWebToken(req: Request, res: Response): Promise<void> {
  const userId: String = req.params.userId
  const password: String = req.body.password

  const validator: boolean = await userAccountDb.validatePassword(userId, password)

  if (validator) {

    const token: String = generateJWT(userId)

    const json = {
      "jwt": token
    }

    res.json(json)
  }
  else {
    // password is not correct for user or no such userId 
    console.error("No such userId or incorrect password")
    res.sendStatus(400)
  }
}

export async function newAdminToken(req: Request, res: Response): Promise<void> {
  const password: String = req.body.password

  const validator: boolean = await userAccountDb.validateAdminPassword(password)

  if (validator) {

    const token: String = generateAdminJWT()

    const json = {
      "jwt": token
    }

    res.json(json)
  }
  else {
    // password is not correct
    console.error("incorrect password")
    res.sendStatus(400)
  }
}
