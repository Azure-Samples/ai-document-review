// AgentCard.tsx
import React from "react";
import {
  Card,
  CardFooter,
  CardHeader,
  CardPreview,
  Button,
  Caption1,
  Text,
  Tooltip,
} from "@fluentui/react-components";
import {
  DeleteRegular,
  EditRegular,
  SquareMultipleRegular,
} from "@fluentui/react-icons";

interface Agent {
  id: string;
  name: string;
  guideline_prompt: string;
  type: string;
  created_at_UTC?: string;
  updated_at_UTC?: string;
}

interface AgentCardProps {
  agent: Agent;
  classes: any;
  onViewAgent: (agent: Agent) => void;
  onDeleteAgent: (id: string) => void;
  onEditAgent: (id: string) => void;
  onDuplicateAgent: (id: string) => void;
}

const AgentCard: React.FC<AgentCardProps> = ({
  agent,
  classes,
  onViewAgent,
  onDeleteAgent,
  onEditAgent,
  onDuplicateAgent,
}) => {

  const extractDate = (dateString: string | number | Date | undefined) => {
    const date = new Date(dateString || "");
    return !isNaN(date.getTime()) ? date.toLocaleDateString() : "";
  };

  return (
    <Card onClick={() => onViewAgent(agent)} key={agent.id} className={classes.card}>
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
        <Text className={classes.cardbody}>{agent.guideline_prompt}</Text>
      </CardPreview>
      <CardFooter style={{ marginTop: "auto", display: "flex", justifyContent: "flex-end", gap: "8" }}>
        <Tooltip content="Delete Agent" relationship="label">
          <Button onClick={(e) => { e.stopPropagation(); onDeleteAgent(agent.id); }} icon={<DeleteRegular />} />
        </Tooltip>
        <Tooltip content="Edit Agent" relationship="label">
          <Button onClick={(e) => { e.stopPropagation(); onEditAgent(agent.id); }} icon={<EditRegular />} />
        </Tooltip>
        <Tooltip content="Duplicate Agent" relationship="label">
          <Button onClick={(e) => { e.stopPropagation(); onDuplicateAgent(agent.id); }} icon={<SquareMultipleRegular />} />
        </Tooltip>
      </CardFooter>
    </Card>
  );
};

export default AgentCard;
