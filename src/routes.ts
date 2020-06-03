import { Router } from "express";
import * as infectionController from "./controllers/infection";
import * as locationsController from "./controllers/locations";

export const router = Router();

router.post('/infection/:userId/', infectionController.postInfection)

router.get('/locations/', locationsController.getAllLocationRecords)
router.get('/locations/:userId/', locationsController.getUserLocationRecord)
router.post('/locations/:userId/', locationsController.postLocationRecords)