from common.logger import get_logger
import uuid
from datetime import datetime, timezone
from typing import AsyncGenerator, List
from services.aml_client import AMLClient
from database.issues_repository import IssuesRepository
from fastapi_azure_auth.user import User
from config.config import settings
from common.models import FlowOutputChunk, Issue, IssueStatusEnum, ModifiedFieldsModel, DismissalFeedbackModel

logging = get_logger(__name__)

class IssuesService:
    def __init__(self, issues_repository: IssuesRepository, aml_client: AMLClient) -> None:
        self.aml_client = aml_client
        self.issues_repository = issues_repository


    async def get_issues_data(self, doc_id: str) -> List[Issue]:
        """
        Retrieves document issues for a given document ID.

        Args:
            doc_id (str): Document ID

        Returns:
            List[IssueModel]: List of issues for the document with feedback if exists
        """
        try:
            logging.debug(f"Retrieving document issues for {doc_id}")
            issues = await self.issues_repository.get_issues(doc_id)
            return issues

        except Exception as e:
            logging.error(f"Error retrieving PDF issues for doc_id={doc_id}: {str(e)}")
            raise e


    async def initiate_review(self, pdf_name: str, user: User, time_stamp: datetime) -> AsyncGenerator:
        """
        Initiates a review for a given document ID.

        Args:
            pdf_name (str): file name of the PDF
            user (dict): User initiating the review
            time_stamp (datetime): Time stamp of the review initiation

        Returns:
            Generator: Stream of issues for the document
        """
        try:
            logging.info(f"Initiating review for document {pdf_name}")

            # Initiate review to get a stream of issues
            stream_data = self.aml_client.call_aml_endpoint(settings.flow_endpoint_name, pdf_name)
            async for chunk in stream_data:
                flow_output = FlowOutputChunk.model_validate_json(chunk)
                issues = [
                    Issue(
                        **i.model_dump(),
                        id=str(uuid.uuid4()),
                        doc_id=pdf_name,
                        status=IssueStatusEnum.not_reviewed,
                        review_initiated_by=user.oid,
                        review_initiated_at_UTC=time_stamp
                    ) for i in flow_output.issues
                ]

                logging.info(f"Storing issues for document {pdf_name}")
                await self.issues_repository.store_issues(issues)
                yield issues

        except Exception as e:
            if hasattr(e, "errors"):
                error_details = e.errors()
                logging.error("Error validating JSON chunk: %s", error_details)
            else:
                logging.error(f"Error initiating review for document {pdf_name}: {str(e)}")
            raise e


    async def accept_issue(
        self, issue_id: str, doc_id: str, user: User, modified_fields: ModifiedFieldsModel = None
    ) -> Issue:
        """
        Accepts an issue and optionally record modified fields.

        Args:
            issue_id: The ID of the issue.
            doc_id: The ID of the document.
            user: The user object.
            modified_fields: optional - fields modified by user.
        """
        try:
            issue = await self.issues_repository.get_issue(doc_id, issue_id)
            update_fields = {
                "status": IssueStatusEnum.accepted,
                "resolved_by": user.oid,
                "resolved_at_UTC": datetime.now(timezone.utc).isoformat()
            }

            if modified_fields:
                update_fields["modified_fields"] = modified_fields.model_dump(exclude_none=True)

            #  Store and return issue
            updated_issue = issue.model_copy(update=update_fields)
            await self.issues_repository.store_issues([updated_issue])
            return updated_issue

        except ValueError as e:
            logging.error(
                f"Validation error while accepting issue {issue_id}: {e}"
            )
            raise
        except Exception as e:
            logging.error(
                f"Failed to accept issue {issue_id}: {e}"
            )
            raise


    async def dismiss_issue(
        self, issue_id: str, doc_id: str, user: User, dismissal_feedback: DismissalFeedbackModel = None
    ) -> Issue:
        """
        Dismisses an issue and provides optional feedback.

        Args:
            issue_id: The ID of the issue.
            doc_id: The ID of the document.
            user: The user object.
            dismissal_feedback: optional - feedback provided by user.
        """
        try:
            update_fields = {
                "status": IssueStatusEnum.dismissed,
                "resolved_by": user.oid,
                "resolved_at_UTC": datetime.now(timezone.utc).isoformat()
            }

            if dismissal_feedback:
                update_fields["dismissal_feedback"] = dismissal_feedback.model_dump()

            return await self.issues_repository.update_issue(
                doc_id,
                issue_id,
                update_fields
            )

        except ValueError as e:
            logging.error(
                f"Validation error while dismissing issue {issue_id}: {e}"
            )
            raise
        except Exception as e:
            logging.error(
                f"Failed to dismiss issue {issue_id}: {e}"
            )
            raise


    async def add_feedback(
        self, issue_id: str, doc_id: str, feedback: DismissalFeedbackModel
    ) -> Issue:
        """
        Adds feedback to an issue.
        Args:
            issue_id: The ID of the issue.
            doc_id: The ID of the document.
            feedback: Feedback provided by user.
        """
        try:
            return await self.issues_repository.update_issue(
                doc_id,
                issue_id, {
                "feedback": feedback.model_dump(exclude_none=True)
            })
        except ValueError as e:
            logging.error(
                f"Validation error while providing feedback on issue {issue_id}: {e}"
            )
            raise
        except Exception as e:
            logging.error(
                f"Failed to provide feedback on issue {issue_id}: {e}"
            )
            raise
