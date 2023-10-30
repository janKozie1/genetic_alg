import { Binary } from "./types";

export const add = (a: number, b: number) => a + b;

export const withPrecision = (number: number, precision: number) => Math.round(number * (10 ** precision)) / (10 ** precision)

export const sqDistance = (pointA: number[], pointB: number[]) => pointA.map((coordinate, i) => (coordinate - pointB[i]) ** 2).reduce(add, 0);

export const toBinary = (number: number): Binary => number <= 1 ? `${number}` : `${toBinary(Math.floor(number / 2))}${number % 2}`

export const negateBinary = (binary: Binary) => binary.split('').map((bit) => Number(bit) === 0 ? 1 : 0).join('')

export const fromBinary = (binary: Binary): number => binary.split('').map((bit, i, all) => Number(bit) * (2 ** (all.length - i - 1))).reduce(add, 0)

export const padBinaryToLength = (binary: string, length: number) => `${'0'.repeat(length - binary.length)}${binary}`

export const isInRange = (range: Record<'from' | 'to', number>, value: number) => range.from <= value && value <= range.to

export const clampToRange = (range: Record<'from' | 'to', number>, value: number) => Math.max(Math.min(value, range.to), range.from)

export const avg = (arr: number[]): number => {
    const total = arr.reduce(add, 0);

    return total / arr.length;
}