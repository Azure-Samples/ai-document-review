
import datetime
import uuid
from common.Exceptions import ConflictError
from common.logger import get_logger
from common.models import CreateSetting, Setting
from database.settings_repository import SettingsRepository
from fastapi_azure_auth.user import User


logging = get_logger(__name__)


class SettingsService:
    def __init__(self, settings_repository: SettingsRepository) -> None:
        """Initialize the service with the given repository."""
        self.settings_repository = settings_repository

    async def get_all_settings(self) -> dict:
        """
        Retrieves all settings.

        Returns:
            dict: A dictionary of all settings in the repository.
        """
        try:
            logging.debug("Retrieving all settings.")
            settings = await self.settings_repository.get_all_settings()
            logging.debug(f"Retrieved {len(settings)} settings successfully.")
            return settings
        except Exception as e:
            logging.error(f"Error retrieving settings: {e}")
            raise e
    
    async def create_setting(self, setting: CreateSetting, user: User) -> Setting:
        """
        Creates a new setting.

        Args:
            setting (dict): The data for the setting to create.
            user (User): The authenticated user creating the setting.

        Returns:
            Setting: The newly created setting.
        """
        try:
            logging.debug(f"Attempting to create setting: {setting}")
            setting.name = setting.name.strip()
            setting.value = setting.value.strip()
            existing_settings = await self.settings_repository.get_settings_by_name(setting.name.strip())
            if existing_settings or len(existing_settings) > 0:
                logging.error(f"Setting with name '{setting.name}' already exists.")
                raise ConflictError(f"Setting with name '{setting.name}' already exists")
            new_setting = Setting(
                **setting.model_dump(),
                id=str(uuid.uuid4()),
                created_at_UTC=datetime.datetime.now(datetime.timezone.utc).isoformat(),
                created_by="user.oid"
            )
            new_setting = await self.settings_repository.create_setting(new_setting)
            logging.info(f"Setting created successfully with ID: {new_setting.id}")
            return new_setting
        except Exception as e:
            logging.error(f"Error creating setting: {e}")
            raise e
    
    async def delete_setting(self, setting_id: str) -> None:
        """
        Deletes a setting by name.

        Args:
            setting_name (str): The name of the setting to delete.
        """
        try:
            logging.debug(f"Attempting to delete setting: {setting_id}")
            await self.settings_repository.delete_setting(setting_id)
            logging.info(f"Setting deleted successfully: {setting_id}")
        except Exception as e:
            logging.error(f"Error deleting setting: {e}")
            raise e

