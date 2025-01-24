import {
  Button,
  Caption1,
  Card,
  CardFooter,
  CardHeader,
  CardPreview,
  Divider,
  SkeletonItem,
  Text,
} from "@fluentui/react-components";
import {
  DeleteRegular,
  EditRegular,
  SquareMultipleRegular,
} from "@fluentui/react-icons";
import { useState, useEffect, SetStateAction } from "react";
import aiDocIcon from "../assets/ai-doc.png";
import { getAgents, deleteAgent } from "../services/api";
import AddCard from "./AddCard";
import AgentDialog from "./AgentDialog";
import ErrorMessage from "./ErrorMessage";
import CustomDialog from "./CustomDialog";
import useStyles from "../styles/useStyles";


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
  const [agentInFocus, setAgentInFocus] = useState({
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

  const updateAgentList = (newAgent: Agent) => {
    setAgents((prevAgents) => [...prevAgents, newAgent]);
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

  const handleViewAgent = (agent: SetStateAction<{ id: string; name: string; guideline_prompt: string; type: string; }>) => {
    setAgentInFocus(agent);
    setMode("view");
    setShowDialog(true);
  };

  const extractDate = (dateString: string | number | Date | undefined) => {
    const date = new Date(dateString);
    if (!isNaN(date.getTime())) {
      return date.toLocaleDateString();
    } else {
      return "";
    }
  };

  const handleDeleteAgent = (id: SetStateAction<string>) => (e: { stopPropagation: () => void; }) => {
    e.stopPropagation();
    setAgentToBeDeleted(id);
  };

  const handleEditAgent = (id: string) => (e: { stopPropagation: () => void; }) => {
    e.stopPropagation();
    const agentToEdit = agents.find((a) => a.id === id);
    if (agentToEdit) {
      setAgentInFocus(agentToEdit);
    }
    setMode("edit");
    setShowDialog(true);
  };

  const handleDuplicateAgent = (id: string) => (e: { stopPropagation: () => void; }) => {
    e.stopPropagation();
    const agentToDuplicate = agents.find((a) => a.id === id);
    if (agentToDuplicate) {
      setAgentInFocus(agentToDuplicate);
    }
    setMode("duplicate");
    setShowDialog(true);
  };

  const onErrorClose = () => {
    console.log("Error message closed");
  };

  return (
    <div>
      <div className={classes.agentsContainer}>
        {agentLoadError && (
          <ErrorMessage
            title="Error loading agents"
            message={agentLoadError}
            onClose={onErrorClose}
          />
        )}
        <div className={classes.row}>
          <AddCard onClick={handleAddNewAgent} label_text="Add new agent" />
          {agents.length === 0
            ? Array.from({ length: 2 }, (_, i) => (
                <SkeletonItem key={i} className={classes.card} />
              ))
            : agents.map((agent) => (
                <Card
                  onClick={() => {
                    handleViewAgent(agent);
                  }}
                  key={agent.id}
                  className={classes.card}
                >
                  <CardHeader
                    header={<Text weight="semibold">{agent.name}</Text>}
                    description={
                      <Caption1 className={classes.caption}>
                        {agent.updated_at_UTC && agent.updated_at_UTC !== ""
                          ? "Updated: " + extractDate(agent.updated_at_UTC)
                          : "Created: " + extractDate(agent.created_at_UTC)}
                      </Caption1>
                    }
                  />
                  <CardPreview>
                    <Text className={classes.cardbody}>
                      {agent.guideline_prompt}
                    </Text>
                  </CardPreview>
                  <CardFooter>
                    <Button
                      onClick={handleDeleteAgent(agent.id)}
                      icon={<DeleteRegular />}
                    />
                    <Button
                      onClick={handleEditAgent(agent.id)}
                      icon={<EditRegular />}
                    />
                    <Button
                      onClick={handleDuplicateAgent(agent.id)}
                      icon={<SquareMultipleRegular />}
                    />
                  </CardFooter>
                </Card>
              ))}
        </div>
      </div>
      {showDialog && (
        <AgentDialog
          showDialog={showDialog}
          onClose={handleCloseDialog}
          mode={mode}
          agent={agentInFocus}
          updateAgentList={updateAgentList}
        />
      )}
      {agentToBeDeleted !== "" && (
        <CustomDialog
          isOpen={agentToBeDeleted !== ""}
          title={
            "Delete Agent '" +
            agents.find((agent) => agent.id === agentToBeDeleted)?.name +
            "'"
          }
          message="Are you sure you want to delete this agent?"
          onConfirm={() => handleDeleteConfirmation(agentToBeDeleted)}
          onCancel={() => setAgentToBeDeleted("")}
        />
      )}
    </div>
  );
}

export default AgentList;
