import { Router } from "express";
import * as infectionController from "./controllers/infection";
import locationsController from "./controllers/locations";
import contactController from "./controllers/contacts";
import tradingController from "./controllers/trading";
import * as userAccountsController from "./controllers/userAccounts"
import { authUser, authAdmin } from "./middleware/auth"

export const router = Router();

router.post('/user/', userAccountsController.createNewUserId)
router.post('/userJWT/:userId/', userAccountsController.newJSONWebToken)
router.post('/adminJWT/', userAccountsController.newAdminToken)

router.get('/infection/:userId/', authUser, infectionController.getInfection)
router.post('/infection/:userId/', authUser, infectionController.postInfection)

router.get('/contacts/', authAdmin, contactController.getContactRecords)

router.get('/locations/', authAdmin, locationsController.getAllLocationRecords)
router.get('/locations/:userId/', authUser, locationsController.getUserLocationRecord)
router.post('/locations/:userId/', authUser, locationsController.postLocationRecords)

router.get('/trading/offers/', tradingController.getOffers)
router.post('/trading/offers/', authUser, tradingController.postOffer)
router.patch('/trading/offers/:offerId/', authUser, tradingController.patchOffer)

router.get('/trading/categories/', tradingController.getCategories)
router.post('/trading/categories/', authAdmin, tradingController.postCategory)
