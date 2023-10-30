import { add } from "./utils/math";

export type FNShape = (...variables: number[]) => number;

const styblinskiAndTang: FNShape = (...variables: number[]) => 0.5 * (variables.map((x_n) => ((x_n ** 4) - 16 * x_n ** 2 + 5 * x_n)).reduce(add, 0)) 


const fns = {
    styblinskiAndTang,
}

export type FN = keyof typeof fns;

export default fns;