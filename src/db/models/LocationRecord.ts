/* eslint-disable @typescript-eslint/interface-name-prefix */
import mongoose, { Schema, Document } from "mongoose";

const LocationRecordSchema: Schema = new Schema({
    userId: {
        type: Number,
        required: true
    },
    time: {
        type: Date,
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
            required: true,
            validate: {
                validator: function (v: Array<number>): boolean {
                    return v.length == 2
                }
            }
        }
    }
})

export interface ILocationRecord extends Document {
    userId: number;
    time: Date;
    location: {
        type: 'Point';
        coordinates: Array<number>;
    };
}

export default mongoose.model<ILocationRecord>('LocationRecord', LocationRecordSchema);