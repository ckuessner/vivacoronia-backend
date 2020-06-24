import { Router } from "express";
import * as infectionController from "./controllers/infection";
import locationsController from "./controllers/locations";
import contactController from "./controllers/contacts";

export const router = Router();

router.get('/infection/:userId/', infectionController.getInfection)
router.post('/infection/:userId/', infectionController.postInfection)

router.get('/contacts/', contactController.getAllContactRecords)

router.get('/locations/', locationsController.getAllLocationRecords)
router.get('/locations/:userId/', locationsController.getUserLocationRecord)
router.post('/locations/:userId/', locationsController.postLocationRecords)
