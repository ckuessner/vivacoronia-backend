import { Request, Response } from "express";
import { IUserAccountRecord } from "../db/Users/models/UserAccountRecord";
import * as userAccountDb from "../db/Users/userAccounts";
import { generateAdminJWT, generateAccessJWT } from "../validators/jsonWebTokenValidator";
import { isString } from "util";

export async function createNewUserId(req: Request, res: Response): Promise<void> {
  const body = req.body as Record<string, string>
  const password = body.password

  if (!isString(password) || password === "") {
    res.sendStatus(400)
    return
  }

  const record: IUserAccountRecord = await userAccountDb.createNewUserAccount(password)

  const json = {
    "userId": record._id as string,
    "timeCreated": record.timeCreated
  }

  console.log("Created new user account: " + String(json.userId))

  res.json(json)
}

export async function newJSONWebToken(req: Request, res: Response): Promise<void> {
  const userId = req.params.userId

  const body = req.body as Record<string, string>
  const password = body.password

  const validator: boolean = await userAccountDb.validatePassword(userId, password)

  if (validator) {

    const token = await generateAccessJWT(userId)

    const json = {
      "jwt": token
    }

    console.log("User " + userId + " gets token")
    res.json(json)
  }
  else {
    // password is not correct for user or no such userId 
    res.sendStatus(401)
  }
}

export async function newAdminToken(req: Request, res: Response): Promise<void> {
  const body = req.body as Record<string, string>
  const password = body.password

  const validator: boolean = await userAccountDb.validateAdminPassword(password)

  if (validator) {

    const token = await generateAdminJWT()

    const json = {
      "jwt": token
    }

    console.log("Admin token was granted")
    res.json(json)
  }
  else {
    // password is not correct
    res.sendStatus(401)
  }
}
