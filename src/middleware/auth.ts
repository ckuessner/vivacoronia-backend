import { NextFunction, Request, Response } from "express";
import { validateJWT, getUserIdFromTokenWithoutValidation } from "../validators/jsonWebTokenValidator";
import { isEmpty } from "lodash";
import { hasAdminRights } from "../db/Users/userAccounts";
import WebSocket from "ws";
import notifications from "../controllers/notifications"

async function authUser(req: Request, res: Response, next: NextFunction): Promise<void> {

    if (!(typeof req.params.userId === 'string') || isEmpty(req.params.userId)) {
        res.status(400).send("Invalid userId")
        return
    }

    const userId = req.params.userId

    if (!(typeof req.headers.jwt === 'string')) {
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
        if (!(typeof (req.headers.jwt) === 'string')) throw new Error()
        userId = await getUserIdFromTokenWithoutValidation(req.headers.jwt)
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

async function checkUserIdForWebSockets(req: Request, ws: WebSocket): Promise<void> {
    if (typeof req.headers.userid !== 'string' || isEmpty(req.headers.userid)) {
        ws.close()
        return
    }

    const userId = req.headers.userid

    if (typeof req.headers.jwt !== 'string') {
        ws.close()
        return
    }
    const token: string = req.headers.jwt;

    if (!await validateJWT(token, userId, "user")) {
        // invalid token
        ws.close()
        return
    }

    // validation successfull so add user to socket map
    // if user is not added even if there is a connection nothing will be send to it
    notifications.addUserToSocketMapAfterAuthentication(userId, ws)
}

async function authAdmin(req: Request, res: Response, next: NextFunction): Promise<void> {
    // just for admin authentication
    let userId;
    try {
        if (!(typeof req.headers.adminjwt === 'string')) throw new Error()
        userId = await getUserIdFromTokenWithoutValidation(req.headers.adminjwt)
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
        res.status(403).send("No admin rights")
        return
    }

    res.locals.userId = userId

    next()
}

export { authUser, authAdmin, checkTokenAndExtractUserId, checkUserIdForWebSockets }
