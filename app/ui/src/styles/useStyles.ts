import { makeStyles, tokens } from "@fluentui/react-components";

const flex = {
  gap: '16px',
  display: 'flex'
}

const useStyles = makeStyles({
  messageBar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%'
  },
  root: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    maxWidth: '400px',
    marginTop: '16px'
  },
  applyButton: {
    width: '50%',
    marginTop: '20px',
    alignSelf: 'center'
  },
  inputBox: {
    marginTop: '20px',
    marginBottom: '20px',
    width: '300px'
  },
  cardbody: {
    padding: '12px',
    width: '175px',
    textAlign: 'left',
    display: '-webkit-box',
    WebkitBoxOrient: 'vertical',
    WebkitLineClamp: 3,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    wordBreak: 'break-word',
    maxWidth: '175px',
    maxHeight: '125px'
  },
  promptText: {
    display: '-webkit-box',
    WebkitBoxOrient: 'vertical',
    WebkitLineClamp: 3,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'normal',
    maxWidth: '280px',
    maxHeight: '4.5em'
  },
  addNewIcon: {
    fontSize: '72px',
    color: tokens.colorNeutralForeground3,
    margin: 'auto',
    opacity: 0.5,
    pointerEvents: 'none'
  },
  welcome: {
    margin: '16px',
    color: '#000',
    maxWidth: '800px',
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center'
  },
  card: {
    width: '200px',
    maxWidth: '100%',
    height: '260px'
  },
  caption: { color: tokens.colorNeutralForeground3 },
  title: { color: '#000' },
  largeTextArea: {
    width: '200%',
    height: '250px',
    padding: '8px',
    marginTop: '2px',
    marginBottom: '8px'
  },
  bottomLeftButtonContainer: {
    position: 'absolute',
    bottom: '16px',
    right: '16px'
  },
  errorText: {
    color: 'red',
    marginTop: '8px',
    fontSize: '12px'
  },
  dialogSurface: {
    paddingBottom: '64px',
    minHeight: '625px',
    maxHeight: '90%',
    minWidth: '50px',
    maxWidth: '850px',
    height: '650px',
    width: '850px',
    padding: '20px',
    backgroundColor: tokens.colorNeutralBackground6
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
  addNewAgentCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
    cursor: 'pointer',
    backgroundColor: tokens.colorNeutralBackground2,
    borderRadius: tokens.borderRadiusMedium,
    boxShadow: tokens.shadow4
  },
  addNewAgentIcon: {
    fontSize: '40px',
    marginRight: '10px'
  },
  largeCard: {
    width: '400px',
    maxWidth: '100%',
    height: 'auto',
    padding: '16px'
  },
  smallRadius: { borderRadius: tokens.borderRadiusSmall },
  addIconText: {
    textAlign: 'center', // Ensure text is centered
    fontWeight: tokens.fontWeightSemibold, // Apply semibold weight if needed
  },
  addIcon: {
    fontSize: '72px',
    color: tokens.colorNeutralForeground3,
    margin: 'auto',
    opacity: 0.5,
    pointerEvents: 'none'
  },
  disabledCard: {
    width: '200px',
    maxWidth: '100%',
    height: '260px'
  },
  row: {
    ...flex,
    flexWrap: 'wrap'
  },
  agentsContainer: {
    ...flex,
    flexDirection: 'column',
    maxWidth: '665px',
    margin: '16px',
    color: '#000'
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
