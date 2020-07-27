import * as core from "express-serve-static-core";
import { ProductOfferPatch } from '../db/trading/models/ProductOffer';
import { LeanProductCategory } from "../db/trading/models/ProductCategory";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type PatchOfferRequest<P extends core.Params = core.ParamsDictionary, ResBody = any, ReqBody = ProductOfferPatch, ReqQuery = core.Query> = core.Request<P, ResBody, ReqBody, ReqQuery>

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type PostCategoryRequest<P extends core.Params = core.ParamsDictionary, ResBody = any, ReqBody = LeanProductCategory, ReqQuery = core.Query> = core.Request<P, ResBody, ReqBody, ReqQuery>
