import { useEffect, useState, useRef, useMemo } from 'react'

import { useCore } from "../CoreProvider"
import { useSettings } from "../SettingsProvider";
import ConfigForm from '../ConfigForm';
import { useGenetics } from '../GeneticsProvider';
import { Box } from '@mui/material';
import useSelfUpdatingRef from '../../../core/hooks/useSelfUpdatingRef';
import { add, isNil, orderBy } from 'lodash';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import styled from '@emotion/styled';
import Divider from '../../molecules/Divider';
import ChartTooltip from '../../molecules/ChartTooltip';
import { faker } from '@faker-js/faker';
import { avg, withPrecision } from '../../../core/utils/math';

const getColor = (index: number) => {
    const colors = [
        "#ea5545", 
        "#87bc45", 
        "#ede15b", 
        "#f46a9b", 
        "#bdcf32", 
        "#edbf33", 
        "#ef9b20", 
        "#27aeef", 
        "#b33dc6",
        "#e60049", 
        "#0bb4ff", 
        "#50e991", 
        "#e6d800", 
        "#9b19f5", 
        "#ffa300", 
        "#dc0ab4", 
        "#b3d4ff", 
        "#00bfa0"
    ]

    return colors[index % colors.length]
}

const ChartsGrid = styled.div<{chartSize: number}>`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 5rem; 
  width: 100%;
  padding-right: 48px;
`

const getBatchName = (index: number) => `Batch #${index + 1}`

export type Analytics = Readonly<{
    bestResult: number,
    stdDev: number,
    avg: number,
}>

const analyticsKeys: (keyof Analytics)[] = ['avg', 'bestResult', 'stdDev']


