import { NextFunction, Request, Response } from "express";
import { isString } from "util";
import { validateJWT, getUserIdFromToken } from "../validators/jsonWebTokenValidator";
import { isEmpty } from "lodash";


async function authUser(req: Request, res: Response, next: NextFunction): Promise<void> {

    if (!isString(req.params.userId) || isEmpty(req.params.userId)) {
        res.status(400).send("Invalid userId")
        return
    }

    const userId: string = req.params.userId

    if (!isString(req.headers.jwt)) {
        res.status(400).send("Invalid format or missing JWT")
        return
    }
    const token: string = req.headers.jwt;

    if (!await validateJWT(token, userId)) {
        // invalid token
        res.status(401).send("Invalid JWT or user does not exist")
        return
    }

    next()
}

async function checkTokenAndExtractUserId(req: Request, res: Response, next: NextFunction): Promise<void> {
    // checks if a jwt is provided and 
    if (!isString(req.headers.jwt)) {
        res.status(400).send("Invalid format or missing JWT")
        return
    }

    await getUserIdFromToken(req.headers.jwt).then(value => {
        // Use userId from token and validate token that is has not expired
        // userId is set to params for further use for example to check against body
        req.params.userId = value

        void authUser(req, res, next)
        return

    }).catch(() => {
        res.status(400).send("Invalid format or missing JWT")
        return
    })
}

async function authAdmin(req: Request, res: Response, next: NextFunction): Promise<void> {
    if (!isString(req.headers.adminjwt)) {
        res.status(400).send("Invalid format or missing JWT")
        return
    }

    const token: string = req.headers.adminjwt;

    if (!await validateJWT(token, "admin")) {
        // invalid token
        res.status(401).send("Invalid JWT")
        return
    }

    next()
}

export { authUser, checkTokenAndExtractUserId, authAdmin }
