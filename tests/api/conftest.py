from fastapi.testclient import TestClient
from main import app
import pytest
import logging
from fastapi_azure_auth.user import User
from unittest.mock import AsyncMock, patch


# Remove the added logger handlers (file + Azure)
logger = logging.getLogger()
logging.basicConfig(level=logging.INFO)
logger.removeHandler(logger.handlers[0])
logger.removeHandler(logger.handlers[0])

@pytest.fixture(scope="function")
def test_api_client():
    with TestClient(app) as client:
        yield client

@pytest.fixture(scope="function")
def mock_cosmosdb_client():
    with patch('database.db_client.CosmosDBClient') as mock:
        yield mock

@pytest.fixture(scope="function")
def mock_issues_repo():
    with patch('database.issues_repository.IssuesRepository', new_callable=AsyncMock) as mock:
        yield mock


@pytest.fixture(scope="function")
def mock_aml_client():
    with patch('services.aml_client.AMLClient') as mock:
        yield mock

@pytest.fixture(scope="function")
def dummy_user():
    return User(aud="aud",
        iss="iss",
        iat=1234,
        nbf=1234,
        exp=1234,
        sub="sub",
        oid="1234",
        ver='2.0',
        claims={},
        access_token="access_token",
        is_guest=False
    )
