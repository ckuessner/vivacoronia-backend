import { Request, Response } from "express";
import * as userAccountDb from "../db/userAccounts";
import { IUserAccountRecord } from "../db/models/UserAccountRecord";

export async function createNewUserId(req: Request, res: Response): Promise<void> {
  const password: String = req.body.password

  console.log(req.body)

  if (password == "") {
    console.error("Invalid Password, is empty")
    res.sendStatus(200)
    return
  }

  const record: IUserAccountRecord = await userAccountDb.createNewUserAccount(password)
  /*TODO only send the userId and date to user*/
  const json = {
    "userId": record.userId,
    "timeCreated": record.timeCreated
  }
  res.json(json)
}
