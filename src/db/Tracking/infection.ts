import InfectionRecord, { IInfectionRecord } from "./models/InfectionRecord";

export async function getInfectionStatusOfUser(userId: IInfectionRecord['userId']): Promise<IInfectionRecord[]> {
    return InfectionRecord.find({ userId: userId }).select('-_id -__v -userId').sort({ dateOfTest: 'desc' })
}
