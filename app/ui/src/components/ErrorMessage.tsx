import { Button, MessageBar, MessageBarBody, MessageBarTitle } from '@fluentui/react-components'
import { DismissRegular } from '@fluentui/react-icons'
import useStyles from '../styles/useStyles'

interface ErrorMessageProps {
  title: string
  message: string
  onClose: () => void
}

const ErrorMessage = ({ title, message, onClose }: ErrorMessageProps) => {
  const classes = useStyles()
  return (
    <MessageBar intent="error">
      <div className={classes.messageBar}>
        <MessageBarBody style={{ flexGrow: 1 }}>
          <MessageBarTitle>{title}</MessageBarTitle>
          {message}
        </MessageBarBody>
        <Button
          icon={<DismissRegular />}
          onClick={onClose}
          appearance="subtle"
          style={{ marginLeft: '1rem' }}
        />
      </div>
    </MessageBar>
  )
}

export default ErrorMessage
