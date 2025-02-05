from azure.cosmos import CosmosClient
from azure.identity import DefaultAzureCredential
from config.config import settings


class CosmosDBConfig:
    def __init__(self, container_name) -> None:
        """Initialize Cosmos DB configuration using settings."""
        self.cosmos_url = settings.cosmos_url
        self.database_name = settings.database_name
        self.container_name = container_name

        # Initialize the Cosmos client
        default_credential = DefaultAzureCredential()
        self.client = CosmosClient(self.cosmos_url, default_credential)

    def get_client(self) -> CosmosClient:
        """Return the initialized Cosmos client."""
        return self.client

    def get_database_name(self) -> str:
        """Return the database name."""
        return self.database_name

    def get_container_name(self) -> str:
        """Return the container name."""
        return self.container_name
