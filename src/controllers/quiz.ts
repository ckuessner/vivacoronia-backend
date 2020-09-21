import { Request, Response } from "express";
import { LeanQuizAnswer, QuizGameDocument } from "../db/Quiz/models/QuizGame";
import * as quizDb from "../db/Quiz/quiz";
import * as locationsDb from "../db/Tracking/locations"
import { checkCoordinatePair } from "../validators/coordinates";
import notifications from "./notifications";
import { countBy, filter } from "lodash"

export async function postQuizQuestions(req: Request, res: Response): Promise<void> {
    if (!Array.isArray(req.body)) {
        res.status(400).send("body has to be an array")
        return
    } else {
        try {
            await quizDb.addQuizQuestions(req.body)
            res.sendStatus(201)
        } catch (error) {
            console.error("Couldn't create QuizQuestions for body ", req.body, error)
            res.status(400).send("request body didn't contain well formatted QuizQuestions")
        }
    }
}

type GameRequestBody = { location: [number, number] }
export async function postNewGameRequest(req: Request<never, never, GameRequestBody>, res: Response): Promise<void> {
    if (!Array.isArray(req.body.location) || !checkCoordinatePair(req.body.location)) {
        res.status(400).send('Invalid location')
        return
    }

    const playerA = res.locals.userId || ""
    const userLocation = req.body.location
    const online = notifications.getConnectedUsers().filter((user) => user !== playerA)
    const opponentInfo = await locationsDb.getClosestUser(online, userLocation)

    if (opponentInfo == null) {
        res.status(404).send("Could not find another user online")
        return
    }

    const game = await quizDb.createGameWithRandomQuestions(playerA, opponentInfo.userId)
    res.status(201).json({
        game,
        opponentInfo
    })

    await notifications.sendQuizGameRequest(
        opponentInfo.userId,
        game._id,
        playerA,
        opponentInfo.distance)
}

export async function getGameInfo(req: Request, res: Response): Promise<void> {
    const userId = res.locals.userId || ""
    let game;
    try {
        game = await quizDb.getGame(req.params.gameId)
    } catch (error) {
        res.status(400).send(error)
        console.trace(error)
        return
    }
    if (game === null || !game.players.includes(userId)) {
        res.sendStatus(404)
    } else {
        res.json(game)
    }
}

type PostAnswerBody = { userId: string, gameId: string, answer: string, questionIndex: number }
export async function postAnswer(req: Request<never, never, PostAnswerBody>, res: Response): Promise<void> {
    const userId = res.locals.userId
    const gameId = req.body.gameId || ""

    const answerObject = {
        userId,
        answer: req.body.answer,
        questionIndex: req.body.questionIndex
    }

    if (!(gameId && userId && answerObject.answer &&
        answerObject.questionIndex >= 0 && answerObject.questionIndex <= 4)) {

        res.status(400).send("Invalid answer")
        return
    }

    const game = await quizDb.getGame(gameId)
    if (game == null || !game.players.includes(userId)) {
        res.sendStatus(404)
        return
    }

    // Check if it's the users turn
    // The user that initiated the game has to wait for the other player to answer the first question,
    // therefore the first player is at index 1 (not 0)
    if ((game.answers.length + 1) % game.players.length !== game.players.indexOf(userId)) {
        res.status(400).send("It's not your turn, wait for the other player to answer a question")
        return
    }

    // Check if the answer is for the next question
    const expectedQuestionIndex = Math.floor(game.answers.length / 2)
    if (expectedQuestionIndex !== answerObject.questionIndex) {
        res.status(400).send(
            `The questionIndex ${answerObject.questionIndex} is incorrect. It should be ${expectedQuestionIndex}`
        )
        return
    }

    // Check if the answer is correct
    const isCorrect = answerObject.answer === game.questions[expectedQuestionIndex].correctAnswer;
    (answerObject as LeanQuizAnswer).isCorrect = isCorrect

    // Add the answer to the answers array of the document
    game.answers.push(answerObject as LeanQuizAnswer)

    try {
        await game.save()
        res.sendStatus(201)
    } catch (error) {
        console.error(error)
        res.sendStatus(400)
    }

    // Notify other user that the other player has answered another question
    const otherPlayersUserId = game.players.find(userId => userId !== userId)
    if (!otherPlayersUserId) {
        console.error("Other player could not be notified ", game)
        return
    }

    // Dispatch notifications
    if (game.answers.length == game.players.length * game.questions.length) {
        sendGameOverNotification(game)
    } else {
        void notifications.sendQuizGameYourTurn(otherPlayersUserId, gameId)
    }
}

function sendGameOverNotification(game: QuizGameDocument) {
    const counts = countBy(filter(game.answers, a => a.isCorrect), 'userId')
    const countP1 = counts[game.players[0]]
    const countP2 = counts[game.players[1]]

    if (countP1 === countP2) {
        void notifications.sendQuizGameDraw(game._id, game.players[0], game.players[1])
    } else if (countP1 <= countP2) {
        void notifications.sendQuizGameOver(game._id, game.players[0], game.players[1])
    } else {
        void notifications.sendQuizGameOver(game._id, game.players[1], game.players[0])
    }
}
