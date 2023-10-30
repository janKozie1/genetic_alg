import { BaseArg } from ".";
import { withPrecision } from "../utils/math";

type BaseInitializationFNConfig = Readonly<{ samples: number }>
type InitializationFN<T extends BaseInitializationFNConfig> = (arg: BaseArg) => (arg: T) => number[][];

const randomSamples: InitializationFN<BaseInitializationFNConfig> = ({dependencies, config}) => ({ samples }) => {
    const range = config.searchRange;
    return Array.from({ length: samples}, (
        () => Array.from({length: config.dimensions}, 
            () => withPrecision(dependencies.random.randomNumberInRange(range.from, range.to), config.precision), ) 
        )
    );
}

const randomUniformSamples: InitializationFN<BaseInitializationFNConfig> = ({dependencies, config}) => ({ samples }) => {
    const range = config.searchRange;
    return Array.from({ length: samples}, (
        () => {
            const num = withPrecision(dependencies.random.randomNumberInRange(range.from, range.to), config.precision)
            return Array.from({length: config.dimensions}, () => num)
        })
    );
}

const sequentiatialSamples: InitializationFN<BaseInitializationFNConfig> = ({config}) => ({ samples}) => {
    const range = config.searchRange;
    const step = Math.abs(range.to - range.from) / (samples - 1);

    return Array.from(({length: samples}), 
        (_, i) => Array.from({length: config.dimensions}, 
            ()=> withPrecision(range.from + i * step, config.precision)
        ) 
    );
}

export default (arg: BaseArg) => ({
    randomSamples: randomSamples(arg),
    randomUniformSamples: randomUniformSamples(arg),
    sequentiatialSamples: sequentiatialSamples(arg)
})