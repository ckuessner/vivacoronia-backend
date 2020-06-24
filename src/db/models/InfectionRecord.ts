/* eslint-disable @typescript-eslint/interface-name-prefix */
import mongoose, { Document, Schema } from "mongoose";

const InfectionRecordSchema: Schema = new Schema({
    userId: {
        type: Number,
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
    userId: number;
    newStatus: "infected" | "recovered";
    dateOfTest: Date;
    occuredDateEstimation?: Date;
}

export default mongoose.model<IInfectionRecord>('InfectionRecord', InfectionRecordSchema);
