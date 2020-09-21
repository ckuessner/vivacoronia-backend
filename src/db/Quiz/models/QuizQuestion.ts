import mongoose, { Document, Schema } from "mongoose";

const QuizQuestionSchema: Schema = new Schema({
    question: {
        type: String,
        required: true,
    },
    answers: {
        type: [String],
        required: true,
        validate: [(arr: string[]) => arr.length === 4, '{PATH} must have a length of 4']
    },
    correctAnswer: {
        type: String,
        required: true,
        validate: [
            correctAnswerValidator,
            "{PATH} has to be one of the answers, but {VALUE} is not"
        ]
    },
})

function correctAnswerValidator(field: string): boolean {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const doc = this as LeanQuizQuestion
    return doc.answers.includes(field)
}

export interface LeanQuizQuestion {
    question: string,
    answers: string[],
    correctAnswer: string
}

export interface QuizQuestionDocument extends Document, LeanQuizQuestion { }

const QuizQuestion = mongoose.model<QuizQuestionDocument>('QuizQuestion', QuizQuestionSchema);

export default QuizQuestion
