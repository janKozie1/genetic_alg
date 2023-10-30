import { BaseArg } from "..";
import fns from "../../fn";
import { chunk, last, withoutIndex } from "../../utils/array";
import { isNil } from "../../utils/guards";
import { add, isInRange } from "../../utils/math";
import { EvaluationResult } from "../evaluation";

import { copiesFns, CopiesFns, rankFns, RankFns, ProbablityFNs, probablityFns } from './fns'

export type SamplesGetter = (crossoverSamples: number) => EvaluationResult[];
const randomCrossoverSamplesGetter = ({dependencies}: BaseArg, allSamples: EvaluationResult[]): SamplesGetter => (amount) => {
    const recurse = (availableSamples: EvaluationResult[], amountLeft: number): EvaluationResult[] => {
        if (amountLeft === 0) {
            return []
        }
        
        if (availableSamples.length === 0) {
            throw Error('Not enough samples')
        }

        const pickedSampleIndex = Math.floor(dependencies.random.randomNumberInRange(0, availableSamples.length));


        return [availableSamples[pickedSampleIndex], ...recurse(withoutIndex(availableSamples, pickedSampleIndex), amountLeft - 1)]
    }

    return recurse(allSamples, amount)
} 

export const selectionAmountTypes = ['percentage', 'amount'] as const;
export type SelectionAmountTypes = typeof selectionAmountTypes[number]

type BaseSelectionFNConfig = {};

type SelectionFN<T extends BaseSelectionFNConfig> = (arg: BaseArg) => (arg: T) => (evaluationResults: EvaluationResult[]) => SamplesGetter;

type NBestSelectionConfig = BaseSelectionFNConfig & Readonly<{amount: number, selectionType: SelectionAmountTypes}>
const nBestSelection: SelectionFN<NBestSelectionConfig> = (arg) => ({amount, selectionType}) => (evaluationResults) => {
    const {config: {target, fn}} = arg;
    const targetValue = fns[fn](...target);

    const copied = [...evaluationResults];
    
    copied.sort((resultA, resultB) => {
        const distanceA = Math.abs(resultA.value - targetValue);
        const distanceB = Math.abs(resultB.value - targetValue);

        return distanceA - distanceB;
    });

    debugger;

    const cutOffPoint = selectionType === 'amount' 
        ? amount
        : Math.floor(copied.length * (amount / 100))

    const availableSamples = copied.slice(0, cutOffPoint);
    
    return randomCrossoverSamplesGetter(arg, availableSamples)
}

type TournamentSelectionConfig = BaseSelectionFNConfig & Readonly<{size: number, turns: number}>
const tournamentSeleciton: SelectionFN<TournamentSelectionConfig> = (arg) => ({size, turns}) => (evaluationResults) => {
    const { dependencies } = arg;

    const recurse = (contestants: EvaluationResult[], turnsLeft: number): EvaluationResult[] => {
        if (turnsLeft === 0) {
            return contestants
        }

        const groups = chunk(dependencies.random.shuffle(contestants), size);
        const winners = groups.map((group) => nBestSelection(arg)({amount: 1, selectionType: 'amount'})(group)(1)[0]);

        if (winners.length === 1) {
            return winners;
        }

        return recurse(winners, turnsLeft - 1);
    }

    return randomCrossoverSamplesGetter(arg, recurse(evaluationResults, turns))
}

type RankSelectionConfig = BaseSelectionFNConfig & Readonly<{
    rank: RankFns,
    copies: CopiesFns
}>
const rankSelection: SelectionFN<RankSelectionConfig> = ({dependencies, config}) => ({copies, rank}) => (evaluationResults) => {
    const targetValue = fns[config.fn](...config.target);
    const rankFn = rankFns[rank](evaluationResults, targetValue);

    const withRanks = evaluationResults.map((evaluationResult) => {
        return {
            rank: rankFn(evaluationResult),
            evaluationResult,
        }
    })

    const localMax = Math.max(...withRanks.map((e) => e.rank))
    const totalRank = localMax === 0 ? 1 : localMax;

    const withCopies = withRanks.flatMap((evaluationResultWithRank) => {
        const amount = copiesFns[copies](evaluationResultWithRank.rank, totalRank);

        return Array.from({length: amount}, () => evaluationResultWithRank.evaluationResult);
    });
    
    return (crossoverSamples) => {
        const recurse = (availableSamples: EvaluationResult[], amountLeft: number): EvaluationResult[] => {
            if (amountLeft === 0) {
                return []
            }
            
            if (availableSamples.length === 0) {
                debugger;
                throw Error('Not enough samples')
            }
    
            const pickedSample = availableSamples[Math.floor(dependencies.random.randomNumberInRange(0, availableSamples.length))];
    
    
            return [pickedSample, ...recurse(availableSamples.filter((sample) => sample !== pickedSample), amountLeft - 1)]
        }
    
        return recurse(withCopies, crossoverSamples)
    }
}

type FortuneWheelElement = {
    evaluationResult: EvaluationResult,
    probabilityRange: { from: number, to: number};
};

type FortuneWheelSelectionConfig = BaseSelectionFNConfig & Readonly<{
    probability: ProbablityFNs
}>
const fortuneWheelSelection: SelectionFN<FortuneWheelSelectionConfig> = ({dependencies}) => ({probability}) => (evaluationResults) => {
    const totalSum = evaluationResults.map((evaluationResult) => Math.abs(evaluationResult.value)).reduce(add, 0);

    const withProbability = evaluationResults.map((evaluationResult) => ({
        evaluationResult,
        probabilityRange: probablityFns[probability](evaluationResult, totalSum),
    })).reduce<FortuneWheelElement[]>((acc, current, index, total) => {
        const isLast = total.length === index + 1;
        const prev = last(acc);

        if (isNil(prev)) {
            return [{...current, probabilityRange: {from: 0, to:  isLast ? 1 : current.probabilityRange}}]
        } else {
            acc.push({
                ...current,
                probabilityRange: { 
                    from: prev.probabilityRange.to, 
                    to: isLast 
                        ? 1
                        : prev.probabilityRange.to + current.probabilityRange 
                }
            })
        }

        return acc;
    }, [])

    return (crossoverSamples) => {
        const recurse = (availableSamples: FortuneWheelElement[], pickedIndices: number[], amountLeft: number): EvaluationResult[] => {
            if (amountLeft === 0) {
                return []
            }
            
            if (availableSamples.length === 0) {
                throw Error('Not enough samples')
            }

            const probability = dependencies.random.randomNumberInRange(0, 1);
            const pickedSampleIndex = availableSamples.findIndex((sample) => isInRange(sample.probabilityRange, probability))

            if (pickedIndices.includes(probability)) {
                return recurse(availableSamples, pickedIndices, amountLeft)
            }
    
            return [
                availableSamples[pickedSampleIndex].evaluationResult, 
                ...recurse(availableSamples, [...pickedIndices, pickedSampleIndex], amountLeft - 1)
            ]
        }
    
        return recurse(withProbability, [], crossoverSamples)
    }
}

export default (dependencies: BaseArg) => ({
    nBestSelection: nBestSelection(dependencies),
    tournamentSeleciton: tournamentSeleciton(dependencies),
    rankSelection: rankSelection(dependencies),
    fortuneWheelSelection: fortuneWheelSelection(dependencies),
})