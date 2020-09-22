import mongoose, { Document, Schema } from "mongoose";
import { LeanQuizQuestion } from "./QuizQuestion";

const QuizGameSchema: Schema = new Schema({
    players: [{
        type: Schema.Types.String,
    }],
    questions: [{
        type: Schema.Types.ObjectId,
        ref: 'QuizQuestion',
    }],
    answers: [{
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'UserAccountRecord',
            required: true,
        },
        questionIndex: {
            type: Schema.Types.Number,
            required: true,
            min: 0,
            validate: [Number.isInteger, '{VALUE} is not a valid {PATH}']
        },
        answer: {
            type: Schema.Types.String,
            required: true,
        },
        isCorrect: {
            type: Schema.Types.Boolean,
            required: true,
        }
    }],
    opponentInfo: {
        distance: {
            type: Schema.Types.Number,
            required: true
        }
    }
})

export interface LeanQuizGame {
    players: string[];
    questions: LeanQuizQuestion[];
    answers: LeanQuizAnswer[];
    opponentInfo: {
        distance: number
    }
}

export interface LeanQuizAnswer {
    userId: string,
    questionIndex: number,
    answer: string
    isCorrect: boolean
}

export interface QuizGameDocument extends Document, LeanQuizGame { }

const QuizGame = mongoose.model<QuizGameDocument>('QuizGame', QuizGameSchema)

export default QuizGame
