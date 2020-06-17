import { Router } from "express";
import * as infectionController from "./controllers/infection";
import locationsController from "./controllers/locations";
import contactController from "./controllers/contacts";
import tradingController from "./controllers/trading";
import * as userAccountsController from "./controllers/userAccounts"


export const router = Router();

router.post('/createUserId/', userAccountsController.createNewUserId)
router.post('/newJSONWebToken/:userId/', userAccountsController.newJSONWebToken)

router.get('/infection/:userId/', infectionController.getInfection)
router.post('/infection/:userId/', infectionController.postInfection)

router.get('/contacts/', contactController.getContactRecords)

router.get('/locations/', locationsController.getAllLocationRecords)
router.get('/locations/:userId/', locationsController.getUserLocationRecord)
router.post('/locations/:userId/', locationsController.postLocationRecords)

router.get('/trading/offers/', tradingController.getOffers)
router.post('/trading/offers/', tradingController.postOffer)
router.patch('/trading/offers/:offerId/', tradingController.patchOffer)

router.get('/trading/categories/', tradingController.getCategories)
router.post('/trading/categories/', tradingController.postCategory)
