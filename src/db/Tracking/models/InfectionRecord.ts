import mongoose, { Document, Schema } from "mongoose";

const InfectionRecordSchema: Schema = new Schema({
    userId: {
        type: String,
        required: true
    },
    newStatus: {
        type: String,
        enum: ["infected", "recovered"],
        required: true
    },
    dateOfTest: {
        type: Date,
        required: true
    },
    occuredDateEstimation: {
        type: Date,
    }
})

export interface IInfectionRecord extends Document {
    userId: string;
    newStatus: "infected" | "recovered";
    dateOfTest: Date;
    occuredDateEstimation?: Date;
}

export default mongoose.model<IInfectionRecord>('InfectionRecord', InfectionRecordSchema);
