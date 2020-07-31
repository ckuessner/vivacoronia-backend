import { NextFunction, Request, Response } from "express";
import { isString } from "util";
import { validateJWT } from "../validators/jsonWebTokenValidator";
import { isEmpty } from "lodash";
import { AuthenticatedUserResponse } from "../types/auth";

async function authUser(req: Request, res: AuthenticatedUserResponse, next: NextFunction): Promise<void> {

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

    res.locals.userId = userId
    next()
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

export { authUser, authAdmin }
