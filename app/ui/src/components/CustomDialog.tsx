import React, { useState } from 'react'
import {
  Dialog,
  DialogSurface,
  DialogTitle,
  DialogBody,
  DialogActions,
  Button,
  Spinner
} from '@fluentui/react-components'

interface CustomDialogProps {
  isOpen: boolean
  title: string
  message: string
  onConfirm: () => Promise<void>
  onCancel: () => void
}

const CustomDialog: React.FC<CustomDialogProps> = ({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel
}) => {
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleConfirm = async () => {
    setIsLoading(true)
    setErrorMessage(null)
    try {
      await onConfirm()
    } catch (error) {
      console.error('Error during operation:', error)
      setErrorMessage('An error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
    onCancel()
  }

  const handleCancel = () => {
    setErrorMessage(null)
    setIsLoading(false)
    onCancel()
  }

  return (
    <Dialog aria-labelledby="custom-dialog-title" open={isOpen}>
      <DialogSurface>
        <DialogBody>
          <DialogTitle id="custom-dialog-title">{title}</DialogTitle>
          <p>{message}</p>

          {errorMessage && <p style={{ color: 'red' }}>{errorMessage}</p>}

          <DialogActions>
            <Button onClick={handleCancel} appearance="secondary" disabled={isLoading}>
              Cancel
            </Button>
            <Button
              onClick={handleConfirm}
              appearance="primary"
              disabled={isLoading}
              icon={isLoading ? <Spinner size="tiny" /> : undefined}
            >
              {isLoading ? 'Processing...' : 'Confirm'}
            </Button>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  )
}

export default CustomDialog
