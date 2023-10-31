import { Genetics } from "../../../core/genetics";
import { Literal } from "../../../core/utils/types";

type ToParamsShape<T extends Literal> = Readonly<{
    [key in keyof T]: T[key] extends ((...args: any[]) => any) ? Parameters<T[key]>[0] : {};
}>

type ParamsShapeToDefaultValues<T extends Literal> = Readonly<{
    [key in keyof T]: T[key] extends Literal ? Readonly<{
        [subkey in keyof T[key]]: T[key][subkey] extends number 
            ? number 
            : T[key][subkey] extends string
                ? T[key][subkey][]
                : T[key][subkey] extends boolean
                    ? boolean
                    : never
    }> : T[key]
}>

type Initialization = Genetics['initialization']
export type InitializationParams = ToParamsShape<Initialization>

export const initializationDefaultConfig: ParamsShapeToDefaultValues<InitializationParams> = {
    randomSamples: { samples: 0 },
    randomUniformSamples: { samples: 0 },
    sequentiatialSamples: { samples: 0 },
}

type Selection = Genetics['selection']
export type SelectionParams = ToParamsShape<Selection>

export const selectionDefaultConfig: ParamsShapeToDefaultValues<SelectionParams> = {
    nBestSelection: {
        amount: 0,
        selectionType: ['amount', 'percentage']
    },
    tournamentSeleciton: {
        size: 0,
        turns: 0,
    },
    fortuneWheelSelection: {
        probability: ['partOfTotal'],
    },
    rankSelection: {
        copies: ['invertedIdentity', 'identity'],
        rank: ['closestToTarget']
    }
};

type Encoding = Genetics['encoding'];
export type EncodingParams = ToParamsShape<Encoding>

export const encodingDefaultConfig: ParamsShapeToDefaultValues<EncodingParams> = {
    binary: {},
    none: [],
}

type Mutation = Genetics['mutation']
export type MutationParams = ToParamsShape<Mutation>

export const mutationDefaultConfig: ParamsShapeToDefaultValues<MutationParams> = {
    edge: {
        odds: 0,
        uniform: false,
    },
    inversion: {
        odds: 0,
        uniform: false,
    },
    nPoint: {
        odds: 0,
        points: 0,
        uniform: false
    },
    random: {
        odds: 0,
        uniform: false,
    },
    gauss: {
        odds: 0,
        stdDev: 1,
        uniform: false,
    },
    uniform: {
        from: 0,
        to: 0,
        odds: 0,
    }
}

type Crossover = Genetics['crossover']
export type CrossoverParams = ToParamsShape<Crossover>

export const crossoverDefaultConfig: ParamsShapeToDefaultValues<CrossoverParams> = {
    discrete: {},
    nPoint: {points: 0},
    shuffle: {},
    uniform: {},
    arithmetic: {constant: false},
    average: {},
    blendA: { alpha: 0},
    blendAB: {alpha: 0, beta: 0},
    flat: {},
    linear: {}
}