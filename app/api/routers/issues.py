from datetime import datetime, timezone
from http import HTTPStatus
from dependencies import get_issues_service
from common.logger import get_logger
import json
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Header
from services.issues_service import IssuesService
from fastapi.responses import StreamingResponse
from security.auth import validate_authenticated
from common.models import Issue, ModifiedFieldsModel, DismissalFeedbackModel


router = APIRouter()
logging = get_logger(__name__)


def issues_event(issues: list[Issue]) -> str:
    issue_objs = [issue.model_dump() for issue in issues]
    return f"event: issues\n" + (f"data: {json.dumps(issue_objs)}\n" if issues else "") + "\n"

@router.get(
    "/api/v1/review/{doc_id}/issues",
    summary="Get issues related to a PDF document",
    responses={
        200: {"description": "Issues retrieved successfully"},
        401: {"description": "Unauthorized"},
        500: {"description": "Internal server error"},
    },
)
async def get_pdf_issues(
    doc_id: str,
    rerun: Optional[bool] = False,
    user=Depends(validate_authenticated),
    issues_service=Depends(get_issues_service)
) -> StreamingResponse:
    """
    Retrieve issues related to the document.

    Args:
        doc_id (str): The filename of the document
        rerun (bool): Flag to re-run the review process even if issues are already stored
        user (Depends): The authenticated user.

    Returns:
        StreamingResponse: A text events stream containing identified issues.
    """
    logging.info(f"Received initiate review request for document {doc_id}")

    try:
        if rerun:
            logging.info(f"Re-run flag set to true. Deleting existing issues for {doc_id} and re-running check...")
            await issues_service.delete_document_issues(doc_id)
            stored_issues = []
        else:
            stored_issues = await issues_service.get_issues_data(doc_id)

        if stored_issues:
            logging.info(f"Found stored issues for document {doc_id}. Streaming issues...")

            def issues_events():
                yield issues_event(stored_issues)
                yield "event: complete\n\n"

            issues = issues_events()

        else:
            logging.info(f"No issues found for document {doc_id}. Initiating review...")
            date_time = datetime.now(timezone.utc).isoformat()
            issues_stream = issues_service.initiate_review(doc_id, user, date_time)

            async def issues_events():
                try:
                    async for issues in issues_stream:
                        yield issues_event(issues)
                    yield "event: complete\n\n"
                except Exception as e:
                    logging.error(f"Error occurred while streaming issues: {str(e)}")
                    yield "event: error\n"
                    yield f"data: {str(e)}\n\n"

            issues = issues_events()

        return StreamingResponse(issues, media_type="text/event-stream")

    except ValueError as e:
        logging.error(f"Invalid input provided for document {doc_id}: {str(e)}")
        raise HTTPException(status_code=400, detail="Invalid input provided")
    except HTTPException as e:
        logging.error(f"HTTP Exception {e.detail}: {str(e)}")
        raise e  # Re-raise HTTP exceptions to preserve original status code and detail
    except Exception as e:
        logging.error(f"Unexpected error occurred during review request for document {doc_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.patch(
    "/api/v1/review/{doc_id}/issues/{issue_id}/accept",
    summary="Accept issue and optionally provide modified fields",
    responses={
        HTTPStatus.OK: {"description": "Issue updated successfully"},
        HTTPStatus.UNAUTHORIZED: {"description": "Unauthorized"},
        HTTPStatus.BAD_REQUEST: {"description": "Invalid data provided"},
        HTTPStatus.UNPROCESSABLE_ENTITY: {"description": "Validation error"},
        HTTPStatus.INTERNAL_SERVER_ERROR: {"description": "Internal server error"},
    },
    response_model=Issue
)
async def accept_issue(
    doc_id: str,
    issue_id: str,
    modified_fields: Optional[ModifiedFieldsModel] = None,
    user=Depends(validate_authenticated),
    issues_service: IssuesService = Depends(get_issues_service),
) -> Issue:
    """
    Accepts specific issue within a document and adds any modified fields.

    Args:
        doc_id (str): The ID of the document.
        doc_major_version (str): The major version of the document.
        doc_minor_version (str): The minor version of the document.
        issue_id (str): The ID of the issue.
        modified_fields (ModifiedFieldsModel): The modified fields data to be updated.
        user: The authenticated user object.
        issues_service (IssuesService): The issues service instance.

    Returns:
        IssueModel: The updated issue.
    """
    logging.info(f"Request received to accept issue {issue_id} on document {doc_id}.")

    updated_issue = await issues_service.accept_issue(issue_id, doc_id, user, modified_fields)

    logging.info(f"Issue {issue_id} updated successfully.")
    return updated_issue


