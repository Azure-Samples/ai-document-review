import datetime
import uuid
from common.logger import get_logger
from typing import List
from database.agents_repository import AgentsRepository
from common.models import Agent, InputAgent
from fastapi_azure_auth.user import User


logging = get_logger(__name__)

class AgentsService:
    def __init__(self, agents_repository: AgentsRepository) -> None:
        self.agents_repository = agents_repository

    async def get_all_agents(self) -> List[Agent]:
        """
        Retrieves all agents.

        Returns:
            List[Agent]: List of all agents
        """
        try:
            logging.debug("Retrieving all agents")
            agents = await self.agents_repository.get_all_agents()
            return agents
        except Exception as e:
            logging.error(f"Error retrieving agents: {str(e)}")
            raise e

    async def create_agent(self, agent: InputAgent, user: User) -> Agent:
        """
        Creates an agent.

        Args:
            agent (Agent): The agent to create.

        Returns:
            Agent: The created agent
        """
        try:
            logging.debug("Creating an agent")
            existing_agents = await self.agents_repository.get_agents_by_name_and_type(agent.name, agent.type)
            if len(existing_agents) > 0:
                raise ValueError(f"Agent with name {agent.name} and type {agent.type} already exists")
            new_agent = Agent(
                **agent.model_dump(),
                id=str(uuid.uuid4()),
                created_at_UTC=datetime.datetime.now(datetime.timezone.utc).isoformat(),
                created_by=user.oid
            )
            created_agent_id = await self.agents_repository.create_agent(new_agent)
            return created_agent_id
        except Exception as e:
            logging.error(f"Error creating agent: {str(e)}")
            raise e
    
    async def delete_agent(self, agent_id: str) -> None:
        """
        Deletes an agent.

        Args:
            agent_id (str): The agent id to delete.
        """
        try:
            logging.debug("Deleting an agent")
            await self.agents_repository.delete_agent(agent_id)
        except Exception as e:
            logging.error(f"Error deleting agent: {str(e)}")
            raise e
    
    async def update_agent(self, agent_id: str, agent: InputAgent, user: User) -> None:
        """
        Updates an agent.

        Args:
            agent (Agent): The agent to update.
        """
        try:
            logging.debug("Updating an agent")
            if not agent_id:
                raise ValueError("Agent id is required")
            update_fields = {
                "name": agent.name,
                "type": agent.type,
                "guideline_prompt": agent.guideline_prompt,
                "updated_at_UTC": datetime.datetime.now(datetime.timezone.utc).isoformat(),
                "updated_by": user.oid
            }
            updated_agent = await self.agents_repository.update_agent(agent_id, update_fields)
            return updated_agent.id
        except Exception as e:
            logging.error(f"Error updating agent: {str(e)}")
            raise e
