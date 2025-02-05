from azure.cosmos import CosmosClient
from typing import List
from azure.cosmos import CosmosClient
from azure.identity import DefaultAzureCredential


# Replace with your actual Cosmos DB endpoint
COSMOS_DB_ENDPOINT = "https://cdb-adr14-env14.documents.azure.com:443/"
DATABASE_NAME = "state"
CONTAINER_NAME = "agents"

def get_cosmos_client():
    """Singleton-style helper to avoid recreating the Cosmos client using DefaultAzureCredential."""
    credential = DefaultAzureCredential()
    return CosmosClient(COSMOS_DB_ENDPOINT, credential=credential)

def get_container():
    """Get Cosmos DB container client."""
    client = get_cosmos_client()
    database = client.get_database_client(DATABASE_NAME)
    return database.get_container_client(CONTAINER_NAME)



def retrieve_distinct_agent_types() -> List[str]:
    """
    Retrieve distinct agent types from the Cosmos DB container,
    getting the latest entry for each type based on updated_at_UTC or created_at_UTC.
    """
    try:
        container = get_container()
        query = """
        SELECT DISTINCT VALUE c.type
        FROM c 
        WHERE c.type != null
        """
        result = container.query_items(query=query, enable_cross_partition_query=True)
        return list(result)
    except Exception as e:
        print(f"Error fetching agent types: {e}")
        return []


async def fetch_latest_prompt_by_type(issue_type: str) -> str:
    """
    Fetch the latest prompt from Cosmos DB for a specific agent type.
    
    :param issue_type: The agent type.
    :return: The prompt content as a string.
    """
    try:
        container = get_container()
        query = """
        SELECT * 
        FROM c 
        WHERE c.type = @type
        ORDER BY c.updated_at_UTC DESC, c.created_at_UTC DESC
        """
        parameters = [{"name": "@type", "value": issue_type}]
        items = container.query_items(query=query, parameters=parameters, enable_cross_partition_query=True)
        
        prompt_item = next(items, None)
        return prompt_item.get('guideline_prompt', '') if prompt_item else ''
    except Exception as e:
        print(f"Error fetching prompt for type '{issue_type}': {e}")
        return ''
