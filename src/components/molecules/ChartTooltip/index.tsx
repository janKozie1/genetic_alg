import styled from "@emotion/styled";
import { Analytics } from "../../organisms/Main";
import { Box } from "@mui/material";
import { withPrecision } from "../../../core/utils/math";
import { useSettings } from "../../organisms/SettingsProvider";

const Container = styled(Box)`
    background-color: white;
    border: 1px solid grey;
`

type PayloadType = Readonly<{
    payload: Analytics
    dataKey: keyof Analytics;
    color: string;
}>

type Props = Readonly<{
    active?: boolean;
    label?: string;
    payload?: PayloadType[]
}>

const ChartTooltip = ({active, payload, label}: Props) => {
    const {settings} = useSettings()


    if (active && payload && payload.length !== 0) {
        return (
          <Container p={1}>
            <p className="intro"><b>Epoch: {label}</b></p>
            {payload.map((entry) => (
              <p style={{color: entry.color}} key={entry.dataKey}>{entry.dataKey}: {withPrecision(entry.payload[entry.dataKey], settings.precision)}</p>
            ))}
          </Container>
        );
      }
    
      return null;
}

export default ChartTooltip;