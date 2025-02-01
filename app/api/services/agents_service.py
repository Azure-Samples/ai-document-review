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
        """Initialize the service with the given repository."""
        self.agents_repository = agents_repository

    async def get_all_agents(self) -> List[Agent]:
        """
        Retrieves all agents.

        Returns:
            List[Agent]: A list of all agents in the repository.
        """
        try:
            logging.debug("Retrieving all agents.")
            agents = await self.agents_repository.get_all_agents()
            logging.debug(f"Retrieved {len(agents)} agents successfully.")
            return agents
        except Exception as e:
            logging.error(f"Error retrieving agents: {e}")
            raise e

    async def create_agent(self, agent: CreateAgent, user: User) -> Agent:
        """
        Creates a new agent.

        Args:
            agent (CreateAgent): The data for the agent to create.
            user (User): The authenticated user creating the agent.

        Returns:
            Agent: The newly created agent.
        """
        try:
            logging.debug(f"Attempting to create agent: {agent}")
            agent.name = agent.name.strip()
            agent.type = agent.type.strip()
            existing_agents = await self.agents_repository.get_agents_by_name_and_type(agent.name, agent.type)
            if existing_agents:
                logging.error(f"Agent with name '{agent.name}' and type '{agent.type}' already exists.")
                raise ConflictError(f"Agent with name '{agent.name}' and type '{agent.type}' already exists.")

            new_agent = Agent(
                **agent.model_dump(),
                id=str(uuid.uuid4()),
                created_at_UTC=datetime.datetime.now(datetime.timezone.utc).isoformat(),
                created_by=user.oid
            )
            created_agent = await self.agents_repository.create_agent(new_agent)
            logging.info(f"Agent created successfully with ID: {new_agent.id}")
            return created_agent
        except Exception as e:
            logging.error(f"Error creating agent: {e}")
            raise e

    async def delete_agent(self, agent_id: str) -> None:
        """
        Deletes an agent by ID.

        Args:
            agent_id (str): The ID of the agent to delete.
        """
        try:
            logging.debug(f"Attempting to delete agent with ID: {agent_id}")
            await self.agents_repository.delete_agent(agent_id)
            logging.info(f"Agent with ID {agent_id} successfully deleted.")
        except Exception as e:
            logging.error(f"Error deleting agent with ID {agent_id}: {e}")
            raise e

    async def update_agent(self, agent_id: str, input_agent: UpdateAgent, user: User) -> Agent:
        """
        Updates an existing agent.

        Args:
            agent_id (str): The ID of the agent to update.
            input_agent (UpdateAgent): The updated details for the agent.
            user (User): The authenticated user performing the update.

        Returns:
            Agent: The updated agent object.
        """
        try:
            logging.debug(f"Starting update for agent with ID: {agent_id}")
            input_agent.name = input_agent.name.strip()
            input_agent.type = input_agent.type.strip()
            self._validate_agent_id(agent_id)
            self._validate_input_agent(input_agent)

            agent_to_update = await self.agents_repository.get_agent_by_id(agent_id)
            if not agent_to_update:
                logging.error(f"Agent with ID {agent_id} not found.")
                raise ResourceNotFoundError(f"Agent with ID {agent_id} not found.")

            if not any([input_agent.name, input_agent.type, input_agent.guideline_prompt]):
                logging.error("No valid fields provided for update.")
                raise ValueError("At least one of 'name', 'type', or 'guideline_prompt' must be provided.")

            # Check for conflicts with existing agents
            new_name = input_agent.name if input_agent.name and input_agent.name != "" else agent_to_update.name
            new_type = input_agent.type if input_agent.type and input_agent.type != "" else agent_to_update.type
            await self._ensure_no_conflict(agent_id, new_name, new_type)

            update_fields = self._build_update_fields(input_agent, user)
            updated_agent = await self.agents_repository.update_agent(agent_id, update_fields)
            logging.info(f"Agent with ID {agent_id} successfully updated.")
            return updated_agent
        except Exception as e:
            logging.error(f"Error updating agent with ID {agent_id}: {e}")
            raise e

    def _validate_agent_id(self, agent_id: str) -> None:
        """Validates the agent ID."""
        if not agent_id or not agent_id.strip():
            logging.error("Invalid or empty agent ID.")
            raise ValueError("Agent ID is required.")

    def _validate_input_agent(self, input_agent: UpdateAgent) -> None:
        """Validates the input data for an agent."""
        if not input_agent:
            logging.error("Input agent data is missing.")
            raise ValueError("Input agent data is required.")

    async def _ensure_no_conflict(self, agent_id: str, name: str, agent_type: str) -> None:
        """Ensures there are no conflicts with existing agents."""
        existing_agents = await self.agents_repository.get_agents_by_name_and_type(name, agent_type)
        if any(agent.id != agent_id for agent in existing_agents):
            logging.error(f"Conflict detected: Agent with name '{name}' and type '{agent_type}' already exists.")
            raise ConflictError(f"Agent with name '{name}' and type '{agent_type}' already exists.")

    def _build_update_fields(self, input_agent: UpdateAgent, user: User) -> Dict[str, Any]:
        """
        Constructs the dictionary of fields to update for an agent.

        Args:
            input_agent (UpdateAgent): The provided updates for the agent.
            user (User): The authenticated user performing the update.

        Returns:
            Dict[str, Any]: A dictionary of fields to update.
        """
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
