import { ReactNode, createContext, useContext, useMemo } from 'react'
import genetics, { Genetics } from '../../../core/genetics'
import { useSettings } from '../SettingsProvider'
import { Dependencies } from '../../../core/genetics/utils'
import dependencies from '../../../core/genetics/utils'

import {faker} from '@faker-js/faker';
import { isNil } from '../../../core/utils/guards'
import { Nullable } from '../../../core/utils/types'

type ContextValue = Readonly<{
    genetics: Genetics
}>

const context = createContext<Nullable<ContextValue>>(null)

type Props = Readonly<{
    children: ReactNode;
}>

const CoreProvider = ({children}: Props) => {
    const {settings} = useSettings()

    const initializedDependencies = useMemo<Dependencies>(() => {
        if (isNil(settings.seed) || settings.seed <= 0) {
            faker.seed(undefined);
        } else {
            faker.seed(settings.seed)
        }

        return dependencies({ 
            faker,
        })
    }, [settings])

    const contextValue = useMemo<ContextValue>(() =>  ({
        genetics: genetics({dependencies: initializedDependencies, config: settings})
    }) , [initializedDependencies])

    return <context.Provider value={contextValue}>
        {children}
    </context.Provider>
}

export const useCore = () => {
    const value = useContext(context);

    if (isNil(value)) {
        throw Error('Used "useCore" outside of context');
    }

    return value;
}

export default CoreProvider;