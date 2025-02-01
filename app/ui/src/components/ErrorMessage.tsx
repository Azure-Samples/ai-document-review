import {
  Button,
  makeStyles,
  MessageBar,
  MessageBarBody,
  MessageBarTitle
} from '@fluentui/react-components'
import { DismissRegular } from '@fluentui/react-icons'

interface ErrorMessageProps {
  title: string
  message: string
  onClose?: () => void
}

const componentSyles = makeStyles({
  messageBar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    color: 'black'
  }
})

const ErrorMessage = ({ title, message, onClose }: ErrorMessageProps) => {
  const componentClasses = componentSyles()
  return (
    <MessageBar  intent="error">
      <div className={componentClasses.messageBar}>
        <MessageBarBody style={{ flexGrow: 1 }}>
          <MessageBarTitle>{title}</MessageBarTitle>
          {message}
        </MessageBarBody>
        {onClose && (
          <Button
            icon={<DismissRegular />}
            onClick={onClose}
            appearance="subtle"
            style={{ marginLeft: '1rem' }}
          />
        )}
      </div>
    </MessageBar>
  )
}

export default ErrorMessage
