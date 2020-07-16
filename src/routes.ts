import { Router } from "express";
import * as infectionController from "./controllers/infection";
import locationsController from "./controllers/locations";
import contactController from "./controllers/contacts";
import tradingController from "./controllers/trading";

export const router = Router();

router.get('/infection/:userId/', infectionController.getInfection)
router.post('/infection/:userId/', infectionController.postInfection)

router.get('/contacts/', contactController.getAllContactRecords)

router.get('/locations/', locationsController.getAllLocationRecords)
router.get('/locations/:userId/', locationsController.getUserLocationRecord)
router.post('/locations/:userId/', locationsController.postLocationRecords)

router.get('/trading/offers/', tradingController.getOffers)
router.post('/trading/offers/', tradingController.postOffer)
router.put('/trading/offers/:offerId/', tradingController.putOffer)
router.delete('/trading/offers/:offerId/', tradingController.deleteOffer)

router.get('/trading/categories/', tradingController.getCategories)
router.post('/trading/categories/', tradingController.postCategory)
