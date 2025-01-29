import { useState, useEffect } from 'react'
import { SkeletonItem } from '@fluentui/react-components'
import { getAgents, deleteAgent } from '../services/api'
import AddCard from './AddCard'
import AgentDialog from './AgentDialog'
import ErrorMessage from './ErrorMessage'
import CustomDialog from './CustomDialog'
import useStyles from '../styles/useStyles'
import AgentCard from './AgentCard'
import { PromptAgent } from '../types/prompt-agent'

function AgentList() {
  const [agents, setAgents] = useState<PromptAgent[]>([])
  const [showDialog, setShowDialog] = useState(false)
  const [agentInFocus, setAgentInFocus] = useState<PromptAgent>({
    id: '',
    name: '',
    guideline_prompt: '',
    type: ''
  })
  const [agentLoadError, setAgentLoadError] = useState('')
  const [mode, setMode] = useState<'view' | 'add' | 'edit' | 'duplicate'>('view')
  const [agentToBeDeleted, setAgentToBeDeleted] = useState('')

  const classes = useStyles()

  async function fetchAgents() {
    try {
      const data = await getAgents()
      if (data.length === 0) setAgentLoadError('No agents found.')
      setAgents(data)
    } catch {
      setAgentLoadError('There was an issue retrieving agents.')
    }
  }

  useEffect(() => {
    fetchAgents()
  }, [])

  const updateAgentList = async () => {
    await fetchAgents()
  }

  const handleDeleteConfirmation = async (id: string) => {
    try {
      await deleteAgent(id)
      setAgents((prevAgents) => prevAgents.filter((agent) => agent.id !== id))
      setAgentToBeDeleted('')
    } catch (error) {
      console.error('Error deleting agent:', error)
    }
  }

  const handleCloseDialog = () => {
    setAgentInFocus({ id: '', name: '', guideline_prompt: '', type: '' })
    setShowDialog(false)
  }

  const handleAddNewAgent = () => {
    setAgentInFocus({ id: '', name: '', guideline_prompt: '', type: '' })
    setMode('add')
    setShowDialog(true)
  }

  const handleViewAgent = (agent: PromptAgent) => {
    setAgentInFocus(agent)
    setMode('view')
    setShowDialog(true)
  }

  const handleDeleteAgent = (id: string) => {
    setAgentToBeDeleted(id)
  }

  const handleEditAgent = (id: string) => {
    const agentToEdit = agents.find((a) => a.id === id)
    if (agentToEdit) setAgentInFocus(agentToEdit)
    setMode('edit')
    setShowDialog(true)
  }

  const handleDuplicateAgent = (id: string) => {
    const agentToDuplicate = agents.find((a) => a.id === id)
    if (agentToDuplicate) {
      const duplicatedAgent = { ...agentToDuplicate, name: `${agentToDuplicate.name} (copy)` }
      setAgentInFocus(duplicatedAgent)
      setMode('duplicate')
      setShowDialog(true)
    }
  }

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
          setShowDialog={setShowDialog}
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

export default AgentList
