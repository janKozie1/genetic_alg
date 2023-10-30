import { Config } from '.'
import encoding from './encoding'

import { faker } from '@faker-js/faker'

import dependencies from './utils'

describe('encoding', () => {
    const get = (config: Pick<Config, 'searchRange' | 'precision'>) => {
        return encoding({config: { ...config, fn: 'styblinskiAndTang', target: [], dimensions: 1 }, dependencies: dependencies({ faker })})
    }

    beforeEach(() => {
        faker.seed(1)
    })

    afterEach(() => {
        faker.seed(undefined)
    })

    it.each([1, 2, 3, 4 ,5])('decodes encoded values into the same value', (precision) => {
        const { binary } = get({ precision, searchRange: { from: -10, to: 10}});

        const exp = 10 ** precision;
        const base = -(exp * 10);
        const allNumbersInRange = Array.from({length: 20 * exp }, (_, i) => {
            const num = base + i;
            return num / exp
        });

        for (let number of allNumbersInRange) {
            const isEqual = binary.decode(binary.encode([number]))[0] === number;

            if (!isEqual) {
                console.log(`Error while encoding ${number}, precision ${precision}`)
                break;
            }
        }
    })

})