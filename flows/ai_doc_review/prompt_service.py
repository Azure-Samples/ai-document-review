from azure.cosmos import CosmosClient
from common.models import IssueType
from typing import Optional, Dict, List, Any


# Hardcoded Cosmos DB details
COSMOS_DB_ENDPOINT = "<cosmos-db-endpoint>"
COSMOS_DB_KEY = "<cosmos-db-key>"
DATABASE_NAME = "<database-name>"
CONTAINER_NAME = "<container-name>"

async def retrieve_items_by_values(filters: Dict[str, Any]) -> Optional[List[Dict[str, Any]]]:
    """
    Retrieve items from Cosmos DB container where specified columns match the given values.
    This method will return the most recent prompt based on updated_at_UTC and if None, created_at_UTC.

    :param filters: A dictionary where keys are column names and values are the values to match.
    :return: A list of items matching the criteria, or None if an error occurs.
    """
    try:
        # Initialize Cosmos DB client
        client = CosmosClient(COSMOS_DB_ENDPOINT, COSMOS_DB_KEY)
        database = client.get_database_client(DATABASE_NAME)
        container = database.get_container_client(CONTAINER_NAME)

        # Construct the query dynamically based on the filters provided
        filter_clauses = [f"c.{column}=@{column}" for column in filters.keys()]
        query = f"SELECT * FROM c WHERE " + " AND ".join(filter_clauses)
        parameters = [{"name": f"@{column}", "value": value} for column, value in filters.items()]
        
        # Execute the query
        items = container.query_items(
            query=query,
            parameters=parameters,
            enable_cross_partition_query=True,
        )
        
        items_list = list(items)
        
        # Sort the items based on updated_at_UTC (if available) or created_at_UTC
        items_list.sort(key=lambda x: x.get('updated_at_UTC', x.get('created_at_UTC')), reverse=True)

        return items_list[0] if items_list else None
    except Exception as e:
        # TODO: Use default prompt if required
        print(f"Error fetching items: {e}")
        return None

async def fetch_prompt_from_db(issue_type: IssueType) -> str:
    """
    Fetch the latest prompt for a given issue type from Cosmos DB.
    
    :param issue_type: The type of issue (e.g., GrammarSpelling, DefinitiveLanguage)
    :return: The prompt content as a string
    """
    filters = {
        'type': issue_type.value,
    }

    # Fetch the prompt item from Cosmos DB
    prompt_item = await retrieve_items_by_values(filters)
    
    if prompt_item:
        return prompt_item.get('guideline_prompt', '') 
    return '' 
