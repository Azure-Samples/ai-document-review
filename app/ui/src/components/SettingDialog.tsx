import * as React from 'react'
import { useEffect } from 'react'
import {
  Button,
  Dialog,
  DialogBody,
  DialogSurface,
  DialogTitle,
  Field,
  Input,
  makeStyles,
  Spinner
} from '@fluentui/react-components'
import ErrorMessage from './ErrorMessage'
import { DismissRegular, SaveRegular } from '@fluentui/react-icons'
import { addSetting } from '../services/api'
import { MAX_INPUT_STR_LEGNTH } from '../constants'
import { sharedStyles } from '../styles/sharedStyles'

interface AddSettingFormProps {
  isOpen: boolean
  onDone: () => void
}

const componentStyles = makeStyles({
  settingDialog: {
    minHeight: '250px',
    width: '400px',
    padding: '20px',
    paddingBottom: '60px'
  },
  field: {
    width: '360px'
  },
  saveButton: {
    marginTop: '20px',
    position: 'absolute',
    right: '16px',
    bottom: '16px'
  }
})

const SettingDialog: React.FC<AddSettingFormProps> = ({ isOpen, onDone }) => {
  const [currentSetting, setCurrentSetting] = React.useState({ name: '', value: '' })
  const [error, setError] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const [nameInputError, setNameInputError] = React.useState('')
  const [valueInputError, setValueInputError] = React.useState('')
  const [hasClientError, setHasClientError] = React.useState(true)

  const sharedClasses = sharedStyles()
  const componentClasses = componentStyles()

  useEffect(() => {
    if (nameInputError.trim() === '' && valueInputError.trim() === '') {
      setHasClientError(false)
    } else {
      setHasClientError(true)
    }
  }, [nameInputError, valueInputError])

  const validateNotEmpty = (str: string, fieldName: string) => {
    const trimmedStr = str.trim()
    if (!trimmedStr) return `${fieldName} should not be empty.`
    return ''
  }

  const validateMaxLength = (str: string, fieldName: string) => {
    if (str.length > MAX_INPUT_STR_LEGNTH) {
      return `${fieldName} length should not exceed ${MAX_INPUT_STR_LEGNTH} characters.`
    }
    return ''
  }

  const validateFormat = (str: string, fieldName: string) => {
    if (!/^[a-zA-Z0-9_-]+$/.test(str)) {
      return `${fieldName} should only contain letters, numbers, underscores, and dashes.`
    }
    return ''
  }

  const validateSettingString = (str: string, fieldName: string) => {
    return (
      validateNotEmpty(str, fieldName) ||
      validateMaxLength(str, fieldName) ||
      validateFormat(str, fieldName)
    )
  }

  const handleInputChange = (input: string, field: 'name' | 'value') => {
    setError('')
    setCurrentSetting((prevState) => ({ ...prevState, [field]: input }))
    return validateSettingString(input, field)
  }

  const handleNameInputChange = (e: React.ChangeEvent<HTMLInputElement>, field: 'name') => {
    const error = handleInputChange(e.target.value, field)
    setNameInputError(error)
  }

  const handleValueInputChange = (e: React.ChangeEvent<HTMLInputElement>, field: 'value') => {
    const error = handleInputChange(e.target.value, field)
    setValueInputError(error)
  }

  const handleSaveSetting = async () => {
    const nameError = validateSettingString(currentSetting.name, 'name')
    const valueError = validateSettingString(currentSetting.value, 'value')

    setNameInputError(nameError)
    setValueInputError(valueError)

    if (nameError || valueError) {
      return
    }

    try {
      setError('')
      setLoading(true)
      await addSetting(currentSetting)
      onDone()
      setCurrentSetting({ name: '', value: '' })
    } catch (e) {
      console.error(e)
      setError(e instanceof Error ? e.message : 'Something went wrong. Please try again.')
    }

    setLoading(false)
  }

  const localHandleCloseDialog = () => {
    if (!loading) {
      onDone()
    }
  }

  return (
    <Dialog aria-labelledby="custom-dialog-title" open={isOpen}>
      <DialogSurface className={componentClasses.settingDialog}>
        <DialogBody>
          <DialogTitle id="custom-dialog-title">Add new setting</DialogTitle>
          <Button
            aria-label="Close dialog"
            className={sharedClasses.closeButton}
            icon={<DismissRegular />}
            onClick={localHandleCloseDialog}
            disabled={loading}
          />
          <div>
            {error && (
              <div className={componentClasses.field}>
                <ErrorMessage title="Error!" message={error} />
              </div>
            )}
            <Field className={componentClasses.field} required label="Name">
              <Input
                id="setting-name"
                aria-label="Setting Name"
                required
                placeholder={"e.g. 'batch_size'"}
                onChange={(e) => handleNameInputChange(e, 'name')}
                value={currentSetting.name}
              />
              {nameInputError && <Field validationMessage={nameInputError}></Field>}
            </Field>
            <Field className={componentClasses.field} required label="Value">
              <Input
                id="setting-value"
                aria-label="Setting Value"
                required
                placeholder={"e.g. '21'"}
                onChange={(e) => handleValueInputChange(e, 'value')}
                value={currentSetting.value}
              />
              {valueInputError && <Field validationMessage={valueInputError}></Field>}
            </Field>
            <Button
              className={componentClasses.saveButton}
              aria-label="Save Setting"
              onClick={handleSaveSetting}
              appearance="primary"
              disabled={loading || hasClientError || !currentSetting.name || !currentSetting.value}
              icon={loading ? <Spinner size="tiny" /> : <SaveRegular />}
            >
              {loading ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  )
}

export default SettingDialog
