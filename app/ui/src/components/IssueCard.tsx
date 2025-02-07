import { Badge, Button, Caption1Strong, Card, CardFooter, CardHeader, Field, makeStyles, mergeClasses, MessageBar, MessageBarBody, MessageBarTitle, Spinner, Textarea, tokens } from "@fluentui/react-components";
import { Checkmark16Regular, CheckmarkCircle20Filled, Circle20Filled, Dismiss16Regular, DismissCircle20Filled, PersonFeedback20Filled } from "@fluentui/react-icons";
import { useState } from "react";
import { callApi } from "../services/api";
import { DismissalFeedback, Issue, IssueStatus, ModifiedFields } from "../types/issue";

type IssueCardProps = {
  docId: string;
  issue: Issue;
  selected: boolean;
  onSelect: (issue: Issue) => void;
  onUpdate: (updatedIssue: Issue) => void;
};

const useStyles = makeStyles({
  card: { margin: '5px' },
  explanation: { marginTop: '10px' },
  accepted: {
    backgroundColor: tokens.colorPaletteGreenBackground1,
  },
  dismissed: {
    backgroundColor: tokens.colorNeutralBackground2
  },
  header: { paddingTop: '10px', paddingBottom: '10px' },
  hideOverflow: { width: '270px', textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden'},
  footer: { paddingTop: '10px' },
  feedback: {
    backgroundColor: tokens.colorPaletteYellowBackground2,
  },
});

export function IssueCard({ docId, issue, selected, onSelect, onUpdate }: IssueCardProps) {
  const classes = useStyles();

  function getCardClassName() {
    switch (issue.status) {
      case IssueStatus.Accepted:
        return mergeClasses(classes.card, classes.accepted);
      case IssueStatus.Dismissed:
        return mergeClasses(classes.card, classes.dismissed);
      default:
        return classes.card;
    }
  }

  const [accepting, setAccepting] = useState<boolean>(false);
  const [dismissing, setDismissing] = useState<boolean>(false);
  const [submittingFeedback, setSubmittingFeedback] = useState<boolean>(false);
  const [addFeedback, setAddFeedback] = useState<boolean>(false);
  const [modifiedExplanation, setModifiedExplanation] = useState<string>();
  const [modifiedSuggestedFix, setModifiedSuggestedFix] = useState<string>();
  const [feedback, setFeedback] = useState<DismissalFeedback>();
  const [feedbackSubmitted, setFeedbackSubmitted] = useState<boolean>(false);
  const [error, setError] = useState<string>();

  /**
   * Accepts an issue and posts any modified fields.
   */
  async function handleAccept() {
    // Check if fields have been modified
    const modifiedFields: ModifiedFields = {}
    if (modifiedExplanation) {
      modifiedFields.explanation = modifiedExplanation;
    }
    if (modifiedSuggestedFix) {
      modifiedFields.suggested_fix = modifiedSuggestedFix;
    }

    try {
      setAccepting(true);
      // Send the request
      const response = await callApi(
        `${docId}/issues/${issue.id}/accept`,
        'PATCH',
        Object.keys(modifiedFields).length ? modifiedFields : undefined
      )
      // Update issue state
      const updatedIssue = (await response.json()) as Issue;
      if (onUpdate) {
        onUpdate(updatedIssue);
      }
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError(String(err));
      }
    } finally {
      setAccepting(false);
    }
  }

  /**
   * Dismisses an issue.
   */
  async function handleDismiss() {
    try {
      setDismissing(true);
      const response = await callApi(`${docId}/issues/${issue.id}/dismiss`, 'PATCH');
      const updatedIssue = (await response.json()) as Issue;
      if (onUpdate) {
        onUpdate(updatedIssue);
      }
      setAddFeedback(true);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError(String(err));
      }
    } finally {
      setDismissing(false);
    }
  }

  /**
   * Submits issue feedback.
   */
  async function handleSubmitFeedback() {
    try {
      setSubmittingFeedback(true);
      await callApi(`${docId}/issues/${issue.id}/feedback`, 'PATCH', feedback);
      setFeedbackSubmitted(true);
      setAddFeedback(false);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError(String(err));
      }
    } finally {
      setSubmittingFeedback(false);
    }
  }

  return (
    <Card className={getCardClassName()} selected={selected} onSelectionChange={() => onSelect(issue)} color={tokens.colorNeutralForeground2}>
        <CardHeader
          className={classes.header}
          image={
            issue.status === IssueStatus.Accepted
              ? <CheckmarkCircle20Filled primaryFill={tokens.colorPaletteLightGreenForeground1} />
              : issue.status === IssueStatus.Dismissed
                ? <DismissCircle20Filled primaryFill={tokens.colorNeutralForeground2} />
                : <Circle20Filled primaryFill={tokens.colorNeutralBackground4} />
          }
          header={
            <Caption1Strong className={!selected ? classes.hideOverflow : undefined} strikethrough={issue.status === IssueStatus.Dismissed}>{ issue.text }</Caption1Strong>
          }
        />

        <Badge appearance="tint" color="informative" shape="rounded">
          { issue.type }
        </Badge>

      {
        selected && <>
          <Field label="Explanation" className={classes.explanation}>
            <Textarea
              defaultValue={issue.modified_fields?.explanation ? issue.modified_fields.explanation : issue.explanation}
              readOnly={issue.status !== IssueStatus.NotReviewed}
              value={modifiedExplanation}
              onChange={e => setModifiedExplanation(e.target.value)}
              required
              rows={4}
            />
          </Field>
          <Field label="Suggested fix">
            <Textarea
              defaultValue={issue.modified_fields?.suggested_fix ? issue.modified_fields?.suggested_fix : issue.suggested_fix}
              readOnly={issue.status !== IssueStatus.NotReviewed}
              value={modifiedSuggestedFix}
              onChange={e => setModifiedSuggestedFix(e.target.value)}
              required
              rows={4} 
            />
          </Field>
          {
            error && <MessageBar intent="error">
              <MessageBarBody>
                <MessageBarTitle>Error</MessageBarTitle>
                { error }
              </MessageBarBody>
            </MessageBar>
          }
          { 
            issue.status === IssueStatus.NotReviewed && <CardFooter className={classes.footer}>
              <Button
                appearance="primary"
                disabledFocusable={accepting}
                icon={
                  accepting ? (
                    <Spinner size="tiny" />
                  ) : <Checkmark16Regular />
                }
                onClick={handleAccept}
              >
                Accept
              </Button>
              <Button
                disabledFocusable={dismissing}
                icon={
                  dismissing ? (
                    <Spinner size="tiny" />
                  ) : <Dismiss16Regular />
                }
                onClick={handleDismiss}
              >
                Dismiss
              </Button>
            </CardFooter>
          }
          {
            addFeedback && <Card appearance="outline" className={classes.feedback}>
              <CardHeader image={<PersonFeedback20Filled primaryFill={tokens.colorPaletteDarkOrangeForeground1} />} header="Help us improve" />
              <Field>
                <Textarea
                  value={feedback?.reason}
                  placeholder="Please explain why this suggestion was wrong & how it can be improved."
                  onChange={e => setFeedback({...feedback, reason: e.target.value})}
                  required
                  rows={4}
                />
              </Field>
              <CardFooter>
                <Button
                  appearance="primary"
                  disabled={!feedback}
                  onClick={handleSubmitFeedback}
                  disabledFocusable={submittingFeedback}
                  icon={
                    submittingFeedback ? (
                      <Spinner size="tiny" />
                    ) : undefined
                  }
                >
                  Submit
                </Button>
              </CardFooter>
            </Card>
          }
          {
            feedbackSubmitted && <MessageBar intent="success">
              <MessageBarBody>
                <MessageBarTitle>Feedback submitted</MessageBarTitle>
                Thanks for helping improve AI Document Review!
              </MessageBarBody>
            </MessageBar>
          }
        </>
      }
    </Card>
  )
}
