from http.client import HTTPResponse

from fastapi.responses import JSONResponse
from common.Exceptions import AgentConflictError
from dependencies import get_agents_service
from common.logger import get_logger
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from security.auth import validate_authenticated
from common.models import Agent, CreateAgent, UpdateAgent

router = APIRouter()
logging = get_logger(__name__)

@router.get(
    "/api/v1/admin/agents",
    summary="Get all agents",
    responses={
        200: {"description": "Agents Collection"},
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
        201: {"description": "Created Agent"},
        401: {"description": "Unauthorized"},
        500: {"description": "Internal server error"},
        400: {"description": "Bad request"},
        409: {"description": "Conflict"},
    },
)
async def create_agent(
    agent: CreateAgent,
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
        created_agent = await agents_service.create_agent(agent, user)
        return JSONResponse(status_code=201, content=created_agent.dict())
    except ValueError as exc:
        raise HTTPException(status_code=400, detail={"description": str(exc)})     
    except AgentConflictError as ex:
        raise HTTPException(status_code=409, detail={"description": str(ex)})
    except Exception as e:
        logging.error(f"Error creating agent: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.delete(
    "/api/v1/admin/agents/{agent_id}",
    summary="Delete an agent",
    responses={
        204: {"description": "Agent deleted successfully"},
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
        await agents_service.delete_agent(agent_id)
        return HTTPResponse(status=204, content={})
    except Exception as e:
        logging.error(f"Error deleting agent: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.patch(
    "/api/v1/admin/agents/{agent_id}",
    summary="Update an agent",
    responses={
        200: {"description": "Updated Agent"},
        401: {"description": "Unauthorized"},
        500: {"description": "Internal server error"},
        400: {"description": "Bad request"},

    },
)
async def update_agent(
    agent_id,
    agent: UpdateAgent,
    user=Depends(validate_authenticated),
    agents_service=Depends(get_agents_service)
):
    """
    Update an agent.

    Args:
        agent_id (str): The agent ID to update.
        agent (Agent): The agent to update.
        user (Depends): The authenticated user.
    
    Returns:
        str: The updated agent ID.
    """
    try:
        updated_agent = await agents_service.update_agent(agent_id, agent, user)
        return HTTPResponse(status=200, content=updated_agent)
    except ValueError as ex:
        raise HTTPException(status_code=400, detail={"description": str(ex)})
    except AgentConflictError as ex:
        raise HTTPException(status_code=409, detail={"description": str(ex)})
    except Exception as e:
        logging.error(f"Error updating agent: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")
