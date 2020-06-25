import { Request, Response } from "express";
import * as userAccountDb from "../db/userAccounts";
import { IUserAccountRecord } from "../db/models/UserAccountRecord";
import { generateJWT } from "../validators/jsonWebTokenValidator";

export async function createNewUserId(req: Request, res: Response): Promise<void> {
  const password: String = req.body.password

  if (password == "") {
    res.sendStatus(400).send("Invalid password")
    return
  }

  const record: IUserAccountRecord = await userAccountDb.createNewUserAccount(password)

  const json = {
    "userId": record.userId,
    "timeCreated": record.timeCreated
  }
  res.json(json)
}

export async function newJSONWebToken(req: Request, res: Response): Promise<void> {
  const userId: String = req.params.userId
  const password: String = req.body.password

  const validator: boolean = await userAccountDb.validatePassword(userId, password)

  if (validator) {

    var token: String = generateJWT(userId)

    const json = {
      "jwt": token
    }

    res.json(json)
  }
  else {
    // password is not correct for user or no such userId 
    res.sendStatus(400).send("password does not match to userId")
  }
}