const Main = () => {
    const core = useCore();
    const { settings } = useSettings();
    const genetics = useGenetics();
    

    const [steps, setSteps] = useState<number[][][][]>([])
    const [analytics, setAnalytics] = useState<Analytics[][]>([])
    const [progress, setProgress] = useState({
        running: false,
        batch: 0,
    })

    const [times, setTimes] = useState({
        epoch: [] as number [],
        batch: [] as number [],
    })

    const initialRenderRef = useRef(true);
    const analyticsSeries = useMemo(() => {
        if (analytics.length === 0) {
            return null;
        }

        return Object.fromEntries(analyticsKeys.map((field) => [
            field, 
            analytics[0].map((_, epochIndex) => ({
                epoch: epochIndex,
                ...(Object.fromEntries(Array.from({length: settings.batches}, (_, batchIndex) => [
                    getBatchName(batchIndex), analytics[batchIndex][epochIndex][field]
                ])))
            }))
        ]))
    }, [analytics])

    const calculateAnalytics = (variablesSet: number[][]): Analytics => {
        const evaluated = orderBy(variablesSet.map(core.genetics.evaluation.standard), ['value'], ['asc']);
        const justValues = evaluated.map((e) => e.value);

        const total = justValues.reduce(add, 0);
        const n = evaluated.length;
        const mean = evaluated.length % 2 === 1 
            ? justValues[Math.floor(justValues.length / 2)] 
            : (justValues[justValues.length / 2] + justValues[(justValues.length / 2) + 1]) / 2
        
        const stdDev = Math.sqrt((1 / n) * justValues.map((value) => (value - mean) ** 2).reduce(add, 0))
        
        return {
            avg: total / evaluated.length,
            bestResult: justValues[0],
            stdDev,
        }
    }

    const downloadJSON = () => {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({
            settings,
            genetics: genetics.config.value,
            steps: steps,
        }, null, 4));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href",     dataStr);
        downloadAnchorNode.setAttribute("download", "epochs.json");
        document.body.appendChild(downloadAnchorNode); // required for firefox
        downloadAnchorNode.click();
        downloadAnchorNode.remove()
    }

    const runAllEpochs = () => {
        if (isNil(settings.seed) || settings.seed <= 0) {
            faker.seed(undefined);
        } else {
            faker.seed(settings.seed)
        }
        
        const initialStep = core.genetics.initialization[genetics.config.value.intitialization.fn](genetics.config.value.intitialization.params)

        const variablesBase = [initialStep];
        const analyticsBase = [calculateAnalytics(initialStep)];
        const times = []

        for (let i = 0; i < settings.epochs; i++) {
            const startTime = Date.now()

            const prevVariables = variablesBase[variablesBase.length - 1];
            const newVariables = core.genetics.epoch.standard({
                fn: settings.fn,
                target: settings.target,
                prevVariables,
                fns: {
                    evaluate: core.genetics.evaluation.standard,
                    encode: core.genetics.encoding[genetics.config.value.encoding.fn].encode as any,
                    decode: core.genetics.encoding[genetics.config.value.encoding.fn].decode as any,
                    crossover: core.genetics.crossover[genetics.config.value.crossover.fn](genetics.config.value.crossover.params as any) as any,
                    select: core.genetics.selection[genetics.config.value.selection.fn](genetics.config.value.selection.params as any),
                    mutators: genetics.config.value.mutators.map((mutator) => ({
                        fn: core.genetics.mutation[mutator.fn](mutator.params as any)
                    })) as any
                },
                opts: {
                    eliteStrategy: {
                        amount: settings.eliteStrategy,
                        type: settings.eliteStrategySelectionType,
                    },
                    odds: {
                        crossover: settings.crossoverOdds
                    }
                }
            }).newVariables;

            variablesBase.push(newVariables);
            analyticsBase.push(calculateAnalytics(newVariables));

            const endTime = Date.now();

            times.push(endTime - startTime);
        }

        return { steps: variablesBase, analytics: analyticsBase, times }
    }

    const runAllBatches = useSelfUpdatingRef(() => {
        setProgress({ running: true, batch: 1})
        setTimes({batch: [], epoch: []})
        
        const allSteps: typeof steps = []
        const allAnalytics: typeof analytics = []

        const recurse = (batch: number) => {
            if (batch === settings.batches) {
                setSteps(allSteps)
                setAnalytics(allAnalytics)
                setProgress({running: false, batch: 0})
            } else {
                setProgress({ running: true, batch: batch + 1})

                setTimeout(() => {
                    const startTime = Date.now()

                    const {analytics, steps, times: epochTimes} = runAllEpochs();
                    allSteps.push(steps);
                    allAnalytics.push(analytics);

                    const endTime = Date.now()

                    setTimes((times) => ({
                        epoch: [...times.epoch, ...epochTimes],
                        batch: [...times.batch, endTime - startTime]
                    }))
                    recurse(batch + 1)
                }, 10)
            }
        } 

       recurse(0)
    })

    useEffect(() => {
        if (!initialRenderRef.current) {
            runAllBatches.current();
        } else {
            initialRenderRef.current = false;
        }
    }, [genetics.config.value, settings])

    const labels: Record<keyof Analytics, string> = {
        avg: 'Average',
        bestResult: 'Best result',
        stdDev: 'Standard deviation '
    }

    const chartSize =  800;
    

    return (
        <Box display="flex" flexDirection="column" overflow="auto" width="100%" pb={10}>
            <ConfigForm>
                {progress.running && (
                    <Box ml={2}>
                        <p>Running batch {progress.batch} / {settings.batches}... </p>
                    </Box>
                )}
                {!progress.running && (times.batch.length !== 0) && (
                    <Box ml={2}>
                        <p>Batch avg: {withPrecision(avg(times.batch) / 1000, settings.precision)}s, Epoch avg: {withPrecision(avg(times.epoch) / 1000, settings.precision)}s</p>
                    </Box>
                )}
            </ConfigForm>
            {steps.length !== 0 && (
                <Box ml={2}>
                    <button onClick={downloadJSON} role="button">
                        <Box px={2}>
                            Download epochs as JSON
                        </Box>
                    </button>
                </Box>
            )}
            {analytics.length !== 0 && !isNil(analyticsSeries) && (
                <Box mt={2}>
                     <Box p={1}>
                        <h3>Results</h3>
                    </Box>
                    <Divider />
                    <Box pt={4}>
                        <ChartsGrid chartSize={chartSize}>
                            {analyticsKeys.map((key) => (
                                <Box key={key} width="max-content" display="flex" flexDirection="column" alignItems="center" gap={2}>
                                    <p>{labels[key]}</p>
                                    <LineChart width={chartSize} key={key} height={chartSize / 2} data={analyticsSeries[key]}>
                                        <XAxis dataKey="epoch" />
                                        <YAxis />
                                        <Tooltip content={<ChartTooltip />}/>
                                        <CartesianGrid stroke="#eee" strokeDasharray="5 5"/>
                                        {Array.from({length: settings.batches}, (_, i) => (
                                            <Line dot={false} type="monotone" key={getBatchName(i)} dataKey={getBatchName(i)} stroke={getColor(i)} />
                                        ))}
                                    </LineChart>
                                </Box>
                              
                            ))}
                        </ChartsGrid>
                    </Box>
                 
                </Box>

            )}
        </Box>
    )
}

export default Main;