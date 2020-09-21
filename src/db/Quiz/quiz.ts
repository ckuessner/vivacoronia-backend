import QuizGame, { QuizGameDocument } from "./models/QuizGame";
import QuizQuestion, { QuizQuestionDocument } from "./models/QuizQuestion";
import mongoose from 'mongoose'

export async function addQuizQuestions(questions: QuizQuestionDocument[]): Promise<QuizQuestionDocument[]> {
    return QuizQuestion.create(questions)
}

export async function createGameWithRandomQuestions(userA: string, userB: string): Promise<QuizGameDocument> {
    const questions = await QuizQuestion.aggregate([{
        $sample: { size: 4 }
    }])
    return QuizGame.create({
        players: [userA, userB],
        questions,
        answers: [],
    })
}

export async function getGame(gameId: string): Promise<QuizGameDocument | null> {
    if (!mongoose.Types.ObjectId.isValid(gameId)) {
        return Promise.reject("Invalid gameId " + gameId)
    }
    return QuizGame.findById(gameId).populate('questions')
}