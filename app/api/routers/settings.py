from fastapi.responses import JSONResponse
from common.Exceptions import ConflictError, ResourceNotFoundError
from dependencies import get_settings_service
from common.logger import get_logger
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from security.auth import validate_authenticated
from common.models import Setting, CreateSetting

router = APIRouter()
logging = get_logger(__name__)

@router.get(
    "/api/v1/admin/settings",
    summary="Get all settings",
    responses={
        200: {"description": "Settings Collection"},
        401: {"description": "Unauthorized"},
        500: {"description": "Internal server error"},
    },
)
async def get_settings(
    user={"oid": "1234"},
    settings_service=Depends(get_settings_service)
) -> List[Setting]:
    """
    Retrieve all settings.

    Args:
        user (Depends): The authenticated user.
        settings_service (Depends): The service to interact with settings.

    Returns:
        List[Setting]: A list of all settings.
    """
    try:
        settings = await settings_service.get_all_settings()
        return settings
    except Exception as e:
        logging.error(f"Error retrieving settings: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post(
    "/api/v1/admin/settings",
    summary="Create a setting",
    responses={
        201: {"description": "Created setting"},
        401: {"description": "Unauthorized"},
        500: {"description": "Internal server error"},
        400: {"description": "Bad request"},
        409: {"description": "Conflict"},
    },
)
async def create_setting(
    setting: CreateSetting,
    user={},
    settings_service=Depends(get_settings_service)
) -> str:
    """
    Create a new setting.

    Args:
        setting (CreateSetting): The setting data to create.
        user (Depends): The authenticated user.
        settings_service (Depends): The service to interact with settings.

    Returns:
        str: The JSON representation of the created setting.
    """
    try:
        created_setting = await settings_service.create_setting(setting, user)
        return JSONResponse(status_code=201, content=created_setting.dict())
    except ValueError as exc:
        raise HTTPException(status_code=400, detail={"description": str(exc)})     
    except ConflictError as ex:
        raise HTTPException(status_code=409, detail={"description": str(ex)})
    except Exception as e:
        logging.error(f"Error creating setting: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.delete(
    "/api/v1/admin/settings/{setting_id}",
    summary="Delete a setting",
    responses={
        204: {"description": "Setting deleted successfully"},
        401: {"description": "Unauthorized"},
        500: {"description": "Internal server error"},
    },
    status_code=204,  # Explicitly set the response code
)
async def delete_setting(
    setting_id: str,
    user={},
    settings_service=Depends(get_settings_service)
):
    """
    Delete a setting by its name.

    Args:
        setting_id (str): The ID of the setting to delete.
        user (Depends): The authenticated user.
        settings_service (Depends): The service to interact with settings.

    Returns:
        None
    """
    try:
        await settings_service.delete_setting(setting_id)
    except Exception as e:
        logging.error(f"Error deleting setting: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")
