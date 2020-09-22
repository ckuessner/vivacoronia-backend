import { Request, Response } from "express";
import { countBy, filter } from "lodash";
import { updateQuizmaster } from "../db/achievements/achievements";
import { LeanQuizAnswer, QuizGameDocument } from "../db/Quiz/models/QuizGame";
import * as quizDb from "../db/Quiz/quiz";
import * as locationsDb from "../db/Tracking/locations";
import { checkCoordinatePair } from "../validators/coordinates";
import notifications from "./notifications";

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
    const opponentInfo = await locationsDb.getRandomUserWithDistance(online, userLocation)

    if (opponentInfo == null) {
        res.status(404).send("Could not find another user online")
        return
    }

    const game = await quizDb.createGameWithRandomQuestions(playerA, opponentInfo.userId, opponentInfo.distance)
    const gameJson = JSON.stringify({ game: game },
        (key, value) =>
            // eslint-disable-next-line @typescript-eslint/no-unsafe-return
            key === 'opponentInfo' ? { userId: opponentInfo.userId, distance: opponentInfo.distance } : value
    )
    res.status(201).contentType('application/json').send(gameJson)

    await notifications.sendQuizGameRequest(
        opponentInfo.userId,
        game._id,
        playerA,
        opponentInfo.distance)
}

export async function getGameInfo(req: Request, res: Response): Promise<void> {
    const userId = res.locals.userId || ""
    let game: QuizGameDocument | null;
    try {
        game = await quizDb.getGame(req.params.gameId)
    } catch (error) {
        res.status(400).send(error)
        console.trace(error)
        return
    }
    if (game == null || !game.players.includes(userId)) {
        res.sendStatus(404)
    } else {
        const otherPlayer = game.players[0] === userId ? game.players[1] : game.players[0]
        // The userId of the opponent is not stored in the Database, as it depends on which user sends the request
        const gameJson = JSON.stringify(game,
            (key, value) =>
                // eslint-disable-next-line @typescript-eslint/no-unsafe-return
                key === 'opponentInfo' ? { userId: otherPlayer, distance: game?.opponentInfo.distance } : value
        )
        res.status(200).contentType('application/json').send(gameJson)
    }
}

type PostAnswerBody = { userId: string, answer: string, questionIndex: number }
export async function postAnswer(req: Request<{ gameId: string }, never, PostAnswerBody>, res: Response): Promise<void> {
    const userId = res.locals.userId
    const gameId = req.params.gameId

    const answerObject = {
        userId,
        answer: req.body.answer,
        questionIndex: +req.body.questionIndex
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
    // The user that initiated the game is the first player and is the first player to answer a question
    if (game.answers.length % game.players.length !== game.players.indexOf(userId)) {
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
    const otherPlayersUserId = game.players.find(uId => uId !== userId)
    if (!otherPlayersUserId) {
        console.error("Other player could not be notified ", game)
        return
    }

    // Dispatch notifications and update quizmaster achievement
    if (game.answers.length == game.players.length * game.questions.length) {
        handleGameOver(game)
    } else {
        void notifications.sendQuizGameYourTurn(otherPlayersUserId, gameId)
    }
}

function handleGameOver(game: QuizGameDocument) {
    const counts = countBy(filter(game.answers, a => a.isCorrect), 'userId')
    const countP1 = counts[game.players[0]]
    const countP2 = counts[game.players[1]]

    if (countP1 === countP2) {
        void notifications.sendQuizGameDraw(game._id, game.players[0], game.players[1])
    } else if (countP1 > countP2) {
        void notifications.sendQuizGameOver(game._id, game.players[0], game.players[1])
        void updateQuizmaster(game.players[0])
    } else {
        void notifications.sendQuizGameOver(game._id, game.players[1], game.players[0])
        void updateQuizmaster(game.players[0])
    }
}
