import { Button, MessageBar, MessageBarBody, MessageBarTitle } from "@fluentui/react-components"
import { DismissRegular } from "@fluentui/react-icons";

interface ErrorMessageProps {
    title: string;
    message: string;
    onClose: () => void;
}

const ErrorMessage = ({ title, message, onClose }: ErrorMessageProps) => {
    return (
        <MessageBar intent="error">
            {/* TODO: Move button to end of the error message box instead of top right corner of the modal */}
            <Button
                style={{ position: 'absolute', right: '0.5rem', top: '0.5rem' }}
                icon={<DismissRegular />}
                onClick={onClose}
            />
            <MessageBarBody>
                <MessageBarTitle>{title}</MessageBarTitle>
                {message}
            </MessageBarBody>
        </MessageBar>
    )
}

export default ErrorMessage
