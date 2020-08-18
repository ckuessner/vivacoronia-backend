import 'express'

interface Locals {
    userId?: string;
}

declare module 'express' {
    export interface Response {
        locals: Locals
    }
}
