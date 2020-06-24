import { Request, Response } from "express";
import * as userAccountDb from "../db/userAccounts";
import { IUserAccountRecord } from "../db/models/UserAccountRecord";
import { utf8tob64, KJUR } from "jsrsasign";
import { generateJWT, validateJWT } from "../validators/jsonWebTokenValidator";

export async function createNewUserId(req: Request, res: Response): Promise<void> {
  const password: String = req.body.password

  if (password == "") {
    console.error("Invalid Password, is empty")
    res.sendStatus(400)
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
  console.log(req.body)
  const userId: String = req.params.userId
  const password: String = req.body.password

  const validator: boolean = await userAccountDb.validatePassword(userId, password)
  console.log(validator)
  if (validator) {
    // jwt expires in one week by now
    var expDate: Number = KJUR.jws.IntDate.getNow() + 7 * 24 * 60 * 60

    var header: String = utf8tob64(JSON.stringify({ "alg": "RS256", "typ": "JWT" }))
    var payload: String = utf8tob64(JSON.stringify({ "sub": userId, "iat": expDate }))

    var token: String = generateJWT(header, payload)

    res.json(token)

    // Test
    console.log(validateJWT(token, userId))
  }
  else {
    // password is not correct for user or no such userId 
    console.log("Not correct")
    res.sendStatus(400)
  }
}
