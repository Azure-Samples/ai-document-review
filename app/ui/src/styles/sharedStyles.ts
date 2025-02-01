import { makeStyles, tokens } from "@fluentui/react-components";


const flex = {
    gap: '16px',
    display: 'flex'
}

export const sharedStyles = makeStyles({
    row: {
        ...flex,
        flexWrap: 'wrap'
    },
    root: {
        display: 'flex',
        flexDirection: 'column',
        gap: '2px',
        maxWidth: '400px',
        marginTop: '16px'
    },
    card: {
        width: '200px',
        maxWidth: '100%',
        height: '260px'
    },
    bottomLeftButtonContainer: {
        position: 'absolute',
        bottom: '16px',
        right: '16px'
    },
    selected: {
        backgroundColor: tokens.colorNeutralBackground5,
        color: tokens.colorNeutralForeground1,
    },
    container: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        width: '100vw',
    },
    agentsContainer: {
        ...flex,
        flexDirection: 'column',
        maxWidth: '665px',
        margin: '16px',
        color: '#000'
    },
    divider: {
        paddingTop: '10px',
        paddingBottom: '10px',
        maxWidth: '800px',
    },
    closeButton: {
        position: 'absolute',
        top: '10px',
        right: '10px',
        background: 'transparent',
        border: 'none',
        padding: '5px',
        cursor: 'pointer'
    },
    heroImage: {
        margin: '16px',
        padding: '16px',
    },
    caption: {
        color: tokens.colorNeutralForeground3
    },
});