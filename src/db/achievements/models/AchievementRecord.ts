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
export type AchievementNameType = "foreveralone" | "zombie" | "moneyboy" | "hamsterbuyer" | "superspreader" | "quizmaster"
export const AchievementNames: AchievementNameType[] = ["foreveralone", "zombie", "moneyboy", "hamsterbuyer", "superspreader", "quizmaster"]

// the decision boundary for each badge of a achievement can be modified here
export const AchievementsInformations: AchievementInfo[] = [
    {
        name: "foreveralone",
        bronce: 2,
        silver: 5,
        gold: 10
    },
    {
        name: "zombie",
        bronce: 50,
        silver: 200,
        gold: 300
    },
    {
        name: "moneyboy",
        bronce: 20,
        silver: 50,
        gold: 100
    },
    {
        name: "hamsterbuyer",
        bronce: 10,
        silver: 20,
        gold: 50
    },
    {
        name: "superspreader",
        bronce: 5,
        silver: 50,
        gold: 100
    },
    {
        name: "quizmaster",
        bronce: 10,
        silver: 50,
        gold: 100
    },
]

// Make sure that for every userId and name there only exists one record
AchievementRecordSchema.index({ userId: 1, name: 1 }, { unique: true })

interface AchievementInfo {
    name: AchievementNameType,
    bronce: number,
    silver: number,
    gold: number
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
