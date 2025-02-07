from common.logger import get_logger
from azure.cosmos.exceptions import CosmosHttpResponseError
from database.config import CosmosDBConfig
from typing import Any, Dict, List, Optional


logging = get_logger(__name__)

class CosmosDBClient:
    def __init__(self, container_name: str) -> None:
        """Initialize the CosmosDBClient, setting up the database and container."""
        config = CosmosDBConfig(container_name)
        self.client = config.get_client()
        self.database = self.client.get_database_client(config.get_database_name())
        self.container = self.database.get_container_client(container_name)


    async def store_item(self, item: Dict[str, any]) -> None:
        """
        Store an item in the Cosmos DB container.

        :param item: A dictionary representing the item to store. Must contain an 'id' field.
        """
        try:
            self.container.upsert_item(body=item)
            logging.info("Item stored successfully.")
        except CosmosHttpResponseError as e:
            logging.error(f"An error occurred while storing the item: {e}")
            raise e


    async def retrieve_item_by_id(self, item_id: str, partition_key: str) -> Optional[Dict[str, Any]]:
        """
        Retrieve an item from the Cosmos DB container by its ID.

        :param item_id: The ID of the item to retrieve.
        :return: The item if found, or None if not found or an error occurs.
        """
        try:
            item = self.container.read_item(item=item_id, partition_key=partition_key)
            return item
        except CosmosHttpResponseError as e:
            if e.status_code == 404:
                logging.warning(f"Item with ID {item_id} not found.")
                return None
            else:
                logging.error(f"An error occurred while retrieving the item: {e}")
                return None


    async def retrieve_items_by_values(self, filters: Dict[str, Any], partition_key: str | None = None) -> Optional[List[Dict[str, Any]]]:
        """
        Retrieve items from the Cosmos DB container where specified columns match the given values.
        
        :param filters: A dictionary where keys are column names and values are the values to match.
        :return: A list of items matching the criteria, or None if an error occurs.
        """
        try:
            # Construct the query dynamically based on the filters provided
            filter_clauses = [f"c.{column}=@{column}" for column in filters.keys()]
            query = f"SELECT * FROM c WHERE " + " AND ".join(filter_clauses)
            parameters = [{"name": f"@{column}", "value": value} for column, value in filters.items()]
            
            # Execute the query
            items = self.container.query_items(
                query=query,
                parameters=parameters,
                partition_key=partition_key,
                enable_cross_partition_query=partition_key is None,
            )

            # Convert the iterator to a list
            items_list = list(items)
            
            return items_list
        
        except CosmosHttpResponseError as e:
            logging.error(f"An error occurred while retrieving items: {e}")
            return None


    async def delete_items_by_values(self, filters: Dict[str, Any], partition_key: str | None = None) -> None:
        """
        Delete items from the Cosmos DB container where specified columns match the given values.
        
        :param filters: A dictionary where keys are column names and values are the values to match.
        """
        try:
            # Delete each item
            for item in await self.retrieve_items_by_values(filters, partition_key):
                self.container.delete_item(item, partition_key=partition_key)

            logging.info("Items deleted successfully.")

        except CosmosHttpResponseError as e:
            logging.error(f"An error occurred while deleting items: {e}")
            raise e
