import {
  Button,
  Dialog,
  DialogActions,
  DialogBody,
  DialogContent,
  DialogSurface,
  DialogTitle,
  Divider,
  Label,
  Input,
  Textarea,
  Spinner,
  Field,
} from "@fluentui/react-components";
import { DismissRegular, SaveRegular } from "@fluentui/react-icons";
import ErrorMessage from "./ErrorMessage";
import useStyles from "../styles/useStyles";

interface AgentDialogProps {
  showDialog: boolean;
  onClose: () => void;
  mode: "view" | "edit" | "duplicate" | "add";
  loading?: boolean;
  error?: string | null;
  handleInputChange: (field: string) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  handleSave: () => void;
  hasError?: boolean;
  localAgent?: {
    name?: string;
    type?: string;
    guideline_prompt?: string;
  };
  nameInputError?: string | null;
  typeInputError?: string | null;
  promptInputError?: string | null;
  isReadOnly?: boolean;
  onErrorClose: () => void;
  classes?: {
    dialogSurface?: string;
    closeButton?: string;
    divider?: string;
    root?: string;
    largeTextArea?: string;
    bottomLeftButtonContainer?: string;
    applyButton?: string;
  };
}

const AgentDialog: React.FC<AgentDialogProps> = ({
  showDialog,
  onClose,
  mode,
  loading = false,
  error = null,
  handleInputChange,
  handleSave,
  hasError = false,
  localAgent = {},
  nameInputError = null,
  typeInputError = null,
  promptInputError = null,
  isReadOnly = false,
  onErrorClose,
}) => {
  const dialogTitle =
    mode === "view"
      ? "View Agent"
      : mode === "edit"
      ? "Edit Agent"
      : mode === "duplicate"
      ? "Duplicate Agent"
          : "Add New Agent";
  
  const classes = useStyles();
  return (
    <Dialog open={showDialog} onOpenChange={(_, open) => !open && onClose()}>
      <DialogSurface className={classes.dialogSurface}>
        <DialogBody>
          <DialogTitle>{dialogTitle}</DialogTitle>
          <Button
            className={classes.closeButton}
            icon={<DismissRegular />}
            onClick={onClose}
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
                onChange={handleInputChange("name")}
                readOnly={isReadOnly}
                value={localAgent.name || ""}
                disabled={loading}
              />
              {nameInputError && <Field validationMessage={`Name ${nameInputError}`} />}
            </div>
            <div className={classes.root}>
              <Label htmlFor="agent-type">Type</Label>
              <Input
                id="agent-type"
                placeholder="Agent Type"
                onChange={handleInputChange("type")}
                readOnly={isReadOnly}
                value={localAgent.type || ""}
                disabled={loading}
              />
              {typeInputError && <Field validationMessage={`Type ${typeInputError}`} />}
            </div>
            <div className={classes.root}>
              <Label htmlFor="agent-prompt">Prompt</Label>
              <Textarea
                className={classes.largeTextArea}
                id="agent-prompt"
                placeholder="Prompt Text"
                onChange={handleInputChange("guideline_prompt")}
                value={localAgent.guideline_prompt || ""}
                readOnly={isReadOnly}
                disabled={loading}
              />
              {promptInputError && <Field validationMessage={`Prompt ${promptInputError}`} />}
            </div>
          </DialogContent>
          <DialogActions className={classes.bottomLeftButtonContainer}>
            {mode !== "view" && !loading && (
              <Button
                disabled={hasError || loading}
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
  );
};

export default AgentDialog;
