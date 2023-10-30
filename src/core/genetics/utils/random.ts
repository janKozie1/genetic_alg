import { OwnDependencies } from ".";

const randomNumberInRange = (dependencies: OwnDependencies) => (min: number, max: number) => dependencies.faker.number.float({min, max});

const shuffle = (dependencies: OwnDependencies) => <T>(array: T[]) => dependencies.faker.helpers.shuffle([...array]);

const bool = (dependencies: OwnDependencies) => (odds: number) => dependencies.faker.number.float({min: 0, max: 1}) < odds;

const binary = (dependencies: OwnDependencies) => (length: number) => dependencies.faker.string.binary({length}) 

const element = (dependencies: OwnDependencies) => <T>(array: T[]) => dependencies.faker.helpers.arrayElement(array) 

const elements = (dependencies: OwnDependencies) => <T>(array: T[], amount: number) => dependencies.faker.helpers.arrayElements(array, amount) 

const normalDistSample = (dependencies: OwnDependencies) => (mean: number, stdev: number) => {
    const randomNum = randomNumberInRange(dependencies)

    const u = 1 - randomNum(0, 1); 
    const v = randomNum(0, 1);
    const z = Math.sqrt( -2.0 * Math.log( u ) ) * Math.cos( 2.0 * Math.PI * v );
    
    return z * stdev + mean;
}

export default (dependencies: OwnDependencies) => ({
    randomNumberInRange: randomNumberInRange(dependencies),
    shuffle: shuffle(dependencies),
    bool: bool(dependencies),
    binary: binary(dependencies),
    element: element(dependencies),
    elements: elements(dependencies),
    normalDistSample: normalDistSample(dependencies)
})