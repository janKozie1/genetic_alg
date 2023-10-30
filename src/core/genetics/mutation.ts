import { BaseArg } from ".";
import { clampToRange, negateBinary } from "../utils/math";
import { Binary } from "../utils/types";

type BaseMutationFNConfig = Readonly<{odds: number, uniform: boolean}>
type MutationFN<T, VariableType> = (arg: BaseArg) => (arg: T) => (variables: VariableType[]) => VariableType[];

const random: MutationFN<BaseMutationFNConfig, Binary> = ({dependencies}) => ({odds}) => (variables) => {
    return variables.map((variable) => variable.split('').map((bit) => dependencies.random.bool(odds) ? negateBinary(bit) : bit).join('')) 
}

type NPointMutationConfig = BaseMutationFNConfig & Readonly<{points: number}>
const nPoint: MutationFN<NPointMutationConfig, Binary> = ({dependencies}) => ({odds, points, uniform}) => (variables) => { 
    if (!dependencies.random.bool(odds) && uniform) { 
        return variables;
    }

    if (uniform) {
        const allIndices = Array.from({length: variables[0].length }, (_, i) => i);
        const indicesToMutate = dependencies.random.elements(allIndices, points);

        return variables.map((variable) => {
            const split = variable.split('')

            indicesToMutate.forEach((index) => {
                split[index] = negateBinary(split[index])
            })

            return split.join('')
        })
    }

    return variables.map((variable) => {
        if (!dependencies.random.bool(odds)) { 
            return variable
        }

        const allIndices = Array.from({length: variable.length }, (_, i) => i);

        const indicesToMutate = dependencies.random.elements(allIndices, points);
        const split = variable.split('')

        indicesToMutate.forEach((index) => {
            split[index] = negateBinary(split[index])
        })

        return split.join('')
    })
}

const edge: MutationFN<BaseMutationFNConfig, Binary> = ({dependencies}) => ({odds, uniform}) => (variables) => {
    if (uniform && !dependencies.random.bool(odds)) {
        return variables;
    }

    return variables.map((variable) => {
        if (!uniform && !dependencies.random.bool(odds)) {
            return variable
        }

        const [last, ...leading] = variable.split('').reverse();
        return [...leading.reverse(), negateBinary(last)].join('')
    })
}

const inversion: MutationFN<BaseMutationFNConfig, Binary>  = ({dependencies}) => ({odds, uniform}) => (variables) => {
    if (uniform && !dependencies.random.bool(odds)) {
        return variables;
    }

    const getRandomIndices = (variable: Binary) => {
        const [x1, x2] = dependencies.random.elements(Array.from({length: variable.length}, (_, i) => i), 2);

        if (x1 > x2) {
            return [x2, x1]
        }

        return [x1, x2]
    }

    if (uniform) {
      const [x1, x2] = getRandomIndices(variables[0])
      return variables.map((variable) => `${variable.slice(0, x1)}${negateBinary(variable.slice(x1, x2))}${variable.slice(x2)}`);
    }

    return variables.map((variable) => {
        if (!uniform && !dependencies.random.bool(odds)) {
            return variable;
        }
    
        const [x1, x2] = getRandomIndices(variable);
        return `${variable.slice(0, x1)}${negateBinary(variable.slice(x1, x2))}${variable.slice(x2)}`;
    })
}

type UniformMutationConfig = Omit<BaseMutationFNConfig, 'uniform'> & Readonly<{from: number, to: number}>
const uniform: MutationFN<UniformMutationConfig, number> = ({dependencies, config}) => ({from, to, odds}) => (variables) => {
    if (!dependencies.random.bool(odds)) {
        return variables;
    }

    const indexToModify = Math.round(dependencies.random.randomNumberInRange(0, variables.length - 1))

    return variables.map((variable, i) => i === indexToModify 
        ? dependencies.random.randomNumberInRange(Math.max(from, config.searchRange.from), Math.min(to, config.searchRange.to))
        : variable)
}

type GaussMutationConfig = BaseMutationFNConfig & Readonly<{stdDev: number }>
const gauss: MutationFN<GaussMutationConfig, number> = ({dependencies, config}) => ({stdDev, uniform, odds}) => (variables) => {
    if (uniform && !dependencies.random.bool(odds)) {
        return variables;
    }

    if (uniform) {
        return variables.map((variable) => clampToRange(config.searchRange, variable + dependencies.random.normalDistSample(0, stdDev)))
    }

    return variables.map((variable) => {
        if (dependencies.random.bool(odds)) {
            return clampToRange(config.searchRange, variable + dependencies.random.normalDistSample(0, stdDev))
        }
        return variable;
    })
}

export default (dependencies: BaseArg) => ({
    random: random(dependencies),
    nPoint: nPoint(dependencies),
    edge: edge(dependencies),
    inversion: inversion(dependencies),
    uniform: uniform(dependencies),
    gauss: gauss(dependencies),
})