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
  Divider,
  DialogActions,
  Field,
  Spinner,
  Tooltip,
  makeStyles,
  tokens
} from '@fluentui/react-components'
import { CopyRegular, DismissRegular, EditRegular, SaveRegular } from '@fluentui/react-icons'
import { addAgent, updateAgent } from '../services/api'
import ErrorMessage from './ErrorMessage'
import {
  PLACEHOLDER_AGENT_GUIDELINE_PROMPT,
  PLACEHOLDER_AGENT_NAME,
  PLACEHOLDER_AGENT_TYPE
} from '../constants'
import { PromptAgent } from '../types/prompt-agent'
import { sharedStyles } from '../styles/sharedStyles'

interface AgentDialogProps {
  agentId: string
  handleCloseDialog: () => void
  selectedAgent: PromptAgent
  showDialog: boolean
  setShowDialog: (open: boolean) => void
  mode: 'view' | 'edit' | 'add' | 'duplicate'
  updateAgentList?: () => void
}

const componentSyles = makeStyles({
  largeTextArea: {
    width: '200%',
    height: '250px',
    padding: '8px',
    marginTop: '2px',
    marginBottom: '8px'
  },
  viewModeText: {
    border: '1px solid #ccc',
    borderRadius: '5px',
    padding: '5px'
  },
  largeViewModeText: {
    width: '170%',
    whiteSpace: 'pre-wrap',
    border: '1px solid #ccc',
    borderRadius: '5px',
    padding: '5px',
    marginTop: '2px',
    marginBottom: '8px',
    height: '250px',
    overflowY: 'auto'
  },
  bottomLeftButtonContainer: {
    position: 'absolute',
    bottom: '16px',
    right: '16px'
  },
  dialogSurface: {
    paddingBottom: '64px',
    minHeight: '625px',
    maxHeight: '90%',
    minWidth: '50px',
    maxWidth: '850px',
    height: '650px',
    width: '850px',
    padding: '20px',
    backgroundColor: tokens.colorNeutralBackground6
  }
})

