import { Router } from "express";
import * as locationsController from "./controllers/locations";

export const router = Router();

router.get('/locations/', locationsController.getAllLocationRecords)
router.get('/locations/:userId/', locationsController.getUserLocationRecord)
router.post('/locations/:userId/', locationsController.postLocationRecords)