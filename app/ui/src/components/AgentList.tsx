import { useState, useEffect } from "react";
import { SkeletonItem } from "@fluentui/react-components";
import { getAgents, deleteAgent } from "../services/api";
import AddCard from "./AddCard";
import AgentDialog from "./AgentDialog";
import ErrorMessage from "./ErrorMessage";
import CustomDialog from "./CustomDialog";
import useStyles from "../styles/useStyles";
import AgentCard from "./AgentCard";

function AgentList() {
  interface Agent {
    id: string;
    name: string;
    guideline_prompt: string;
    type: string;
    created_at_UTC?: string;
    updated_at_UTC?: string;
  }

  const [agents, setAgents] = useState<Agent[]>([]);
  const [showDialog, setShowDialog] = useState(false);
  const [agentInFocus, setAgentInFocus] = useState<Agent>({
    id: "",
    name: "",
    guideline_prompt: "",
    type: "",
  });
  const [agentLoadError, setAgentLoadError] = useState("");
  const [mode, setMode] = useState<"view" | "add" | "edit" | "duplicate">("view");
  const [agentToBeDeleted, setAgentToBeDeleted] = useState("");

  const classes = useStyles();

  useEffect(() => {
    async function fetchAgents() {
      try {
        const data = await getAgents();
        if (data.length === 0) setAgentLoadError("No agents found.");
        setAgents(data);
      } catch {
        setAgentLoadError("There was an issue retrieving agents.");
      }
    }
    fetchAgents();
  }, []);

  const updateAgentList = () => {
    setAgents([])
  };

  const handleDeleteConfirmation = async (id: string) => {
    try {
      await deleteAgent(id);
      setAgents((prevAgents) => prevAgents.filter((agent) => agent.id !== id));
      setAgentToBeDeleted("");
    } catch (error) {
      console.error("Error deleting agent:", error);
    }
  };

  const handleCloseDialog = () => {
    setAgentInFocus({ id: "", name: "", guideline_prompt: "", type: "" });
    setShowDialog(false);
  };

  const handleAddNewAgent = () => {
    setAgentInFocus({ id: "", name: "", guideline_prompt: "", type: "" });
    setMode("add");
    setShowDialog(true);
  };

  const handleViewAgent = (agent: Agent) => {
    setAgentInFocus(agent);
    setMode("view");
    setShowDialog(true);
  };

  const handleDeleteAgent = (id: string) => {
    setAgentToBeDeleted(id);
  };

  const handleEditAgent = (id: string) => {
    const agentToEdit = agents.find((a) => a.id === id);
    if (agentToEdit) setAgentInFocus(agentToEdit);
    setMode("edit");
    setShowDialog(true);
  };

  const handleDuplicateAgent = (id: string) => {
    const agentToDuplicate = agents.find((a) => a.id === id);
    agentInFocus.name = `${agentInFocus.name} (copy)`;
    if (agentToDuplicate) setAgentInFocus(agentToDuplicate);
    setMode("duplicate");
    setShowDialog(true);
  };

  return (
    <div>
      <div className={classes.agentsContainer}>
        {agentLoadError && (
          <ErrorMessage
            title="Error loading agents"
            message={agentLoadError}
            onClose={() => setAgentLoadError('')}
          />
        )}
        <div className={classes.row}>
          <AddCard onClick={handleAddNewAgent} labelText="Add new agent" />
          {agents.length === 0
            ? Array.from({ length: 2 }, (_, i) => <SkeletonItem key={i} className={classes.card} />)
            : agents.map((agent) => (
                <AgentCard
                  key={agent.id}
                  agent={agent}
                  classes={classes}
                  onViewAgent={handleViewAgent}
                  onDeleteAgent={handleDeleteAgent}
                  onEditAgent={handleEditAgent}
                  onDuplicateAgent={handleDuplicateAgent}
                />
              ))}
        </div>
      </div>
      {showDialog && (
        <AgentDialog
          agentId={agentInFocus.id}
          handleCloseDialog={handleCloseDialog}
          selectedAgent={agentInFocus}
          showDialog={showDialog}
          mode={mode}
          updateAgentList={updateAgentList}
        />
      )}
      {agentToBeDeleted && (
        <CustomDialog
          isOpen={!!agentToBeDeleted}
          title={`Delete Agent '${agents.find((a) => a.id === agentToBeDeleted)?.name}'`}
          message="Are you sure you want to delete this agent?"
          onConfirm={() => handleDeleteConfirmation(agentToBeDeleted)}
          onCancel={() => setAgentToBeDeleted('')}
        />
      )}
    </div>
  )
}

export default AgentList;
