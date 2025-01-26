import { Divider } from '@fluentui/react-components';
import PageHeader from '../../components/PageHeader';
import AgentList from '../../components/AgentList';
import useStyles from '../../styles/useStyles';

function AgentManager() {
  const classes = useStyles();

  return (
    <div className={classes.container}>
      {/* Header Section */}
      <PageHeader
        title="Manage Agents"
        description="View and update the AI doc review agents by updating existing agent prompts or by adding
            new ones to enhance your document analysis."
      />
      <Divider className={classes.divider} />

      {/* Agents List and Add Agent */}
      <div className={classes.agentsContainer}>
        <AgentList/>
      </div>
    </div>
  );
}

export default AgentManager;
