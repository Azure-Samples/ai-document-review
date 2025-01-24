import React from "react";
import {
  Card,
  CardHeader,
  CardPreview,
  CardFooter,
  Text,
  Caption1,
  Button,
} from "@fluentui/react-components";
import {
  DeleteRegular,
  EditRegular,
  SquareMultipleRegular,
} from "@fluentui/react-icons";
import useStyles from "../styles/useStyles";

interface Agent {
  id: string;
  name: string;
  updated_at_UTC?: string;
  created_at_UTC: string;
  guideline_prompt: string;
}

const AgentCardItem = ({
  agent,
  onViewAgent,
  onDeleteAgent,
  onEditAgent,
  onDuplicateAgent,
}: {
  agent: Agent;
  onViewAgent: (agent: Agent) => void;
  onDeleteAgent: (e: React.MouseEvent, id: string) => void;
  onEditAgent: (e: React.MouseEvent, id: string) => void;
  onDuplicateAgent: (e: React.MouseEvent, id: string) => void;
}) => {
  const classes = useStyles();

  const extractDate = (dateString: string) => {
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? "" : date.toLocaleDateString();
  };

  return (
    <Card className={classes.card} onClick={() => onViewAgent(agent)}>
      <CardHeader
        header={<Text weight="semibold">{agent.name}</Text>}
        description={
          <Caption1 className={classes.caption}>
            {agent.updated_at_UTC
              ? "Updated: " + extractDate(agent.updated_at_UTC)
              : "Created: " + extractDate(agent.created_at_UTC)}
          </Caption1>
        }
      />
      <CardPreview>
        <Text className={classes.cardbody}>{agent.guideline_prompt}</Text>
      </CardPreview>
      <CardFooter className={classes.footer}>
        <Button onClick={(e) => onDeleteAgent(e, agent.id)} icon={<DeleteRegular />} />
        <Button onClick={(e) => onEditAgent(e, agent.id)} icon={<EditRegular />} />
        <Button onClick={(e) => onDuplicateAgent(e, agent.id)} icon={<SquareMultipleRegular />} />
      </CardFooter>
    </Card>
  );
};

export default AgentCardItem;
