import { Request, Response } from "express";
import { IUserAccountRecord } from "../db/Users/models/UserAccountRecord";
import * as userAccountDb from "../db/Users/userAccounts";
import { generateAdminJWT, generateAccessJWT } from "../validators/jsonWebTokenValidator";
import { isString } from "util";

export async function createNewUserId(req: Request, res: Response): Promise<void> {
  const body = req.body as Record<string, string>
  const password = body.password

  if (!isString(password) || password === "") {
    console.error("Invalid password")
    res.sendStatus(400)
    return
  }

  const record: IUserAccountRecord = await userAccountDb.createNewUserAccount(password)

  console.log(record)

  const json = {
    "userId": record._id as string,
    "timeCreated": record.timeCreated
  }
  res.json(json)
}

export async function newJSONWebToken(req: Request, res: Response): Promise<void> {
  const userId = req.params.userId

  const body = req.body as Record<string, string>
  const password = body.password

  const validator: boolean = await userAccountDb.validatePassword(userId, password)

  if (validator) {

    const token = generateAccessJWT(userId)

    const json = {
      "jwt": token
    }

    res.json(json)
  }
  else {
    // password is not correct for user or no such userId 
    console.error("No such userId or incorrect password")
    res.sendStatus(401)
  }
}

export async function newAdminToken(req: Request, res: Response): Promise<void> {
  const body = req.body as Record<string, string>
  const password = body.password

  const validator: boolean = await userAccountDb.validateAdminPassword(password)

  if (validator) {

    const token = generateAdminJWT()

    const json = {
      "jwt": token
    }

    res.json(json)
  }
  else {
    // password is not correct
    console.error("incorrect password")
    res.sendStatus(401)
  }
}
