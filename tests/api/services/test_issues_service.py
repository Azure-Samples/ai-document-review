import pytest
import asyncio
from common.models import IssueType
import json
from services.issues_service import IssuesService

class AMLStreamMock:
    def __init__(self, items: list):
        self._items = items

    def __aiter__(self):
        return self

    async def __anext__(self):
        await asyncio.sleep(0.1)
        if not self._items:
            raise StopAsyncIteration
        return json.dumps(self._items.pop(0)) # return as string

@pytest.mark.asyncio
async def test_get_issues_data(mock_issues_repo, mock_aml_client):
    """ Checks the wiring of issues service with issues repository """

    mock_issues_repo.get_issues.return_value = []
    issues_service = IssuesService(mock_issues_repo, mock_aml_client)
    issues = await issues_service.get_issues_data("abc.pdf")

    assert issues == []
    mock_issues_repo.get_issues.assert_called_once_with("abc.pdf")

@pytest.mark.asyncio
async def test_get_issues_exception(mock_issues_repo, mock_aml_client):
    """ Checks the exception is re-raised when issues repository raises an exception """

    mock_issues_repo.get_issues.side_effect = Exception("Expected Test Error")
    issues_service = IssuesService(mock_issues_repo, mock_aml_client)
    with pytest.raises(Exception):
        await issues_service.get_issues_data("abc.pdf")
        mock_issues_repo.get_issues.assert_called_once_with("abc.pdf")

@pytest.mark.asyncio
async def test_initiate_review_valid_chunks(mock_issues_repo, mock_aml_client, dummy_user):
    """ Checks the initiate review method """

    doc_name = "abc.pdf"

    mock_aml_client.call_aml_endpoint.return_value = AMLStreamMock(
        [
            {"issues": 
                [
                    {
                        "type": "Grammar & Spelling",
                        "location": {
                            "source_sentence": "sentence1",
                            "page_num": 1,
                            "bounding_box": [1.0, 2.0, 3.0, 4.0],
                            "para_index": 1
                        },
                        "text": "issue1",
                        "explanation": "explanation1",
                        "suggested_fix": "fix1",
                     }
                ]
            }
        ]
    )

    issues_service = IssuesService(mock_issues_repo, mock_aml_client)
    async for issues in issues_service.initiate_review(doc_name, dummy_user, "2021-09-01"):
            for issue in issues:
                assert issue.type == IssueType.GrammarSpelling
                assert issue.doc_id == doc_name
                assert issue.status == "not_reviewed"
                assert issue.review_initiated_by == dummy_user.oid
                assert issue.review_initiated_at_UTC == "2021-09-01"

    mock_aml_client.call_aml_endpoint.assert_called_once_with("", "abc.pdf")
