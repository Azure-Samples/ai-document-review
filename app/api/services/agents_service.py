import datetime
import uuid
from common.Exceptions import ConflictError, ResourceNotFoundError
from common.logger import get_logger
from typing import Any, Dict, List
from database.agents_repository import AgentsRepository
from common.models import Agent, CreateAgent, UpdateAgent
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
            logging.debug("Retrieving all agents.")
            agents = await self.agents_repository.get_all_agents()
            logging.debug(f"Retrieved {len(agents)} agents.")
            return agents
        except Exception as e:
            logging.error(f"Error retrieving agents: {str(e)}")
            raise e

    async def create_agent(self, agent: CreateAgent, user: User) -> Agent:
        """
        Creates an agent.

        Args:
            agent (CreateAgent): The agent to create.
            user (User): The user creating the agent.

        Returns:
            Agent: The created agent object.
        """
        try:
            logging.debug("Creating an agent")
            existing_agents = await self.agents_repository.get_agents_by_name_and_type(agent.name, agent.type)
            if len(existing_agents) > 0:
                raise ConflictError(f"Agent with name {agent.name} and type {agent.type} already exists")
            new_agent = Agent(
                **agent.model_dump(),
                id=str(uuid.uuid4()),
                created_at_UTC=datetime.datetime.now(datetime.timezone.utc).isoformat(),
                created_by=user.oid
            )
            created_agent = await self.agents_repository.create_agent(new_agent)
            return created_agent
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
            logging.debug(f"Deleted agent with id {agent_id}")
        except Exception as e:
            logging.error(f"Error deleting agent: {str(e)}")
            raise e
    
    async def update_agent(self, agent_id: str, input_agent: UpdateAgent, user: User) -> Agent:
        """
        Updates an agent with provided details.

        Args:
            agent_id (str): The ID of the agent to update.
            input_agent (UpdateAgent): The details to update the agent with.
            user (User): The user performing the update.

        Returns:
            Agent: The updated agent object.
        """
        try:
            logging.debug(f"Starting agent update process for agent_id={agent_id}")
            
            self._validate_agent_id(agent_id)
            self._validate_input_agent(input_agent)

            # Ensure the agent exists
            agent_to_update = await self.agents_repository.get_agent_by_id(agent_id)
            if not agent_to_update:
                logging.error(f"Agent with id {agent_id} not found.")
                raise ResourceNotFoundError(f"Agent with id {agent_id} not found.")
            
            # Ensure at least one field is being updated
            if not any([input_agent.name, input_agent.type, input_agent.guideline_prompt]):
                logging.error("At least one of 'name', 'type', or 'guideline_prompt' must be provided.")
                raise ValueError("At least one of 'name', 'type', or 'guideline_prompt' must be provided.")

            # Check for conflicts with existing agents
            new_name = input_agent.name if input_agent.name and input_agent.name != "" else agent_to_update.name
            new_type = input_agent.type if input_agent.type and input_agent.type != "" else agent_to_update.type
            await self._ensure_no_conflict(agent_id, new_name, new_type)

            # Build update fields
            update_fields = self._build_update_fields(input_agent, user)

            # Perform the update
            updated_agent = await self.agents_repository.update_agent(agent_id, update_fields)
            logging.info(f"Agent with id {agent_id} successfully updated.")
            return updated_agent
        except Exception as e:
            logging.error(f"Error updating agent: {str(e)}")
            raise e

    def _validate_agent_id(self, agent_id: str) -> None:
        """Validates the agent ID."""
        if not agent_id or not agent_id.strip():
            logging.error("Invalid or empty agent ID provided.")
            raise ValueError("Agent ID is required.")

    def _validate_input_agent(self, input_agent: UpdateAgent) -> None:
        """Validates the input agent details."""
        if not input_agent:
            logging.error("Input agent details are missing.")
            raise ValueError("Input agent details are required.")

    async def _ensure_no_conflict(self, agent_id: str, name: str, agent_type: str) -> None:
        """Ensures there are no conflicts with existing agents."""
        existing_agents = await self.agents_repository.get_agents_by_name_and_type(name, agent_type)
        if any(agent.id != agent_id for agent in existing_agents):
            logging.error(f"Conflict detected: Agent with name={name} and type={agent_type} already exists.")
            raise ConflictError(f"Agent with name '{name}' and type '{agent_type}' already exists.")

    def _build_update_fields(self, input_agent: UpdateAgent, user: User) -> Dict[str, Any]:
        """Builds a dictionary of fields to update."""
        update_fields = {
            key: value for key, value in {
                "name": input_agent.name,
                "type": input_agent.type,
                "guideline_prompt": input_agent.guideline_prompt
            }.items() if value
        }

        update_fields["updated_by"] = user.oid
        update_fields["updated_at_UTC"] = datetime.datetime.now(datetime.timezone.utc).isoformat()
        return update_fields
