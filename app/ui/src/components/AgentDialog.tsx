import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogSurface,
  DialogBody,
  DialogTitle,
  Button,
  DialogContent,
  Input,
  Textarea,
  Label,
  Divider,
  DialogActions,
  Field,
  Spinner
} from '@fluentui/react-components'
import { DismissRegular, SaveRegular } from '@fluentui/react-icons'
import { addAgent, updateAgent } from '../services/api'
import ErrorMessage from './ErrorMessage'
import useStyles from '../styles/useStyles'

interface AgentDialogProps {
  agent_id: string
  handleCloseDialog: () => void
  selectedAgent: { id: string;  type: string; name: string; guideline_prompt: string }
  showDialog: boolean
  setShowDialog: (open: boolean) => void
  mode: 'view' | 'edit' | 'add' | 'duplicate'
  updateAgentList?: (
    agents: { id: string; type: string; name: string; guideline_prompt: string }[]
  ) => void
}

const AgentDialog: React.FC<AgentDialogProps> = ({
  agent_id,
  handleCloseDialog,
  selectedAgent,
  showDialog,
  setShowDialog,
  mode,
  updateAgentList
}) => {
  const [localAgent, setLocalAgent] = useState(selectedAgent)
  const [localAgentId, setLocalAgentId] = useState(agent_id)
  const [nameInputError, setNameInputError] = useState('')
  const [typeInputError, setTypeInputError] = useState('')
  const [promptInputError, setPromptInputError] = useState('')
  const [hasError, setHasError] = useState(true)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [isReadOnly, setIsReadOnly] = useState(mode === 'view')
  const [localMode, setLocalMode] = useState(mode)

  const classes = useStyles()

  useEffect(() => {
    setIsReadOnly(mode === 'view')
  }, [localMode, mode])

  useEffect(() => {
    setHasError(!!nameInputError || !!typeInputError || !!promptInputError)
  }, [nameInputError, typeInputError, promptInputError])

  useEffect(() => {
    if (showDialog) {
      setLocalAgentId(agent_id)
      setLocalAgent(selectedAgent)
    }
  }, [showDialog, selectedAgent, agent_id])

  const handleInputChange =
    (field: 'name' | 'type' | 'guideline_prompt') =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const value = event.target.value
      setLocalAgent((prev) => ({
        ...prev,
        [field]: value
      }))

      // Validate input immediately
      const error = hasErrorInInput(value, field === 'guideline_prompt' ? 5000 : 50)
      if (field === 'name') setNameInputError(error)
      if (field === 'type') setTypeInputError(error)
      if (field === 'guideline_prompt') setPromptInputError(error)
    }

  const hasErrorInInput = (inputValue: string | undefined, limit: number) => {
    if (!inputValue || !inputValue.trim()) {
      console.log('inputValue:', inputValue)
      return 'is required.'
    }

    if (inputValue.length > limit) {
      return `cannot exceed ${limit} characters.`
    }

    const specialCharPattern = /[[],\\.!?:"'-()_$£]/

    if (specialCharPattern.test(inputValue)) {
      return 'cannot contain special characters.'
    }

    return ''
  }

  const callApi = async (
    id: string,
    agent: { name: string; guideline_prompt: string; type: string }
  ) => {
    if (mode === 'add' || mode === 'duplicate') {
      return addAgent(agent)
    } else {
      return updateAgent(id, agent)
    }
  }

  const handleSave = async () => {
    setLoading(true)
    setNameInputError(hasErrorInInput(localAgent.name, 50))
    setTypeInputError(hasErrorInInput(localAgent.type, 50))
    setPromptInputError(hasErrorInInput(localAgent.guideline_prompt, 5000))

    if (!hasError && !!localAgent.name && !!localAgent.type && !!localAgent.guideline_prompt) {
      try {
        const response = await callApi(localAgentId, localAgent)
        console.log('Agent added successfully:', response)
        if (response && response !== 'Error' && updateAgentList) {
          // updateAgentList(response)
          handleCloseDialog()
          setLoading(false)
          // TODO: remove this and fix updateAgentList
          window.location.reload()
          return
        }
        setError('Error while saving the agent.')
      } catch (error) {
        console.error('Failed to save agent:', error)
        setError('Failed to save agent.')
      }
    } else {
      setError('Data validaiton failed.')
    }

    setHasError(true)
    setLoading(false)
  }

  const localHandleCloseDialog = () => {
    if (!loading) {
      handleCloseDialog()
    }
  }

  function onErrorClose(): void {
    setHasError(false)
    setLoading(false)
    setError('')
  }

  return (
    <Dialog
      open={showDialog}
      onOpenChange={(_, data) => {
        if (!loading) {
          setShowDialog(data.open)
        }
      }}
    >
      <DialogSurface className={classes.dialogSurface}>
        <DialogBody>
          <DialogTitle>
            {mode === 'view'
              ? 'View Agent'
              : mode === 'edit'
              ? 'Edit Agent'
              : mode === 'duplicate'
              ? 'Duplicate Agent'
              : 'Add Agent'}
          </DialogTitle>
          <Button
            className={classes.closeButton}
            icon={<DismissRegular />}
            onClick={localHandleCloseDialog}
            disabled={loading}
          />
          <DialogContent>
            {hasError && error && (
              <ErrorMessage title="Error!" message={error} onClose={onErrorClose} />
            )}
            <Divider className={classes.divider} />
            <div className={classes.root}>
              <Label htmlFor="agent-name">Name</Label>
              <Input
                id="agent-name"
                placeholder="Agent Name"
                onChange={handleInputChange('name')}
                readOnly={isReadOnly}
                value={localAgent.name}
                disabled={loading}
              />
              {nameInputError && <Field validationMessage={'Name ' + nameInputError}></Field>}
            </div>
            <div className={classes.root}>
              <Label htmlFor="agent-type">Type</Label>
              <Input
                id="agent-type"
                placeholder="Agent Type"
                onChange={handleInputChange('type')}
                value={localAgent.type}
                readOnly={isReadOnly}
                disabled={loading}
              />
              {typeInputError && <Field validationMessage={'Type ' + typeInputError}></Field>}
            </div>
            <div className={classes.root}>
              <Label htmlFor="agent-prompt">Prompt</Label>
              <Textarea
                className={classes.largeTextArea}
                id="agent-prompt"
                placeholder="Prompt Text"
                onChange={handleInputChange('guideline_prompt')}
                value={localAgent.guideline_prompt}
                readOnly={isReadOnly}
                disabled={loading}
              />
              {promptInputError && <Field validationMessage={'Prompt ' + promptInputError}></Field>}
            </div>
          </DialogContent>
          <DialogActions className={classes.bottomLeftButtonContainer}>
            {mode !== 'view' && !loading && (
              <Button
                disabled={hasError}
                appearance="primary"
                size="large"
                icon={<SaveRegular />}
                iconPosition="after"
                className={classes.applyButton}
                onClick={handleSave}
              >
                Apply
              </Button>
            )}
            {loading && <Spinner labelPosition="below" appearance="primary" label="Saving..." />}
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  )
}

export default AgentDialog
