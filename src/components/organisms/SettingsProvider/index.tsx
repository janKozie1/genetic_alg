import { ReactNode, createContext, useContext, useState } from "react"
import { isNil } from "../../../core/utils/guards";
import { Nullable } from "../../../core/utils/types";
import { Config } from "../../../core/genetics";
import { SelectionAmountTypes } from "../../../core/genetics/selection";

type ExtendedConfig = Config & Readonly<{
    seed: number;
    epochs: number;
    eliteStrategy: number;
    eliteStrategySelectionType: SelectionAmountTypes;
    crossoverOdds: number;
    batches: number;
}>

type ContextValue = Readonly<{
    settings: ExtendedConfig;
    setSettings: (config: ExtendedConfig) => void;
}>

const context = createContext<Nullable<ContextValue>>(null);

type Props = Readonly<{
    children: ReactNode;
}>

const SettingsProvider = ({children}: Props) => {
    const [settings, setSettings] = useState<ExtendedConfig>({ 
        seed: 1, 
        epochs: 100, 
        precision: 6, 
        dimensions: 2, 
        fn: 'styblinskiAndTang', 
        target: [-2.903534, -2.903534], 
        searchRange: { from: -5, to: 5 },
        eliteStrategy: 1,
        eliteStrategySelectionType: 'amount',
        crossoverOdds: 0.8,
        batches: 1,
    })

    return <context.Provider value={{settings, setSettings}}>
        {children}
    </context.Provider>
}

export const useSettings = (): ContextValue => {
    const value = useContext(context);

    if (isNil(value)) {
        throw Error('Used "useSettings" outside of context');
    }

    return value;
}

export default SettingsProvider