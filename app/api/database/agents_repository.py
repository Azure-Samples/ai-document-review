from common.logger import get_logger
from typing import Any, Dict, List
from common.models import Agent
from config.config import settings
from database.db_client import CosmosDBClient

logging = get_logger(__name__)

class AgentsRepository:
    def __init__(self) -> None:
        """Initialize the AgentsRepository with a CosmosDBClient."""
        self.db_client = CosmosDBClient(settings.agents_container)

    async def get_agents_by_name_and_type(self, name: str, type: str) -> List[Agent]:
        """
        Retrieve an agent by name.

        Args:
            name (str): The name of the agent to retrieve.
            type (str): The type of the agent to retrieve

        Returns:
            Agent: The agent with the specified name.
        """
        logging.info(f"Retrieving agent by name and type {name}, {type}")
        agents = await self.db_client.retrieve_items_by_values({"name": name, "type": type})
        logging.info(f"Retrieved agents by name and type: {agents}")
        return [Agent(**agent) for agent in agents]


    async def get_all_agents(self) -> List[Agent]:
        """
        Retrieve all agents.

        Returns:
            List[Agent]: List of all agents
        """
        logging.info("Retrieving all agents.")
        agents = await self.db_client.retrieve_items()
        logging.info(f"Retrieved {len(agents)} agents.")
        return [Agent(**agent) for agent in agents]

    async def create_agent(self, agent: Agent) -> str:
        """
        Create an agent.

        Args:
            agent (Agent): The agent to create.

        Returns:
            Agent: The created agent
        """
        logging.info("Creating an agent.")
        new_agent_data = await self.db_client.store_item(agent.model_dump())
        new_agent = Agent(**new_agent_data)
        logging.info(f"Agent created: {new_agent.id}")
        return new_agent
    
    async def delete_agent(self, agent_id: str) -> None:
        """
        Delete an agent.

        Args:
            agent_id (str): The ID of the agent to delete.
        """
        logging.info(f"Deleting agent: {agent_id}")
        await self.db_client.delete_item(agent_id)
        logging.info(f"Deleted agent: {agent_id}")
    
    async def update_agent(self, agent_id: str, fields: Dict[str, Any]) -> None:
        """
        Update an agent.

        Args:
            agent (Agent): The agent to update.
        """
        logging.info(f"Updating agent {agent_id}")
        agent = await self.db_client.retrieve_item_by_id(agent_id, agent_id)
        if agent:
            for field, value in fields.items():
                agent[field] = value

            updated_agent = await self.db_client.store_item(agent)
            logging.info(f"Agent updated: {agent_id}")
            return Agent(**updated_agent)
        else:
            raise ValueError(f"Agent {agent_id} not found.")
