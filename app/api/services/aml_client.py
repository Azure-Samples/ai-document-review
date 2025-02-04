import json
from typing import Any, AsyncGenerator
import requests
from http import HTTPStatus
from fastapi import HTTPException
from sseclient import SSEClient
from config.config import settings
from common.logger import get_logger
from requests.exceptions import HTTPError, RequestException

logging = get_logger(__name__)

class AMLClient:
    def __init__(self, credential):
        self.credential = credential

    async def call_aml_endpoint(self, endpoint_name: str, pdf_name: str) -> AsyncGenerator[Any, Any]:
        """
        Calls the flow endpoint with the name and data.

        Args:
            endpoint_name (str): The name of the flow endpoint.
            pdf_name (str): The filename of the PDF in storage.
        """

        # Get the scoring URI and API key
        scoring_uri = f"https://{endpoint_name}.azurewebsites.net/score"

        # Get access token from local endpoint
        keys = self.credential.get_token(f"api://{settings.flow_app_name}/.default")

        if not hasattr(keys, 'token'):
            raise Exception(f"Unable to retrieve token for the flow endpoint: {endpoint_name}. It may not have Entra Auth enabled.")

        headers = {'Content-Type': 'application/json', 'Authorization': f'Bearer {keys.token}', 'Accept': 'text/event-stream'}
        data = {
            "pdf_name": pdf_name,
            "stream": True,
            "pagination": settings.flow_streaming_batch_size
        }

        try:
            logging.info("Sending POST request to the flow endpoint...")
            response = requests.post(scoring_uri, json=data, headers=headers, stream=True)
            response.raise_for_status()

            content_type = response.headers.get('Content-Type', '')
            if "text/event-stream" in content_type:
                logging.info("Streaming response received, processing events...")
                client = SSEClient(response)

                for event in client.events():
                    logging.info(f"Received event: {event.data}")
                    event_data = json.loads(event.data)
                    if "flow_output_streaming" in event_data:
                        yield event_data["flow_output_streaming"]
                    elif "flow_output" in event_data:
                        logging.debug("Ignoring non-streaming response event.")
                    else:
                        raise RequestException("Unexpected event payload from flow endpoint. Missing 'flow_output_streaming' property.")

            else:
                raise RequestException("Unexpected non-streaming response received from flow endpoint.")

        except HTTPError as http_err:
            logging.error(f"HTTP error occurred: {http_err}")
            raise HTTPException(
                status_code=response.status_code,
                detail=f"Error from flow: {http_err.response.text}"
            )
        except RequestException as req_err:
            logging.error(f"Request error occurred: {req_err}")
            raise HTTPException(
                status_code=HTTPStatus.INTERNAL_SERVER_ERROR,
                detail="An error occurred during the request."
            )
        except Exception as e:
            logging.error(f"An unexpected error occurred: {e}")
            raise e
