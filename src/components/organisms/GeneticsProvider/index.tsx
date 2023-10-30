import { createContext, useContext, ReactNode, useState, useMemo } from 'react';
import { Nullable, ObjectValues } from '../../../core/utils/types'
import { 
    CrossoverParams, 
    EncodingParams, 
    InitializationParams, 
    SelectionParams,
    crossoverDefaultConfig,
    encodingDefaultConfig,
    initializationDefaultConfig,
    selectionDefaultConfig,
    mutationDefaultConfig,
    MutationParams
} from './config'
import { isNil } from 'lodash';

export type SelectedConfig = Readonly<{
    crossover: Readonly<{
        fn: keyof CrossoverParams,
        params: ObjectValues<CrossoverParams>
    }>,
    encoding: Readonly<{
        fn: keyof EncodingParams
        params: ObjectValues<EncodingParams>
    }>,
    intitialization: Readonly<{
        fn: keyof InitializationParams,
        params: ObjectValues<InitializationParams>
    }>,
    selection: Readonly<{
        fn: keyof SelectionParams,
        params: ObjectValues<SelectionParams>
    }>,
    mutators: Readonly<{
        fn: keyof MutationParams,
        params: ObjectValues<MutationParams>
    }>[]
}>

const defaultSelectedConfig: SelectedConfig = {
    crossover: {
        fn: 'nPoint',
        params: {points: 2},
    },
    encoding: {
        fn: 'binary',
        params: {}
    },
    intitialization: {
        fn: 'randomSamples',
        params: { samples: 100}
    },
    selection: {
        fn: 'nBestSelection',
        params: {
            amount: 50,
            selectionType: 'percentage' 
        }
    },
    mutators: [],
}

type ContextValue = Readonly<{
    config: {
        value: SelectedConfig,
        update: (config: SelectedConfig) => void
    },
    defaults: {
        crossover: typeof crossoverDefaultConfig,
        encoding: typeof encodingDefaultConfig,
        intitialization: typeof initializationDefaultConfig,
        selection: typeof selectionDefaultConfig,
        mutators: typeof mutationDefaultConfig,
    }
}>

const context = createContext<Nullable<ContextValue>>(null)

type Props = Readonly<{
    children: ReactNode;
}>

const GeneticsProvider = ({children}: Props) => {
    const [config, setConfig] = useState<SelectedConfig>(defaultSelectedConfig)

    const defaults = useMemo<ContextValue['defaults']>(() => ({
        crossover: crossoverDefaultConfig,
        encoding: encodingDefaultConfig,
        intitialization: initializationDefaultConfig,
        selection: selectionDefaultConfig,
        mutators: mutationDefaultConfig,
    }), [])

    return <context.Provider value={{
        defaults,
        config: {
            value: config,
            update: setConfig,
        },
    }}>
        {children}
    </context.Provider>
}

export const useGenetics = (): ContextValue => {
    const value = useContext(context);

    if (isNil(value)) {
        throw Error('Used "useSettings" outside of context');
    }

    return value;
}

export default GeneticsProvider;