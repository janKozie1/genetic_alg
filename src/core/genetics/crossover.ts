import { orderBy } from "lodash";
import { BaseArg } from ".";
import fns from "../fn";
import { isNil } from "../utils/guards";
import { clampToRange } from "../utils/math";
import { Binary } from "../utils/types";

const swapBits = (target: Binary, source: Binary, startIndex: number, endIndex: number) => `${target.slice(0, startIndex)}${source.slice(startIndex, endIndex)}${target.slice(endIndex)}`

type VariablesPair<T> = { variablesA: T[], variablesB: T[] }

type BaseCrossoverFNConfig = {}
type CrossoverFN<T extends BaseCrossoverFNConfig, VariableType> = (arg: BaseArg) => (arg: T) => (variables: VariablesPair<VariableType>) => VariableType[][];

type NPointConfig = BaseCrossoverFNConfig & Readonly<{points: number}>
const nPoint: CrossoverFN<NPointConfig, Binary> = () => ({points}) => ({variablesA, variablesB}) => {
    const step = Math.floor(variablesA[0].length / (points + 1))
    const indexes = [...Array.from({length: points + 1}, (_, i) => i * step), variablesA[0].length]
    
    
    return Object.values(indexes.reduce<VariablesPair<Binary>>((acc, indexToSlice, elementIndex) => {
        const prevIndexToSlice = indexes[elementIndex - 1]
        
        if (isNil(prevIndexToSlice) || (elementIndex % 2 !== 0)) {
            return acc;
        }
        
        for (let i = 0; i < acc.variablesA.length; i++) {
            const variableA = acc.variablesA[i];
            const variableB = acc.variablesB[i];

            const swappedA = swapBits(variableA, variableB, prevIndexToSlice, indexToSlice);
            const swappedB = swapBits(variableB, variableA, prevIndexToSlice, indexToSlice);

            acc.variablesA[i] = swappedA;
            acc.variablesB[i] = swappedB;
        }

        return acc;
    }, { variablesA: [...variablesA], variablesB: [...variablesB] }))
}

const uniform: CrossoverFN<BaseCrossoverFNConfig, Binary> = () => () => ({variablesA, variablesB}) => {
    return Object.values(Array.from({length: variablesA.length }, (_, i) => i).reduce<VariablesPair<Binary>>((acc, variableIndex) => {
        for (let digitIndex = 0; digitIndex < acc.variablesA[variableIndex].length; digitIndex++) {
            if (digitIndex % 2 === 0) {
                const variableA = acc.variablesA[variableIndex];
                const variableB = acc.variablesB[variableIndex];
    
                const swappedA = swapBits(variableA, variableB, digitIndex, digitIndex + 1);
                const swappedB = swapBits(variableB, variableA, digitIndex, digitIndex + 1);
    
                acc.variablesA[variableIndex] = swappedA;
                acc.variablesB[variableIndex] = swappedB;
            }
        }

        return acc;
    }, { variablesA: [...variablesA], variablesB: [...variablesB] }))
}

const shuffle: CrossoverFN<BaseCrossoverFNConfig, Binary> = (arg) => () => ({variablesA, variablesB}) => {
    const {dependencies} = arg;

    const shuffledA = variablesA.map((variable) => dependencies.random.shuffle(variable.split('')).join(''))
    const shuffledB = variablesB.map((variable) => dependencies.random.shuffle(variable.split('')).join(''))

    return nPoint(arg)({points: 1})({variablesA: [...shuffledA], variablesB: [...shuffledB], })
}

const discrete: CrossoverFN<BaseCrossoverFNConfig, Binary> = ({dependencies}) => () => ({variablesA, variablesB}) => {
    const aggr: string[] = [];

    for (let variableIndex = 0; variableIndex < variablesA.length; variableIndex++) {
        const localAggr: string[] = []

        for (let digitIndex = 0; digitIndex < variablesA[variableIndex].length; digitIndex++) {
            const digitA = variablesA[variableIndex][digitIndex]
            const digitB = variablesB[variableIndex][digitIndex]

            localAggr.push(dependencies.random.bool(0.5) ? digitA : digitB)
        }

        aggr.push(localAggr.join(''))
    }

    return [aggr]
}

