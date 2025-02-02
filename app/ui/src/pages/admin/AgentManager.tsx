import { Divider } from '@fluentui/react-components';
import PageHeader from '../../components/PageHeader';
import AgentList from '../../components/AgentList';
import { sharedStyles } from '../../styles/sharedStyles';


function AgentManager() {
  const sharedClasses = sharedStyles();

  return (
    <div className={sharedClasses.container}>
      {/* Header Section */}
      <PageHeader
        title="Manage Agents"
        description="View and update the AI doc review agents by updating existing agent prompts or by adding
            new ones to enhance your document analysis."
      />
      <Divider className={sharedClasses.divider} />

      {/* Agents List and Add Agent */}
      <div className={sharedClasses.agentsContainer}>
        <AgentList/>
      </div>
    </div>
  );
}

export default AgentManager;
