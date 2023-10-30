import { Config } from '.'
import crossover from './crossover'

import { faker } from '@faker-js/faker'

import dependencies from './utils'

describe('crossover', () => {
    const get = () => {
        return crossover({
            config: { 
                precision: 6, searchRange: {from: -5, to: 5},
                fn: 'styblinskiAndTang',
                target: [], 
                dimensions: 1 
            }, 
            dependencies: dependencies({ faker })
        })
    }

    beforeEach(() => {
        faker.seed(1)
    })

    afterEach(() => {
        faker.seed(undefined)
    })

    describe('nPoint', () => {
        const { nPoint } = get()
        

        it('works in generic cases', () => {
            const variablesA = Array.from({length: 2}, (_,i) => Array.from({length: 16}, () => i === 0 ? '1' : '0' ).join(''));
            const variablesB = Array.from({length: 2}, (_,i) => Array.from({length: 16}, () => i === 0 ? '0' : '1' ).join(''))

            expect(nPoint({points: 1})({variablesA, variablesB})).toEqual([
                ["1111111100000000", "0000000011111111"],
                ["0000000011111111", "1111111100000000"]
            ])

            expect(nPoint({points: 2})({variablesA, variablesB})).toEqual([
                ["1111100000111111", "0000011111000000"],
                ["0000011111000000", "1111100000111111"]
            ])

            expect(nPoint({points: 3})({variablesA, variablesB})).toEqual([
                ["1111000011110000", "0000111100001111"],
                ["0000111100001111", "1111000011110000"]
            ])
        })
    })

    describe('uniform', () => {
        const { uniform } = get()

        it('works in generic cases', () => {
            const variablesA = Array.from({length: 2}, (_,i) => Array.from({length: 16}, () => i === 0 ? '1' : '0' ).join(''));
            const variablesB = Array.from({length: 2}, (_,i) => Array.from({length: 16}, () => i === 0 ? '0' : '1' ).join(''))

            expect(uniform({})({variablesA, variablesB})).toEqual([
                ["0101010101010101", "1010101010101010"],
                ["1010101010101010", "0101010101010101"]
            ])
        })
    })

    describe('shuffly', () => {
        const { shuffle } = get()
        
        it('works in generic cases', () => {
            const variablesA = Array.from({length: 2}, (_) => Array.from({length: 16}, (__, i) => i % 2 ? '1' : '0' ).join(''));
            const variablesB = Array.from({length: 2}, (_) => Array.from({length: 16}, (__, i) => i % 2 ? '0' : '1' ).join(''));

            expect(shuffle({})({variablesA, variablesB})).toEqual([
                ["0101111110111001", "0010001111010010"],
                ["0110001001100000", "0011001101011110"]
            ])
        })
    })
})