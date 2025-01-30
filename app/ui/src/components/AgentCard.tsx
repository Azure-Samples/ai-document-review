import React from 'react'
import {
  Card,
  CardFooter,
  CardHeader,
  CardPreview,
  Button,
  Caption1,
  Text,
  Tooltip,
  makeStyles
} from '@fluentui/react-components'
import { DeleteRegular, SquareMultipleRegular } from '@fluentui/react-icons'
import { PromptAgent } from '../types/prompt-agent'
import { sharedStyles } from '../styles/sharedStyles'


const componentSyles = makeStyles({
  cardHeaderTitle: {
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    maxWidth: '165px',
  },
  cardFooter: {
    marginTop: "auto",
    display: "flex",
    justifyContent: "flex-end",
    gap: "8px"
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
  }
})

interface AgentCardProps {
  agent: PromptAgent
  onViewAgent: (agent: PromptAgent) => void
  onDeleteAgent: (id: string) => void
  onEditAgent: (id: string) => void
  onDuplicateAgent: (id: string) => void
}

const AgentCard: React.FC<AgentCardProps> = ({
  agent,
  onViewAgent,
  onDeleteAgent,
  onDuplicateAgent
}) => {
  const extractDate = (dateString: string | number | Date | undefined) => {
    const date = new Date(dateString || '')
    return !isNaN(date.getTime()) ? date.toLocaleDateString() : 'Date not available'
  }

  const componentClasses = componentSyles()
  const sharedClasses = sharedStyles()
  const safeOnViewAgent = onViewAgent || (() => {})
  const safeOnDeleteAgent = onDeleteAgent || (() => {})
  const safeOnDuplicateAgent = onDuplicateAgent || (() => {})

  return (
    <Card onClick={() => safeOnViewAgent(agent)} key={agent.id} className={sharedClasses.card}>
      <CardHeader
        header={
          <Text weight="semibold" className={componentClasses.cardHeaderTitle}>
            {agent.name}
          </Text>
        }
        description={
          <Caption1 className={sharedClasses.caption}>
            {agent.updated_at_UTC
              ? `Updated: ${extractDate(agent.updated_at_UTC)}`
              : `Created: ${extractDate(agent.created_at_UTC)}`}
          </Caption1>
        }
      />
      <CardPreview>
        <Text className={componentClasses.cardbody}>{agent.guideline_prompt}</Text>
      </CardPreview>
      <CardFooter className={componentClasses.cardFooter}>
        <Tooltip content="Delete Agent" relationship="label">
          <Button
            onClick={(e) => {
              e.stopPropagation()
              safeOnDeleteAgent(agent.id)
            }}
            icon={<DeleteRegular />}
            aria-label="Delete Agent"
          />
        </Tooltip>
        <Tooltip content="Duplicate Agent" relationship="label">
          <Button
            onClick={(e) => {
              e.stopPropagation()
              safeOnDuplicateAgent(agent.id)
            }}
            icon={<SquareMultipleRegular />}
            aria-label="Duplicate Agent"
          />
        </Tooltip>
      </CardFooter>
    </Card>
  )
}

export default AgentCard
