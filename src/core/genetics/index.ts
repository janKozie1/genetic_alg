import { FN } from "../fn";
import { Dependencies } from "./utils";
import initialization from "./initialization";
import evaluation from "./evaluation";
import selection from "./selection";
import encoding from "./encoding";
import crossover from "./crossover";
import mutation from "./mutation";
import epoch from "./epoch";

export type Config = Readonly<{
    precision: number;
    dimensions: number;
    searchRange: { from: number, to: number }
    fn: FN,
    target: number[]
}>

export type BaseArg = Readonly<{dependencies: Dependencies, config: Config}>

type UnitializedGenetics = (arg: BaseArg) => unknown;
type InitializeGenetics<T extends Record<string, UnitializedGenetics>> = {
    [key in keyof T]: ReturnType<T[key]>
}


export type Genetics = InitializeGenetics<typeof geneticsConfig>

const geneticsConfig = {
    initialization,
    evaluation,
    selection,
    encoding,
    crossover,
    mutation,
    epoch
}

export default (arg: BaseArg): Genetics=> Object.fromEntries(
    Object.entries(geneticsConfig).map(([key, genetic]) => [key, genetic(arg)] as const)
) as Genetics;
