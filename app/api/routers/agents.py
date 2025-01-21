from dependencies import get_agents_service
from common.logger import get_logger
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from security.auth import validate_authenticated
from common.models import Agent, InputAgent

router = APIRouter()
logging = get_logger(__name__)

@router.get(
    "/api/v1/admin/agents",
    summary="Get all agents",
    responses={
        200: {"description": "Agents retrieved successfully"},
        401: {"description": "Unauthorized"},
        500: {"description": "Internal server error"},
    },
)
async def get_agents(
    user=Depends(validate_authenticated),
    agents_service=Depends(get_agents_service)
) -> List[Agent]:
    """
    Retrieve all agents.

    Args:
        user (Depends): The authenticated user.
    """
    try:
        agents = await agents_service.get_all_agents()
        return agents
    except Exception as e:
        logging.error(f"Error retrieving agents: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.post(
    "/api/v1/admin/agents",
    summary="Create an agent",
    responses={
        201: {"description": "Agent created successfully"},
        401: {"description": "Unauthorized"},
        500: {"description": "Internal server error"},
    },
)
async def create_agent(
    agent: InputAgent,
    user=Depends(validate_authenticated),
    agents_service=Depends(get_agents_service)
) -> str:
    """
    Create an agent.

    Args:
        agent (Agent): The agent to create.
        user (Depends): The authenticated user.
    """
    try:
        created_agent_id = await agents_service.create_agent(agent, user)
        return created_agent_id
    except Exception as e:
        logging.error(f"Error creating agent: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.delete(
    "/api/v1/admin/agents/{agent_id}",
    summary="Delete an agent",
    responses={
        200: {"description": "Agent deleted successfully"},
        401: {"description": "Unauthorized"},
        500: {"description": "Internal server error"},
    },
)
async def delete_agent(
    agent_id,
    user=Depends(validate_authenticated),
    agents_service=Depends(get_agents_service)
):
    """
    Delete an agent.

    Args:
        agent_id (str): The agent ID to delete.
        user (Depends): The authenticated.
        agents_service (Depends): The agents service.

    """
    try:
        deleted_agent_id = await agents_service.delete_agent(agent_id)
        return deleted_agent_id
    except Exception as e:
        logging.error(f"Error deleting agent: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.patch(
    "/api/v1/admin/agents/{agent_id}",
    summary="Update an agent",
    responses={
        200: {"description": "Agent updated successfully"},
        401: {"description": "Unauthorized"},
        500: {"description": "Internal server error"},
    },
)
async def update_agent(
    agent_id,
    agent: InputAgent,
    user=Depends(validate_authenticated),
    agents_service=Depends(get_agents_service)
):
    """
    Update an agent.

    Args:
        agent_id (str): The agent ID to update.
        agent (Agent): The agent to update.
        user (Depends): The authenticated user.
    """
    try:
        updated_agent_id = await agents_service.update_agent(agent_id, agent, user)
        return updated_agent_id
    except Exception as e:
        logging.error(f"Error updating agent: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")
