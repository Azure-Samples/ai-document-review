import React, { useState } from "react";
import {
  Dialog,
  DialogSurface,
  DialogTitle,
  DialogBody,
  DialogActions,
  Button,
  Spinner,
} from "@fluentui/react-components";

interface CustomDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => Promise<void>; // Ensure onConfirm returns a Promise
  onCancel: () => void;
}

const CustomDialog: React.FC<CustomDialogProps> = ({ isOpen, title, message, onConfirm, onCancel }) => {
  const [isLoading, setIsLoading] = useState(false); // Track loading state

  const handleConfirm = async () => {
    setIsLoading(true);
    try {
      await onConfirm(); // Await the deletion operation
    } catch (error) {
      console.error("Error during deletion:", error);
    } finally {
      setIsLoading(false); // Hide loading spinner after operation
    }
  };

  return (
    <Dialog open={isOpen}>
      <DialogSurface>
        <DialogBody>
          <DialogTitle>{title}</DialogTitle>
          <p>{message}</p>
          <DialogActions>
            <Button onClick={onCancel} appearance="secondary" disabled={isLoading}>
              Cancel
            </Button>
            <Button
              onClick={handleConfirm}
              appearance="primary"
              disabled={isLoading} // Disable button when loading
              icon={isLoading ? <Spinner size="tiny" /> : undefined} // Show spinner when loading
            >
              {isLoading ? "Deleting..." : "Confirm"}
            </Button>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
};

export default CustomDialog;
