import { NextFunction, Request, Response } from "express";
import { isString } from "util";
import { validateJWT } from "../validators/jsonWebTokenValidator";


async function authUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    const userId = req.params.userId

    if (!isString(req.headers.jwt)) {
        console.error("Invalid JWT format")
        res.sendStatus(400)
        return
    }
    const token: string = req.headers.jwt;

    if (!validateJWT(token, userId)) {
        // invalid token
        console.error("Invalid JWT or user does not exist")
        res.sendStatus(401)
        return
    }

    next()
}

async function authAdmin(req: Request, res: Response, next: NextFunction): Promise<void> {
    if (!isString(req.headers.adminjwt)) {
        console.error("Invalid JWT format")
        res.sendStatus(400)
        return
    }
    const token: string = req.headers.adminjwt;

    if (!validateJWT(token, "admin")) {
        // invalid token
        console.error("Invalid JWT")
        res.sendStatus(401)
        return
    }

    next()
}

export { authUser, authAdmin }
