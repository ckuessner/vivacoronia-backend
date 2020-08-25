import { NextFunction, Request, Response } from "express";
import { isString } from "util";
import { validateJWT, getUserIdFromToken } from "../validators/jsonWebTokenValidator";
import { isEmpty } from "lodash";
import { hasAdminRights } from "../db/Users/userAccounts";

async function authUser(req: Request, res: Response, next: NextFunction): Promise<void> {

    if (!isString(req.params.userId) || isEmpty(req.params.userId)) {
        res.status(400).send("Invalid userId")
        return
    }
        
    const userId = req.params.userId
    
    if (!isString(req.headers.jwt)) {
        res.status(400).send("Invalid format or missing JWT")
        return
    }
    const token: string = req.headers.jwt;

    if (!await validateJWT(token, userId, "user")) {
        // invalid token
        res.status(401).send("Invalid JWT or user does not exist")
        return
    }

    res.locals.userId = userId

    next()
}

async function checkTokenAndExtractUserId(req: Request, res: Response, next: NextFunction): Promise<void> {
    // just for user authentication
    let userId;
    try {
        if (!isString(req.headers.jwt)) throw new Error()
        userId = await getUserIdFromToken(req.headers.jwt)
    } catch (err) {
        res.status(400).send("Invalid format or missing JWT")
        return
    }
    const token: string = req.headers.jwt;

    if (!await validateJWT(token, userId, "user")) {
        // invalid token
        res.status(401).send("Invalid JWT or user does not exist")
        return
    }

    res.locals.userId = userId

    next()
}

async function authAdmin(req: Request, res: Response, next: NextFunction): Promise<void> {
    // just for admin authentication
    let userId;
    try {
        if (!isString(req.headers.adminjwt)) throw new Error()
        userId = await getUserIdFromToken(req.headers.adminjwt)
    } catch (err) {
        res.status(400).send("Invalid format or missing JWT")
        return
    }

    const token: string = req.headers.adminjwt;

    if (!await validateJWT(token, userId, "admin")) {
        // invalid token
        res.status(401).send("Invalid JWT")
        return
    }

    if (!await hasAdminRights(userId)) {
        res.status(401).send("No admin rights")
        return
    }

    res.locals.userId = userId

    next()
}

export { authUser, authAdmin, checkTokenAndExtractUserId }
