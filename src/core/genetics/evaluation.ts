import { BaseArg } from ".";
import fns from "../fn";

export type EvaluationResult = Readonly<{variables: number[], value: number}>
type EvaluationFN = (arg: BaseArg) => (variables: number[]) => EvaluationResult;

const standard: EvaluationFN = ({config}) => (variables) => ({
    variables,
    value: fns[config.fn](...variables)
})

export default (dependencies: BaseArg) => ({
    standard: standard(dependencies)
})