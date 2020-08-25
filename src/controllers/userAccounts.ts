import { Request, Response } from "express";
import { IUserAccountRecord, UserAccountPatch } from "../db/Users/models/UserAccountRecord";
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

  let valid: boolean;
  try {
    valid = await userAccountDb.validatePassword(userId, password)
  } catch (err) {
    console.error("Could not create jwt for user", userId, err)
    res.sendStatus(401)
    return
  }

  if (valid) {
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
  const userId = req.params.userId
  const body = req.body as Record<string, string>
  const password = body.password

  if (!isString(password) || password === "") {
    res.sendStatus(400)
    return
  }

  let validator: boolean

  try {
    validator = await userAccountDb.validatePassword(userId, password)
  }
  catch (e) {
    res.statusMessage = `Invalid userId`
    res.sendStatus(400)
    return
  }

  if (!validator) {
    // incorrect password
    res.sendStatus(401)
    return
  }

  validator = await userAccountDb.hasAdminRights(userId)

  if (validator) {

    const token = await generateAdminJWT(userId)

    const json = {
      "jwt": token
    }

    console.log("Admin token was granted to user " + userId)
    res.json(json)
  }
  else {
    // no admin rights
    res.sendStatus(401)
  }
}

export async function checkAdminStatus(req: Request, res: Response): Promise<void> {
  const userId = req.params.userId

  try {
    const validator: boolean = await userAccountDb.hasAdminRights(userId)

    res.json({ "isAdmin": validator })
  }
  catch (e) {
    res.statusMessage = `Invalid userId`
    res.sendStatus(400)
  }
}

export async function grantAdminRequest(req: Request, res: Response): Promise<void> {
  const userId = res.locals.userId

  if (userId == undefined) {
    res.sendStatus(500)
    return
  }

  try {
    const validator: boolean = await userAccountDb.isRootAdmin(userId)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const body = req.body as Record<string, any>

    if (validator) {
      const patch = {
        _id: body._id as string,
        isAdmin: body.isAdmin as boolean
      } as UserAccountPatch

      // patch user from body
      const updatedAccount = await userAccountDb.updateUserAccount(patch)

      if (updatedAccount === null) throw new Error()

      console.log(String(updatedAccount?._id) + " has now admin status " + String(updatedAccount?.isAdmin))

      res.sendStatus(201)
    }
    else {
      // requester does not have root permissions
      res.sendStatus(401)
    }
  } catch (e) {
    res.statusMessage = `Cannot update user Account because of invalid arguments.`
    res.sendStatus(400)
  }
}
