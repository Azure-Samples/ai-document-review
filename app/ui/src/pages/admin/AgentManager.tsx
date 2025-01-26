import { useState, useEffect } from 'react';
import { Divider } from '@fluentui/react-components';
import PageHeader from '../../components/PageHeader';
import AgentList from '../../components/AgentList';
import AgentDialog from '../../components/AgentDialog';
import CustomDialog from '../../components/CustomDialog';
import useStyles from '../../styles/useStyles';
import { getAgents, deleteAgent } from '../../services/api';

function AgentManager() {
  const classes = useStyles();

  const [agents, setAgents] = useState([]);
  const [showDialog, setShowDialog] = useState(false);
  const [agentInFocus, setAgentInFocus] = useState({id: '', name: '', guideline_prompt: '', type: ''});
  const [mode, setMode] = useState<'view' | 'edit' | 'add' | 'duplicate'>('view');
  const [agentToBeDeleted, setAgentToBeDeleted] = useState('');

  useEffect(() => {
    async function fetchAgents() {
      try {
        const data = await getAgents();
        setAgents(data);
      } catch (error) {
        console.error('Error fetching agents:', error);
      }
    }
    fetchAgents();
  }, []);

  // Handlers
  const handleAddNewAgent = () => {
    setAgentInFocus({ id: '', name: '', guideline_prompt: '', type: '' });
    setMode('add');
    setShowDialog(true);
  };

  const handleCloseDialog = () => {
    setAgentInFocus({ id: '', name: '', guideline_prompt: '', type: '' });
    setShowDialog(false);
  };

  const handleViewAgent = (agent) => {
    setAgentInFocus(agent);
    setMode('view');
    setShowDialog(true);
  };

  const handleEditAgent = (e, id) => {
    e.stopPropagation();
    const agent = agents.find((a) => a.id === id);
    if (agent) {
      setAgentInFocus(agent);
      setMode('edit');
      setShowDialog(true);
    }
  };

  const handleDuplicateAgent = (e, id) => {
    e.stopPropagation();
    const agent = agents.find((a) => a.id === id);
    if (agent) {
      setAgentInFocus(agent);
      setMode('duplicate');
      setShowDialog(true);
    }
  };

  const handleDeleteAgent = (e, id) => {
    e.stopPropagation();
    setAgentToBeDeleted(id);
  };

  const handleDeleteConfirmation = async () => {
    try {
      await deleteAgent(agentToBeDeleted);
      setAgents((prevAgents) => prevAgents.filter((agent) => agent.id !== agentToBeDeleted));
      setAgentToBeDeleted('');
    } catch (error) {
      console.error('Error deleting agent:', error);
    }
  };

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
        <AgentList
          agents={agents}
          onViewAgent={handleViewAgent}
          onDeleteAgent={handleDeleteAgent}
          onEditAgent={handleEditAgent}
          onDuplicateAgent={handleDuplicateAgent}
        />
      </div>
    </div>
  );
}

export default AgentManager;
