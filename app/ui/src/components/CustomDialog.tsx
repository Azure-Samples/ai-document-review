import React from "react";
import { Dialog } from "@fluentui/react-components";

interface CustomDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const CustomDialog: React.FC<CustomDialogProps> = ({ isOpen, title, message, onConfirm, onCancel }) => {
  return (
    <Dialog
      open={isOpen}
      onDismiss={onCancel}
      title={title}
    >
      <p>{message}</p>
      <div>
        <button onClick={onCancel}>Cancel</button>
        <button onClick={onConfirm}>Confirm</button>
      </div>
    </Dialog>
  );
};

export default CustomDialog;
