import { makeStyles, tokens } from "@fluentui/react-components";

// Define common styles
const useStyles = makeStyles({
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
  divider: {
    paddingTop: '10px',
    paddingBottom: '10px',
    maxWidth: '800px',
  },
  heroImage: {
    margin: '16px',
    padding: '16px',
  },
  headerContent: {
    margin: '16px',
    color: '#000',
    maxWidth: '800px',
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default useStyles;