@router.patch(
    "/api/v1/review/{doc_id}/issues/{issue_id}/dismiss",
    summary="Dismiss issue and optionally provide feedback",
    responses={
        HTTPStatus.OK: {"description": "Issue updated successfully"},
        HTTPStatus.UNAUTHORIZED: {"description": "Unauthorized"},
        HTTPStatus.BAD_REQUEST: {"description": "Invalid data provided"},
        HTTPStatus.UNPROCESSABLE_ENTITY: {"description": "Validation error"},
        HTTPStatus.INTERNAL_SERVER_ERROR: {"description": "Internal server error"},
    },
    response_model=Issue
)
async def dismiss_issue(
    doc_id: str,
    issue_id: str,
    dismissal_feedback: Optional[DismissalFeedbackModel] = None,
    user=Depends(validate_authenticated),
    issues_service: IssuesService = Depends(get_issues_service),
) -> Issue:
    """
    Dismiss specific issue within a document.

    Args:
        doc_id (str): The ID of the document.
        doc_major_version (str): The major version of the document.
        doc_minor_version (str): The minor version of the document.
        issue_id (str): The ID of the issue.
        dismissal_feedback (DismissalFeedbackModel): The feedback data to be updated.
        user: The authenticated user object.
        issues_service (IssuesService): The issues service instance.

    Returns:
        IssueModel: The updated issue.
    """
    logging.info(f"Request received to dismiss issue {issue_id} on document {doc_id}.")

    updated_issue = await issues_service.dismiss_issue(issue_id, doc_id, user, dismissal_feedback)

    logging.info(f"Issue {issue_id} updated successfully.")
    return updated_issue


@router.patch(
    "/api/v1/review/{doc_id}/issues/{issue_id}/feedback",
    summary="Provide feedback on a dismissed issue",
    responses={
        HTTPStatus.OK: {"description": "Issue updated successfully"},
        HTTPStatus.UNAUTHORIZED: {"description": "Unauthorized"},
        HTTPStatus.BAD_REQUEST: {"description": "Invalid data provided"},
        HTTPStatus.UNPROCESSABLE_ENTITY: {"description": "Validation error"},
        HTTPStatus.INTERNAL_SERVER_ERROR: {"description": "Internal server error"},
    },
    response_model=Issue
)
async def provide_feedback(
    doc_id: str,
    issue_id: str,
    dismissal_feedback: DismissalFeedbackModel,
    user=Depends(validate_authenticated),
    issues_service: IssuesService = Depends(get_issues_service),
) -> Issue:
    """
    Dismiss specific issue within a document and adds feedback.
    Args:
        doc_id (str): The ID of the document.
        doc_major_version (str): The major version of the document.
        doc_minor_version (str): The minor version of the document.
        issue_id (str): The ID of the issue.
        dismissal_feedback (DismissalFeedbackModel): The feedback data to be updated.
        user: The authenticated user object.
        issues_service (IssuesService): The issues service instance.
    Returns:
        IssueModel: The updated issue.
    """
    logging.info(f"Request received to provide feedback on issue {issue_id} on document {doc_id}.")
    updated_issue = await issues_service.add_feedback(issue_id, doc_id, dismissal_feedback)
    logging.info(f"Issue {issue_id} updated successfully.")
    return updated_issue
