import * as core from "express-serve-static-core";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface AuthenticatedUserResponse<ResBody = any> extends core.Response<ResBody> {
    locals: {
        userId: string
    }
}
