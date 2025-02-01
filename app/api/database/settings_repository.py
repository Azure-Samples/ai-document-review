from common.logger import get_logger
from common.logger import get_logger
from typing import Any, Dict, List
from common.models import Agent, Setting
from config.config import settings as app_config_settings
from database.db_client import CosmosDBClient


logging = get_logger(__name__)

class SettingsRepository:
    def __init__(self) -> None:
        """
        Initialize the SettingRepository.

        Sets up a connection to the CosmosDB container using the database client.
        """
        self.db_client = CosmosDBClient(app_config_settings.settings_container)
    
    async def get_all_settings(self) -> List[Setting]:
        """
        Retrieve all settings.

        Returns:
            List[Setting]: A list of all settings.
        """
        logging.info("Retrieving all settings.")
        settings = await self.db_client.retrieve_items()
        if not settings:
            logging.info("No settings found.")
            return []
        logging.info(f"Retrieved {len(settings)} settings.")
        return [Setting(**setting) for setting in settings]
    
    async def create_setting(self, setting: Setting) -> Setting:
        """
        Create a new setting.

        Args:
            setting (Setting): The setting to create.

        Returns:
            Setting: The newly created setting.
        """
        logging.info(f"Creating setting: {setting}")
        if not setting.name or not setting.value:
            raise ValueError("Both 'name' and 'value' fields must be provided.")
        new_setting_data = await self.db_client.store_item(setting.model_dump())
        new_setting = Setting(**new_setting_data)
        logging.info(f"Setting created successfully with name: {new_setting.name}")
        return new_setting
    
    async def delete_setting(self, setting_id: str) -> None:
        """
        Delete a setting by its ID.

        Args:
            setting_id (str): The ID of the setting to delete.
        """
        logging.info(f"Deleting setting by ID: {setting_id}")
        await self.db_client.delete_item(setting_id)
        logging.info(f"Deleted setting by ID: {setting_id}")
    
    async def get_settings_by_name(self, name: str) -> List[Setting]:
        """
        Retrieve settings by name.

        Args:
            name (str): The name of the setting to retrieve.

        Returns:
            List[Setting]: A list of settings with the given name.
        """
        logging.info(f"Retrieving settings by name: {name}")
        filter = { "name": name }
        settings = await self.db_client.retrieve_items_by_values(filter)
        if not settings:
            logging.info(f"No settings found by name: {name}")
            return []
        logging.info(f"Retrieved {len(settings)} settings by name: {name}")
        return [Setting(**setting) for setting in settings]