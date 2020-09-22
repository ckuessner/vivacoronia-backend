import mongoose, { Document, Schema, SchemaTypeOpts } from "mongoose";

export const Point2DSchema: Schema = new Schema({
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
                if (v.length != 2) return false
                const lon = v[0]
                const lat = v[1]
                return lon >= -180 && lon <= 180 && lat >= -90 && lat <= 90
            },
            message: (v: SchemaTypeOpts.ValidatorProps): string =>
                // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
                `${v.value} is not a valid GeoJSON Point2D!`
        }
    }
})

export interface LeanLocationRecord {
    userId: string;
    time: Date;
    location: {
        type: 'Point';
        coordinates: Array<number>;
    };
}

const LocationRecordSchema: Schema = new Schema({
    userId: {
        type: String,
        required: true
    },
    time: {
        type: Date,
        required: true,
    },
    location: {
        type: Point2DSchema,
        required: true,
        index: '2dsphere'
    }
})

LocationRecordSchema.index({ userId: 1, time: 1 })

export interface ILocationRecord extends Document, LeanLocationRecord { }

export default mongoose.model<ILocationRecord>('LocationRecord', LocationRecordSchema);
