import styled from '@emotion/styled'
import {ReactNode, useState, useEffect, useRef} from 'react';
import Divider from '../../molecules/Divider';
import Box from '@mui/material/Box';
import { useSettings } from '../SettingsProvider';
import { DeepObjectPaths, Literal } from '../../../core/utils/types';
import { get, includes, isArray, isBoolean, isNil, isNumber, partition } from 'lodash';
import {set} from 'lodash/fp';
import { camelCaseToReadableText } from '../../../core/utils/string';
import { SelectedConfig, useGenetics } from '../GeneticsProvider';
import Label from '../../molecules/Label';
import targetFunctions from '../../../core/fn';
import { selectionAmountTypes } from '../../../core/genetics/selection';

const SectionContainer = styled(Box)`
    display: flex;
    flex-direction: column;
    width: max-content;
    position: relative;

    &::after {
        content: '';
        position: absolute;
        height: 100%;
        background: grey;
        width: 1px;
        left: 100%;
        top: 0%;   
        transform: translate(-50%, 5%);
    }
`

const Select = styled.select`
    width: 145px;
`

const Input = styled.input`
    width: 145px;
`

const Container = styled.div`
    width: 100%;
`

type Props = Readonly<{
    children?: ReactNode;
}>

const ConfigForm = ({children}: Props) => {
    const { settings, setSettings } = useSettings();
    const genetics = useGenetics()


    const [variablesAmount, setVariablesAmount] = useState(settings.dimensions)
    
    const [fns, setFns] = useState({
        initialization: genetics.config.value.intitialization.fn,
        crossover: genetics.config.value.crossover.fn,
        encoding: genetics.config.value.encoding.fn,
        selection: genetics.config.value.selection.fn,
    })
    
    const [mutators, setMutators] = useState<typeof genetics['config']['value']['mutators']>([])

    const defaultMutator = fns['encoding'] === 'binary' 
        ? {
            fn: 'random',
            params: {
                odds: 0,
                uniform: false,
            }
        } as const
        : {
            fn: 'uniform',
            params: {
                odds: 0,
                from: 0,
                to: 0,
            }
        } as const

    console.log(mutators)


    const setupSettingsField = <T extends DeepObjectPaths<typeof settings>>(key: T) => {
        return {
            defaultValue: get(settings, key),
            name: key,
        }
    }

    const setupGeneticsField = (key: string) => {
        return {
            defaultValue: get(genetics.config.value, key),
            name: key,
        }
    }

    const onFnChange = (key: keyof typeof fns) => {
        return (e: React.ChangeEvent<HTMLSelectElement>) => {
            const value = e.target.value;

            setFns((fns) => ({
                ...fns,
                [key]: value
            }))
        }
    }

    const onMutatorChange = (index: number) => (e: React.ChangeEvent<HTMLSelectElement>) => {
        setMutators((prev) => {
            const value = e.target.value;
            return prev.map((mutator, i) => i === index ? ({
                ...mutator,
                fn: value as typeof prev[number]['fn']
            }) : mutator)
        })
    }

    const onSubmit = (event: React.FormEvent) => {
        event.preventDefault();

        if (event.target instanceof HTMLFormElement) {
            const data = new FormData(event.target);
            const entries = Array.from(data.entries());

            const [settingsKeys, geneticsConfigKeys] = partition(entries, ([key]) => !isNil(get(settings, key)) || key.includes('target.['));
            const [baseGeneticsConfigKeys, mutatorsConfigKeys] = partition(geneticsConfigKeys, ([key]) => !key.includes('mutator'));

            const newSettings = settingsKeys.reduce<Literal>((acc, [path, value]) => {
                if (/^-?\d+(\.\d+)?$/.test(value.toString())) {
                    return set(path, Number(value), acc)
                } 

                return set(path, value, acc)
            }, {  })

            const newGeneticsConfig = baseGeneticsConfigKeys.reduce<Literal>((acc, [path, value]) => {
                if (/^-?\d+(\.\d+)?$/.test(value.toString())) {
                    return set(path, Number(value), acc)
                } 

                if (value === 'on') {
                    return set(path, true, acc)
                }

                return set(path, value, acc)
            }, {  })

            let mutators: typeof genetics['config']['value']['mutators'] = []

            if (mutatorsConfigKeys.length !== 0) {
                const amount = Math.max(...mutatorsConfigKeys.map(([name]) => parseInt(name.replace(/\D/g, ""))))
                const baseMutatorsConfig: typeof genetics['config']['value']['mutators'] = Array.from({length: amount + 1 }, (_, i) => ({...defaultMutator}));

                mutators = mutatorsConfigKeys.reduce((acc, [path, value]) => {
                    if (value === "on") {
                        return set(path, true, acc)
                    }

                    if (/^\d+(\.\d+)?$/.test(value.toString())) {
                        return set(path, Number(value), acc)
                    } 
    
                    return set(path, value, acc)
                }, {mutator: baseMutatorsConfig}).mutator;
            }

            setSettings(newSettings as typeof settings)
            genetics.config.update({
                ...newGeneticsConfig,
                mutators,
            } as typeof genetics.config.value)
        }
    }

    const fieldValueToInput = (fieldName: string, fieldValueType: number | string[] | unknown, params?: {}, defaultValue?: string) => {
        if (isNumber(fieldValueType)) {
            return <Input step="0.0001" {...params} type="number" name={fieldName} defaultValue={defaultValue ?? fieldValueType} />
        }

        if (isArray(fieldValueType)) {
            return (
                <Select name={fieldName} defaultValue={defaultValue}>
                    {fieldValueType.map((opt) => (
                        <option value={opt} key={opt}>{camelCaseToReadableText(opt)}</option>
                    ))}
                </Select>
            )
        }

        if (isBoolean(fieldValueType)) {
            return <input name={fieldName} type="checkbox" />
        }

        return null;
    }


    const mutatorsPerType = useRef<Record<SelectedConfig['encoding']['fn'], SelectedConfig['mutators'][number]['fn'][]>>({
        binary: ['random', 'inversion', 'edge', 'nPoint'],
        none: ['uniform', 'gauss'],
    })

    const crossoversPerType = useRef<Record<SelectedConfig['encoding']['fn'], SelectedConfig['crossover']['fn'][]>>({
        binary: ['nPoint', 'shuffle', 'uniform', 'discrete'],
        none: ['arithmetic', 'blendA', 'blendAB', 'average', 'flat', 'linear'],
    })

    useEffect(() => {
        setFns((prev) => ({
            ...prev,
            crossover: crossoversPerType.current[fns.encoding][0],
        }))
        setMutators([])
    }, [fns.encoding])


    return (
        <Container>
            <Box p={1}>
                <h3>Main</h3>
            </Box>
            <Divider />
            <form onSubmit={onSubmit}>
                <Box display="flex" gap={1}>
                    <SectionContainer p={1} px={2} gap={2}>
                        <Label label="Seed">
                            <Input type="number" {...setupSettingsField('seed')} />
                        </Label>
                        <Label label="Precision">
                            <Input type="number" {...setupSettingsField('precision')} />
                        </Label>
                        <Label label="Epochs">
                            <Input type="number" {...setupSettingsField('epochs')} />
                        </Label>
                        <Label label="Batches">
                            <Input type="number" {...setupSettingsField('batches')} />
                        </Label>
                    </SectionContainer>
                    <SectionContainer  p={1} px={2} gap={2}>
                        <Label label="Function">
                            <Select {...setupSettingsField('fn')}>
                                {Object.keys(targetFunctions).map((opt) => (
                                    <option value={opt} key={opt}>{camelCaseToReadableText(opt)}</option>
                                ))}
                            </Select>
                        </Label>
                        <Label label="Variables">
                            <Input 
                                type="number" 
                                {...setupSettingsField('dimensions')} 
                                onChange={(e) => {
                                    setVariablesAmount(Number(e.target.value))
                                }} 
                            />
                        </Label>
                        <Label label="Target variables">
                            {Array.from({length: variablesAmount}, (_, i) => (
                                <Box height="max-content" key={i}>
                                    <Input type="number" step={`0.${"0".repeat(settings.precision - 1)}1`} defaultValue={settings.target[i] ?? 0} name={`target.[${i}]`} />
                                </Box>
                            ))}
                        </Label>
                    </SectionContainer> 
                    <SectionContainer  p={1} px={2} gap={2}>
                        <Label label="Search from">
                            <Input type="number" {...setupSettingsField('searchRange.from')} />
                        </Label>
                        <Label label="Search to">
                            <Input type="number" {...setupSettingsField('searchRange.to')} />
                        </Label>
                    </SectionContainer> 
                    <SectionContainer  p={1} px={2} gap={2}>
                        <Label label="Elite strategy">
                            <Input type="number" {...setupSettingsField('eliteStrategy')} />
                        </Label>
                        <Label label="Selection type">
                            <Select {...setupSettingsField('eliteStrategySelectionType')}>
                                {selectionAmountTypes.map((opt) => (
                                    <option value={opt} key={opt}>{camelCaseToReadableText(opt)}</option>
                                ))}
                            </Select>
                        </Label>
                    </SectionContainer> 
                    <SectionContainer  p={1} px={2} gap={2}>
                        <Label label="Crossover odds">
                            <Input type="number" {...setupSettingsField('crossoverOdds')} step="0.01" />
                        </Label>
                    </SectionContainer> 
                </Box>
                <Box mt={3}></Box>
                <Box p={1}>
                    <h3>Genetics</h3>
                </Box>
                <Divider />
                <Box display="flex" gap={1} pt={1}>
                    <SectionContainer p={1} px={2} gap={2}>
                        <Label label="Initialization">
                            <Select {...setupGeneticsField('intitialization.fn')} onChange={onFnChange('initialization')}>
                                {Object.keys(genetics.defaults.intitialization).map((opt) => (
                                    <option value={opt} key={opt}>{camelCaseToReadableText(opt)}</option>
                                ))}
                            </Select>
                        </Label>
                        {Object.entries(genetics.defaults.intitialization[fns.initialization]).map(([fieldName, fieldValue]) => {
                            const path = `intitialization.params.${fieldName}`
                            return (
                                <Label key={fieldName} label={camelCaseToReadableText(fieldName)}>
                                    {fieldValueToInput(path, fieldValue, {}, get( genetics.config.value, path))}
                                </Label>
                            )
                        })}
                    </SectionContainer>
                    <SectionContainer p={1} px={2} gap={2}>
                        <Label label="Selection">
                            <Select {...setupGeneticsField('selection.fn')} onChange={onFnChange('selection')}>
                                {Object.keys(genetics.defaults.selection).map((opt) => (
                                    <option value={opt} key={opt}>{camelCaseToReadableText(opt)}</option>
                                ))}
                            </Select>
                        </Label>
                        {Object.entries(genetics.defaults.selection[fns.selection]).map(([fieldName, fieldValue]) => {
                            const path = `selection.params.${fieldName}`
                            return (
                                <Label key={fieldName} label={camelCaseToReadableText(fieldName)}>
                                    {fieldValueToInput(path, fieldValue, {}, get( genetics.config.value, path))}
                                </Label>
                            )
                        })}
                    </SectionContainer>
                    <SectionContainer p={1} px={2} gap={2}>
                        <Label label="Encoding">
                            <Select {...setupGeneticsField('encoding.fn')} onChange={onFnChange('encoding')}>
                                {Object.keys(genetics.defaults.encoding).map((opt) => (
                                    <option value={opt} key={opt}>{camelCaseToReadableText(opt)}</option>
                                ))}
                            </Select>
                        </Label>
                        {Object.entries(genetics.defaults.encoding[fns.encoding]).map(([fieldName, fieldValue]) => {
                            const path = `encoding.params.${fieldName}`;
                            return (
                                <Label key={fieldName} label={camelCaseToReadableText(fieldName)}>
                                    {fieldValueToInput(path, fieldValue, {}, get( genetics.config.value, path))}
                                </Label>
                            )
                        })}
                    </SectionContainer>
                    <SectionContainer p={1} px={2} gap={2}>
                        <Label label="Crossover">
                            <Select {...setupGeneticsField('crossover.fn')} onChange={onFnChange('crossover')}>
                                {crossoversPerType.current[fns.encoding].map((opt) => (
                                    <option value={opt} key={opt}>{camelCaseToReadableText(opt)}</option>
                                ))}
                            </Select>
                        </Label>
                        {Object.entries(genetics.defaults.crossover[fns.crossover]).map(([fieldName, fieldValue]) => {
                            const path = `crossover.params.${fieldName}`
                            return (
                                <Label inline={isBoolean(fieldValue)} key={fieldName} label={camelCaseToReadableText(fieldName)}>
                                    {fieldValueToInput(path, fieldValue, {}, get( genetics.config.value, path))}
                                </Label>
                            )
                        })}
                    </SectionContainer>
                    <SectionContainer p={1} px={2} gap={2}>
                        <Label label="Mutators">
                            <Input 
                                type="number"
                                value={mutators.length}
                                onChange={(e) => {
                                    const newAmount = Number(e.target.value);

                                    setMutators((prev) => {
                                        if (prev.length < newAmount) {
                                            return [...prev, {
                                               ...defaultMutator,
                                            }] as typeof prev;
                                        }

                                        return prev.slice(0, newAmount)
                                    })
                                }} 
                            />
                        </Label>
                        <Box display="flex" gap={3}>
                            {Array.from({length: mutators.length}, (_, i) => (
                                <Box key={i} display="flex" flexDirection="column">
                                    <Label label={`Mutator #${i + 1}`}>
                                        <Select value={mutators[i].fn} name={`mutator.[${i}].fn`} onChange={onMutatorChange(i)}>
                                            {mutatorsPerType.current[fns.encoding].map((opt) => (
                                                <option value={opt} key={opt}>{camelCaseToReadableText(opt)}</option>
                                            ))}
                                        </Select>
                                    </Label>
                                    {Object.entries(genetics.defaults.mutators[mutators[i].fn]).map(([fieldName, fieldValue]) => {
                                        return (
                                            <Label inline={isBoolean(fieldValue)} key={fieldName} label={camelCaseToReadableText(fieldName)}>
                                                {fieldValueToInput(`mutator.[${i}].params.${fieldName}`, fieldValue, fieldName === 'odds' ? { step: "0.01"} : undefined)}
                                            </Label>
                                        )
                                    })}
                                </Box>
                            ))}
                        </Box>
                    </SectionContainer>
                </Box>
                <Box mt={3}></Box>
                <Divider />
                <Box p={2} pt={2.5} display="flex">
                    <button>
                        <Box px={2}>
                            Save & Run
                        </Box>
                    </button>
                    {children}
                </Box>
            </form>
        </Container>
    )
}

export default ConfigForm;