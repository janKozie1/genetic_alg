import { Faker } from "@faker-js/faker"
import random from './random';

export type OwnDependencies = Readonly<{
    faker: Faker
}>

type UnitializedDependencies = (ownDependencies: OwnDependencies) => unknown;
type InitializeDependencies<T extends Record<string, UnitializedDependencies>> = {
    [key in keyof T]: ReturnType<T[key]>
}

export type Dependencies = InitializeDependencies<typeof dependencyConfig>

const dependencyConfig = {
    random
}

export default (dependencies: OwnDependencies): Dependencies => Object.fromEntries(
    Object.entries(dependencyConfig).map(([key, dependency]) => [key, dependency(dependencies)] as const)
) as Dependencies;

