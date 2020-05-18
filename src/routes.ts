import { Router } from "express";
import * as locationsController from "./controllers/locations";

export const router = Router();

router.get('/locations/:userId/', locationsController.getUserLocationData)
router.post('/locations/:userId/', locationsController.postLocationData)