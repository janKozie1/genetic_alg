import styled from '@emotion/styled';
import Box from '@mui/material/Box'
import { ReactElement, ReactNode } from 'react';


const Container = styled.label<{inline: boolean}>`
    display: flex;
    flex-direction: ${({inline}) => inline ? 'row-reverse' : 'column'};
    align-items: ${({inline}) => inline ? 'center' : null};
    justify-content: ${({inline}) => inline ? 'flex-end' : null};
`

type Props = Readonly<{
    label: string;
    children: ReactNode;
    inline?: boolean;
}>

const Label = ({label, children, inline = false}: Props) => (
    <Container inline={inline}>
        <Box p={1} pr={2}><p>{label}</p></Box>
        <Box height="max-content">
            {children}
        </Box>                    
    </Container>
);

export default Label;