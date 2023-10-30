import { css} from '@emotion/react';

const globalStyles = css`
     * {
        box-sizing: border-box;
        font-family: inherit;
        letter-spacing: inherit;
        margin:0;
        padding: 0;
    }

    html,
    body,
    body > #root {
        height: 100%;
        overflow: hidden;
    }

    body > #root {
        display: flex;
        margin-left: auto;
        margin-right: auto;
    }

`

export default globalStyles;