import { identity } from "lodash"
import { BaseArg } from "."
import { fromBinary, padBinaryToLength, toBinary, withPrecision } from "../utils/math"
import { Binary } from "../utils/types"

export type EncodingFN<T> = (arg: BaseArg) => Readonly<{
    encode: (arg: number[]) => T[],
    decode: (arg: T[]) => number[],
}>

const binary: EncodingFN<Binary> = ({config: { precision, searchRange }}) => {
    const length = Math.ceil(Math.log2(Math.abs(searchRange.from - searchRange.to) * (10 ** precision) + 1))
    const multiplier = ((2**length) - 1) / (searchRange.to - searchRange.from)

    return {
        encode: (variables) => variables.map((variable) => (
            padBinaryToLength(toBinary(Math.round((variable - searchRange.from) * multiplier)), length)
        )),
        decode: (encodedVariables) => encodedVariables.map((encodedVariable) => (
            withPrecision(searchRange.from + fromBinary(encodedVariable) / multiplier, precision)
        )),
    }
}

const none: EncodingFN<number> = () => {
    return {
        encode: identity,
        decode: identity,
    }
}

export default (dependencies: BaseArg) => ({
    binary: binary(dependencies),
    none: none(dependencies)
})