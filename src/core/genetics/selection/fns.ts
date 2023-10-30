import { orderBy } from "lodash";
import { EvaluationResult } from "../evaluation"

type CopiesFN = (rank: number, totalRank: number) => number
const identity: CopiesFN = (rank) => rank;
const invertedIdentity: CopiesFN = (rank, totalRank) => totalRank - rank;

export type CopiesFns = keyof typeof copiesFns;
export const copiesFns = { identity, invertedIdentity }

type RankFN = (all: EvaluationResult[], targetValue: number) => (current: EvaluationResult) => number;
const closestToTarget: RankFN = (evaluationResults, targetValue) => {
    const copied = [...evaluationResults];
    
    copied.sort((resultA, resultB) => {
        const distanceA = Math.abs(resultA.value - targetValue);
        const distanceB = Math.abs(resultB.value - targetValue);

        return distanceA - distanceB;
    });

    return (current) => copied.findIndex((el) => el.value === current.value)
};

export type RankFns = keyof typeof rankFns;
export const rankFns = { closestToTarget }

type ProbablityFN = (evaluationResult: EvaluationResult, total: number) => number
const partOfTotal: ProbablityFN = (ev, total) => 1 - (Math.abs(ev.value) / total);

export type ProbablityFNs = keyof typeof probablityFns;
export const probablityFns = { partOfTotal }