from common.logger import get_logger
from typing import Any, Dict, List
from common.models import Issue
from config.config import settings
from database.db_client import CosmosDBClient

logging = get_logger(__name__)

class IssuesRepository:
    def __init__(self) -> None:
        """Initialize the IssuesRepository with a CosmosDBClient."""
        self.db_client = CosmosDBClient(settings.issues_container)


    async def get_issues(self, doc_id: str) -> List[Issue]:
        """
        Retrieve issues for given document id and document major and minor version.

        Args:
            doc_id (str): The document id.
            doc_major_version (int): The document major version.
            doc_minor_version (int): The document minor version.
        """
        logging.info(f"Retrieving issues for document {doc_id}.")
        filter = { "doc_id": doc_id }
        issues = await self.db_client.retrieve_items_by_values(filter, doc_id)
        logging.info(f"Retrieved {len(issues)} issues for document {doc_id}.")
        return [Issue(**issue) for issue in issues]


    async def get_issue(self, doc_id: str, issue_id: str) -> Issue:
        """
        Retrieve issue for given issue id and doc id.

        Args:
            issue_id (str): The ID of the issue.
            doc_id (str): The ID of the document.
        """
        issue = await self.db_client.retrieve_item_by_id(issue_id, doc_id)
        return Issue(**issue)


    async def store_issues(self, issues: List[Issue]) -> None:
        """
        Store issues in the database.

        Args:
            issues (List[IssueDBModel]): List of IssueDBModel objects.
        """
        logging.info(f"Storing {len(issues)} issues in the database.")
        for issue in issues:
            await self.db_client.store_item(issue.model_dump())
        logging.info("Issues stored successfully.")


    async def update_issue(self, doc_id: str, issue_id: str, fields: Dict[str, Any]) -> Issue:
        """
        Updates issue fields

        Args:
            doc_id (str): The ID of the document.
            issue_id (str): The ID of the issue.
            fields (Dict[str, Any]): The fields to update.
        """
        logging.info(f"Updating issue {issue_id}")
        issue = await self.db_client.retrieve_item_by_id(issue_id, doc_id)
        if issue:
            for field, value in fields.items():
                issue[field] = value

            await self.db_client.store_item(issue)
            logging.info(f"Issue {issue_id} updated.")
            return Issue(**issue)
        else:
            raise ValueError(f"Issue {issue_id} not found.")


    async def delete_issues(self, doc_id: str) -> None:
        """
        Delete issues for a given document id.

        Args:
            doc_id (str): The document id.
        """
        logging.info(f"Deleting issues for document {doc_id}.")
        await self.db_client.delete_items_by_values({"doc_id": doc_id}, doc_id)
        logging.info(f"Issues for document {doc_id} deleted.")
