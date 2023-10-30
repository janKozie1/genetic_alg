import { isNil } from "./guards";
import { Nullable } from "./types";

export const last = <T>(array: T[]): Nullable<T> => array[array.length - 1];

export const withoutIndex = <T>(array: T[], index: number): T[] => [...array.slice(0, index), ...array.slice(index + 1)]

export const chunk = <T>(array: T[], size: number): T[][] => array.reduce<T[][]>((acc, current) => {
    const prev = last(acc);

    if (isNil(prev) || prev.length === size) {
        acc.push([current])
    } else {
        prev.push(current)
    }

    return acc;
}, [])