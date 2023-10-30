import { BaseArg } from "."
import fns, { FN } from "../fn"
import { isNil } from "../utils/guards"
import {  Nullable } from "../utils/types"
import { EvaluationResult } from "./evaluation"
import { SamplesGetter, SelectionAmountTypes } from "./selection"

const eliteStrategy = (config: Omit<EpochFNArg<unknown>, 'fns'>, evaluationResults: EvaluationResult[], eliteStrategy: EliteStrategy) => {
    const targetValue = fns[config.fn](...config.target)

    const copied = [...evaluationResults];
    copied.sort((resultA, resultB) => {
        const distanceA = Math.abs(resultA.value - targetValue);
        const distanceB = Math.abs(resultB.value - targetValue);

        return distanceA - distanceB;
    })

    const cutOffPoint = eliteStrategy.type === 'amount'
        ? eliteStrategy.amount
        : Math.floor(copied.length * (eliteStrategy.amount / 100)) 

    return copied.slice(0, cutOffPoint).map((sample) => sample.variables);
}

const makeCrossover = <T>({dependencies}: BaseArg, arg: EpochFNArg<T>) => (targetAmount: number, samplesGetter: SamplesGetter) => {
    const futureSamples: T[][] = []
    const needsMoreSamples = () => futureSamples.length !== targetAmount

    while (needsMoreSamples()) {
        const samples = samplesGetter(2);

        if (dependencies.random.bool(arg.opts.odds.crossover)) {
            const [variablesA, variablesB] = samples.map((sample) => arg.fns.encode(sample.variables))
            const crossed = arg.fns.crossover({variablesA, variablesB});

            for (const sample of crossed) {
                if (!needsMoreSamples()) {
                    break;
                }

                futureSamples.push(sample)
            }
        }
    }

    return futureSamples;
}

type EliteStrategy = Readonly<{
    amount: number;
    type: SelectionAmountTypes
}>

type EpochFNOptions = Readonly<{
    eliteStrategy: EliteStrategy
    odds: {
        crossover: number,
    }
}>

type EpochFNArg<T> = Readonly<{
    prevVariables: number[][],
    target: number[],
    fn: FN,
    fns: {
        evaluate: (variables: number[]) => EvaluationResult,
        select: (allSamples: EvaluationResult[]) => SamplesGetter,
        encode: (variables: number[]) => T[]
        decode: (variables: T[]) => number[],
        crossover: (variables: Record<'variablesA' | 'variablesB', T[]>) => T[][],
        mutators: {
            fn: (variables: T[]) => T[],
        }[];
    },
    opts: EpochFNOptions
}>

type EpochFNResult = Readonly<{
    newVariables: number[][]
    recordedSteps: unknown
}>

const standard = (baseArg: BaseArg) => <T>(arg: EpochFNArg<T>): EpochFNResult  => {
    const { prevVariables, fns } = arg;
    
    const evaluated = prevVariables.map(fns.evaluate);

    const samplesGetter = fns.select(evaluated);
    const crossover = makeCrossover(baseArg, arg);

    const transferredSamples = isNil(arg.opts.eliteStrategy) || arg.opts.eliteStrategy.amount === 0 ? [] : eliteStrategy(arg, evaluated, arg.opts.eliteStrategy)
    const futureSamples = crossover(prevVariables.length - transferredSamples.length, samplesGetter)
        .map((sample) => {
            return arg.fns.mutators.reduce((base, currentMutator) => {
                return currentMutator.fn(base);
            }, sample)

        })
        .map(arg.fns.decode);


    return {
        newVariables: [...transferredSamples, ...futureSamples],
        recordedSteps: null
    }
};


export default (dependencies: BaseArg) => ({
    standard: standard(dependencies)
})