type ArithmeticConfig = BaseCrossoverFNConfig & Readonly<{constant: boolean}>
const arithmetic: CrossoverFN<ArithmeticConfig, number> = ({dependencies, config}) => (arg) => {
    const { constant } = isNil(arg) ? {constant: false} : arg;
    const sharedK = dependencies.random.randomNumberInRange(0, 1)
    
    return ({variablesA, variablesB}) =>  {
        const k = constant 
            ? sharedK
            : dependencies.random.randomNumberInRange(0, 1);

        const newVariablesA = variablesA.map((variable, index) => {
            const correspondingVariable = variablesB[index];

            return clampToRange(config.searchRange, variable * k + (1 - k) * correspondingVariable);
        })

        const newVariablesB = variablesB.map((variable, index) => {
            const correspondingVariable = variablesA[index];

            return clampToRange(config.searchRange, (1 - k) * correspondingVariable + k * variable);
        })

        return [newVariablesA, newVariablesB]
    }
}

type BlendAConfig = BaseCrossoverFNConfig & Readonly<{alpha: number}>
const blendA: CrossoverFN<BlendAConfig, number> = ({dependencies, config}) => ({alpha}) => ({variablesA, variablesB}) => {
    const cross = (a: number[], b: number[]) => {
        return a.map((variable, index) => {
            const correspondingVariable = b[index];
            const d = Math.abs(variable - correspondingVariable);
            const ad = alpha * d;
    
            return clampToRange(config.searchRange, dependencies.random.randomNumberInRange(Math.min(variable, correspondingVariable) - ad, Math.max(variable, correspondingVariable) + ad))
        })
    }

    return [cross(variablesA, variablesB), cross(variablesB, variablesA)]
}


type BlendABConfig = BaseCrossoverFNConfig & Readonly<{alpha: number, beta: number}>
const blendAB: CrossoverFN<BlendABConfig, number> = ({dependencies, config}) => ({alpha,beta}) => ({variablesA, variablesB}) => {
    const cross = (a: number[], b: number[]) => {
        return a.map((variable, index) => {
            const correspondingVariable = b[index];
            const d = Math.abs(variable - correspondingVariable);
            const ad = alpha * d;
            const bd = beta * d;
    
            return clampToRange(config.searchRange, dependencies.random.randomNumberInRange(Math.min(variable, correspondingVariable) - ad, Math.max(variable, correspondingVariable) + bd))
        })
    }

    return [cross(variablesA, variablesB), cross(variablesB, variablesA)]
}

const average: CrossoverFN<BaseCrossoverFNConfig, number> = () => () => ({variablesA, variablesB}) => {
    return [variablesA.map((variable, i) => (variable + variablesB[i]) / 2)]
}

const flat: CrossoverFN<BaseCrossoverFNConfig, number> = ({dependencies, config}) => () => ({variablesA, variablesB}) => {
    return [variablesA.map((variable, i) => {
        const correspondingVariable = variablesB[i]
        const start = variable < correspondingVariable
            ? variable
            : correspondingVariable
        const end = start === variable ? correspondingVariable : variable;

        return clampToRange(config.searchRange, dependencies.random.randomNumberInRange(start, end))
    })]
}

const linear: CrossoverFN<BaseCrossoverFNConfig, number> = ({dependencies, config}) => () => ({variablesA, variablesB}) => {
    const z = variablesA.map((variable, i) => {
        const correspondingVariable = variablesB[i];
        return clampToRange(config.searchRange, 0.5 * variable + 0.5 * correspondingVariable);
    })

    const v = variablesA.map((variable, i) => {
        const correspondingVariable = variablesB[i];
        return clampToRange(config.searchRange, 1.5 * variable - 0.5 * correspondingVariable);
    })

    const w = variablesA.map((variable, i) => {
        const correspondingVariable = variablesB[i];
        return clampToRange(config.searchRange, -0.5 * variable + 1.5 * correspondingVariable);
    })

    const evaluated = [z,v,w].map((variables) => ({
        value: fns[config.fn](...variables),
        variables
    }));

    const sorted = orderBy(evaluated, ['value'], ['asc']);

    return sorted.slice(0, 2).map((entry) => entry.variables);
}

export default (dependencies: BaseArg) => ({
    nPoint: nPoint(dependencies),
    uniform: uniform(dependencies),
    shuffle: shuffle(dependencies),
    discrete: discrete(dependencies),
    arithmetic: arithmetic(dependencies),
    blendA: blendA(dependencies),
    blendAB: blendAB(dependencies),
    average: average(dependencies),
    flat: flat(dependencies),
    linear: linear(dependencies)
})