const AgentDialog: React.FC<AgentDialogProps> = ({
  agentId,
  handleCloseDialog,
  selectedAgent,
  showDialog,
  setShowDialog,
  mode,
  updateAgentList
}) => {
  const [localAgent, setLocalAgent] = useState(selectedAgent)
  const [localAgentId, setLocalAgentId] = useState(agentId)
  const [nameInputError, setNameInputError] = useState('')
  const [typeInputError, setTypeInputError] = useState('')
  const [promptInputError, setPromptInputError] = useState('')
  const [hasError, setHasError] = useState(true)
  const [hasClientSideError, setHasClientSideError] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [localMode, setLocalMode] = useState(mode)
  const [isReadOnly, setIsReadOnly] = useState(localMode === 'view')

  const componentClasses = componentSyles()
  const sharedClasses = sharedStyles()

  useEffect(() => {
    setIsReadOnly(localMode === 'view')
  }, [localMode])

  useEffect(() => {
    setHasError(!!nameInputError || !!typeInputError || !!promptInputError)
    setHasClientSideError(!!nameInputError || !!typeInputError || !!promptInputError)
  }, [nameInputError, typeInputError, promptInputError])

  useEffect(() => {
    if (showDialog) {
      setLocalAgentId(agentId)
      setLocalAgent(selectedAgent)
    }
  }, [showDialog, selectedAgent, agentId])

  const dialogTitles: { [key: string]: string } = {
    view: 'View Agent',
    edit: 'Edit Agent',
    duplicate: 'Duplicate Agent',
    add: 'Add Agent'
  }

  const handleInputChange =
    (field: 'name' | 'type' | 'guideline_prompt') =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const value = event.target.value
      setLocalAgent((prev) => ({
        ...prev,
        [field]: value
      }))

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
    if (localMode === 'add' || localMode === 'duplicate') {
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

    if (
      !hasClientSideError &&
      !!localAgent.name &&
      !!localAgent.type &&
      !!localAgent.guideline_prompt
    ) {
      try {
        const response = await callApi(localAgentId, localAgent)
        if (response && updateAgentList) {
          updateAgentList()
          handleCloseDialog()
          setLoading(false)
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

  const handleEdit = () => {
    setLocalMode('edit')
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
      <DialogSurface className={componentClasses.dialogSurface}>
        <DialogBody>
          <DialogTitle>
            {dialogTitles[localMode] || 'Agent'}
            {localMode == 'view' && (
              <Tooltip content="Edit Agent" relationship="label">
                <Button
                  style={{ margin: '10px' }}
                  onClick={handleEdit}
                  appearance="secondary"
                  icon={<EditRegular />}
                ></Button>
              </Tooltip>
            )}
          </DialogTitle>
          <Button
            className={sharedClasses.closeButton}
            icon={<DismissRegular />}
            onClick={localHandleCloseDialog}
            disabled={loading}
          />
          <DialogContent>
            {hasError && error && (
              <ErrorMessage title="Error!" message={error} onClose={onErrorClose} />
            )}
            <Divider className={sharedClasses.divider} />
            <div className={sharedClasses.root}>
              <Field required={localMode != 'view'} label="Name">
                {localMode === 'view' ? (
                  <div id="agent-name" className={componentClasses.viewModeText}>
                    {localAgent.name}
                  </div>
                ) : (
                  <Input
                    id="agent-name"
                    required
                    placeholder={PLACEHOLDER_AGENT_NAME}
                    onChange={handleInputChange('name')}
                    readOnly={isReadOnly}
                    value={localAgent.name}
                    disabled={loading}
                  />
                )}
                {nameInputError && <Field validationMessage={'Name ' + nameInputError}></Field>}
              </Field>
            </div>
            <div className={sharedClasses.root}>
              <Field required={localMode != 'view'} label="Type">
                {localMode === 'view' ? (
                  <div id="agent-type" className={componentClasses.viewModeText}>
                    {localAgent.type}
                  </div>
                ) : (
                  <Input
                    id="agent-type"
                    placeholder={PLACEHOLDER_AGENT_TYPE}
                    onChange={handleInputChange('type')}
                    value={localAgent.type}
                    readOnly={isReadOnly}
                    disabled={loading}
                  />
                )}
                {typeInputError && <Field validationMessage={'Type ' + typeInputError}></Field>}
              </Field>
            </div>
            <div className={sharedClasses.root}>
              <Field required={localMode != 'view'} label="Prompt">
                {localMode === 'view' ? (
                  <div
                    id="agent-prompt"
                    className={componentClasses.largeViewModeText}
                    style={{ position: 'relative' }}
                  >
                    <div>{localAgent.guideline_prompt}</div>
                  </div>
                ) : (
                  <Textarea
                    className={componentClasses.largeTextArea}
                    id="agent-prompt"
                    required
                    placeholder={PLACEHOLDER_AGENT_GUIDELINE_PROMPT}
                    onChange={handleInputChange('guideline_prompt')}
                    value={localAgent.guideline_prompt}
                    readOnly={isReadOnly}
                    disabled={loading}
                  />
                )}
                {promptInputError && (
                  <Field validationMessage={'Prompt ' + promptInputError}></Field>
                )}
              </Field>
              <Tooltip content="Copy Prompt" relationship="label">
                <Button
                  icon={<CopyRegular />}
                  onClick={() => navigator.clipboard.writeText(localAgent.guideline_prompt)}
                />
              </Tooltip>
            </div>
          </DialogContent>
          <DialogActions className={componentClasses.bottomLeftButtonContainer}>
            {localMode != 'view' && (
              <Button
                onClick={handleSave}
                appearance="primary"
                disabled={loading || hasClientSideError}
                icon={loading ? <Spinner size="tiny" /> : <SaveRegular />}
              >
                {loading ? 'Saving...' : 'Apply'}
              </Button>
            )}
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  )
}

export default AgentDialog
