import mongoose, { Schema, Document } from "mongoose";

const AchievementRecordSchema: Schema = new Schema({
    userId: {
        type: String,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    badge: {
        type: String,
        required: true
    },
    remaining: {
        type: Number,
        required: true
    }

})

// different types of badges of an achievement
export type AchievementBadgeType = "none" | "bronce" | "silver" | "gold"
export const AchievementBadges: AchievementBadgeType[] = ["none", "bronce", "silver", "gold"]

// different achievements, type and const should cover the same achievements
export type AchievementNameType = "foreveralone" | "zombie" | "moneyboy" | "hamsterbuyer" | "superspreader"
export const AchievementNames: AchievementNameType[] = ["foreveralone", "zombie", "moneyboy", "hamsterbuyer", "superspreader"]

// the decision boundary for each badge of a achievement can be modified here
export const AchievementsInformations: AchievementInfo[] = [
    {
        name: "foreveralone",
        forBronce: 2,
        forSilver: 5,
        forGold: 10
    },
    {
        name: "zombie",
        forBronce: 1,
        forSilver: 10,
        forGold: 30
    },
    {
        name: "moneyboy",
        forBronce: 5,
        forSilver: 10,
        forGold: 100
    },
    {
        name: "hamsterbuyer",
        forBronce: 10,
        forSilver: 20,
        forGold: 50
    },
    {
        name: "superspreader",
        forBronce: 5,
        forSilver: 50,
        forGold: 100
    },
]

// Make sure that for every userId and name there only exists one record
AchievementRecordSchema.index({ userId: 1, name: 1 }, { unique: true })

interface AchievementInfo {
    name: AchievementNameType,
    forBronce: number,
    forSilver: number,
    forGold: number
}

export interface IAchievementRecord extends Document {
    userId: string,
    name: AchievementNameType,
    badge: AchievementBadgeType,
    remaining: number
}

export interface AchievementStatus {
    name: AchievementNameType,
    badge: AchievementBadgeType,
    remaining: number,
    howmany: number
}

export default mongoose.model<IAchievementRecord>('AchievementRecord', AchievementRecordSchema);
