import InfectionRecord, { IInfectionRecord } from "./models/InfectionRecord";

export async function getInfectionStatusOfUser(userId: IInfectionRecord['userId'], options: any): Promise<IInfectionRecord[]> {
    return InfectionRecord.find({ userId: userId }, options).sort({ dateOfTest: 'desc' })
}
