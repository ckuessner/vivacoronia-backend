/* eslint-disable @typescript-eslint/interface-name-prefix */
import mongoose, { Schema, Document } from "mongoose";

const LocationRecordSchema: Schema = new Schema({
    userId: {
        type: Number,
        required: true
    },
    location: {
        type: {
            type: String,
            enum: ['Point'],
            required: true
        },
        coordinates: {
            type: [Number],
            required: true
        }
    }
})

export interface ILocationRecord extends Document {
    userId: number;
    location: {
        type: 'Point';
        coordinates: Array<number>;
    };
}

export default mongoose.model<ILocationRecord>('LocationRecord', LocationRecordSchema);