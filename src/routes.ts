import { Router } from "express";
import contactController from "./controllers/contacts";
import * as infectionController from "./controllers/infection";
import locationsController from "./controllers/locations";
import tradingController from "./controllers/trading";
import * as userAccountsController from "./controllers/userAccounts";
import { authAdmin, authUser, checkTokenAndExtractUserId } from "./middleware/auth";

export const router = Router();

router.post('/user/', userAccountsController.createNewUserId)
router.post('/user/:userId/login/', userAccountsController.newJSONWebToken)

router.get('/user/:userId/', authUser, userAccountsController.checkAdminStatus)

router.patch('/user/:userId/', authAdmin, userAccountsController.grantAdminRequest)

router.post('/admin/:userId/login/', userAccountsController.newAdminToken)

router.get('/infection/:userId/', authUser, infectionController.getInfection)
router.post('/infection/:userId/', authUser, infectionController.postInfection)

router.get('/contacts/', authAdmin, contactController.getContactRecords)

router.get('/locations/', authAdmin, locationsController.getAllLocationRecords)
router.get('/locations/:userId/', authUser, locationsController.getUserLocationRecord)
router.post('/locations/:userId/', authUser, locationsController.postLocationRecords)

// ============= Trading =============
router.get('/trading/productSearch/', tradingController.getAvailableProducts)

router.get('/trading/offers/', tradingController.getOffers)
router.post('/trading/offers/', checkTokenAndExtractUserId, tradingController.postOffer)
router.patch('/trading/offers/:offerId/', checkTokenAndExtractUserId, tradingController.patchOffer)

router.get('/trading/supermarket/', tradingController.getSupermarkets)
router.post('/trading/supermarket/', tradingController.postSupermarket)
router.get('/trading/supermarket/:supermarketId/', tradingController.getSupermarketData)
router.delete('/trading/supermarket/:supermarketId/', tradingController.deleteSupermarket)

router.post('/trading/supermarket/:supermarketId/', tradingController.postInventoryItem)
router.patch('/trading/supermarket/:supermarketId/:itemId/', tradingController.patchInventoryItem)

router.get('/trading/categories/', tradingController.getCategories)
router.post('/trading/categories/', authAdmin, tradingController.postCategory)

router.get('/trading/needs/', checkTokenAndExtractUserId, tradingController.getNeeds)
router.post('/trading/needs/', checkTokenAndExtractUserId, tradingController.postNeed)
router.patch('/trading/needs/:needId/', checkTokenAndExtractUserId, tradingController.deleteNeed)
