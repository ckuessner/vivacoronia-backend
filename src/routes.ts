import { Router } from "express";
import contactController from "./controllers/contacts";
import * as infectionController from "./controllers/infection";
import locationsController from "./controllers/locations";
import tradingController from "./controllers/trading";
import * as achievementsController from "./controllers/achievements"
import * as userAccountsController from "./controllers/userAccounts";
import { authAdmin, authUser, checkTokenAndExtractUserId } from "./middleware/auth";
import * as quizController from "./controllers/quiz";

export const router = Router();

// ============= Authentication =============
router.post('/user/', userAccountsController.createNewUserId)
router.post('/user/:userId/login/', userAccountsController.newJSONWebToken)
router.get('/user/:userId/', authUser, userAccountsController.checkAdminStatus)
router.patch('/user/:userId/', authAdmin, userAccountsController.grantAdminRequest)

router.post('/admin/:userId/login/', userAccountsController.newAdminToken)

// ============= Achievements =============
router.get('/user/:userId/achievements/', authUser, achievementsController.getAchievementsStatus)
router.get('/user/:userId/infectionScore', authUser, achievementsController.getInfectionScore)

// ============= Tracing =============
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

// ============= Quiz =============
router.post('/quiz/questions/', authAdmin, quizController.postQuizQuestions)

router.use('/quiz/game/', checkTokenAndExtractUserId)
router.post('/quiz/game/', quizController.postNewGameRequest)
router.get('/quiz/game/:gameId', quizController.getGameInfo)
router.post('/quiz/game/:gameId/answers/', quizController.postAnswer)
