import { Router } from "express";
import * as infectionController from "./controllers/infection";
import locationsController from "./controllers/locations";
import contactController from "./controllers/contacts";
import tradingController from "./controllers/trading";
import * as userAccountsController from "./controllers/userAccounts"
import { authUser, authAdmin, checkTokenAndExtractUserId } from "./middleware/auth"

export const router = Router();

router.post('/user/', userAccountsController.createNewUserId)
router.post('/user/:userId/login/', userAccountsController.newJSONWebToken)
router.post('/admin/login/', userAccountsController.newAdminToken)

router.get('/infection/:userId/', authUser, infectionController.getInfection)
router.post('/infection/:userId/', authUser, infectionController.postInfection)

router.get('/contacts/', authAdmin, contactController.getContactRecords)

router.get('/locations/', authAdmin, locationsController.getAllLocationRecords)
router.get('/locations/:userId/', authUser, locationsController.getUserLocationRecord)
router.post('/locations/:userId/', authUser, locationsController.postLocationRecords)

router.get('/trading/offers/', tradingController.getOffers)
router.post('/trading/offers/', checkTokenAndExtractUserId, tradingController.postOffer)
router.patch('/trading/offers/:offerId/', checkTokenAndExtractUserId, tradingController.patchOffer)

router.get('/trading/categories/', tradingController.getCategories)
router.post('/trading/categories/', authAdmin, tradingController.postCategory)

router.post('/trading/product_need', tradingController.postProductNeed)
