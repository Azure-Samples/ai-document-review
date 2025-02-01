import { InteractionRequiredAuthError } from '@azure/msal-browser'
import { EventSourceMessage, fetchEventSource } from '@microsoft/fetch-event-source'
import { accessTokenRequest } from '../authConfig'
import { msalInstance } from '../main'
import { FatalError, RetriableError } from '../types/error'

const apiBaseUrl = '/api/v1/'
const agentsPath = 'admin/agents/'
const unknownError = 'an unknown error occurred. Please try again.'

class AbortedError extends Error {}

export async function getAccessToken() {
  const account = msalInstance.getActiveAccount()!

  try {
    const tokenResponse = await msalInstance.acquireTokenSilent({
      ...accessTokenRequest,
      account
    })
    return tokenResponse.accessToken
  } catch (err) {
    console.warn('Unable to get a token silently', err)
    if (err instanceof InteractionRequiredAuthError) {
      const tokenResponse = await msalInstance.acquireTokenPopup({
        ...accessTokenRequest,
        account
      })
      return tokenResponse.accessToken
    }
  }
}

async function getErrorMessage(response: Response): Promise<string> {
  let message = `API error (${response.statusText}): `

  const errorText = await response.text()
  if (errorText) {
    let errorJson
    try {
      errorJson = JSON.parse(errorText)
      if (errorJson?.detail) {
        if (typeof errorJson.detail === 'string') {
          message += errorJson.detail
        } else {
          message += JSON.stringify(errorJson.detail)
        }
      } else if (errorJson?.message) {
        message += errorJson.message
      } else {
        message += unknownError
      }
    } catch {
      message += unknownError
    }
  } else {
    message += unknownError
  }

  return message
}

export async function callApi(path: string, method = 'GET', body?: object) {
  const token = await getAccessToken()

  const response = await fetch(apiBaseUrl + path, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    method,
    body: body ? JSON.stringify(body) : null
  })

  if (!response.ok) {
    const message = await getErrorMessage(response)
    if (response.status === 503) {
      throw new RetriableError(message)
    } else {
      throw new FatalError(message)
    }
  }

  return response
}

export async function streamApi(
  path: string,
  messageHandler: (msg: EventSourceMessage) => void,
  fatalErrorHandler: (err: Error) => void,
  abortControllerRef: AbortController,
  maxRetries = 3
) {
  let retries = 0

  async function startStream() {
    const token = await getAccessToken()

    fetchEventSource(apiBaseUrl + path, {
      headers: {
        Authorization: `Bearer ${token}`
      },
      signal: abortControllerRef.signal,
      async onopen(response) {
        if (abortControllerRef.signal.aborted) {
          console.log('Stream aborted before open')
          throw new AbortedError()
        }
        console.log('Stream opened', response)
        if (!response.ok) {
          const message = await getErrorMessage(response)
          if (response.status === 503) {
            throw new RetriableError(message)
          } else {
            throw new FatalError(message)
          }
        }
      },
      onmessage(msg) {
        console.log('Message:', msg)
        messageHandler(msg)
      },
      onclose() {
        console.log('Stream closed')
      },
      onerror(err) {
        console.error('Stream error', err)
        // If the error is retriable, attempt to retry
        if (err instanceof RetriableError && retries < maxRetries) {
          retries++
          console.log(`Retrying stream... (${retries}/${maxRetries})`)
          startStream()
        } else {
          throw err
        }
      }
    }).catch(fatalErrorHandler)
  }

  startStream()
}

export async function getAgents() {
  try {
    const response = await callApi(agentsPath);
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to fetch agents.');
    }
    return response.json();
  } catch (error) {
    console.error('Error fetching agents:', error);
    throw error;
  }
}

export async function addAgent(agent: { name: string; guideline_prompt: string; type: string; }) {
  try {
    const response = await callApi(agentsPath, 'POST', agent);
    if (response.status === 201) {
      return response.json();
    }
    const errorData = await response.json();
    throw new Error(errorData.detail?.description || 'Failed to add agent.');
  } catch (error) {
    console.error('Error adding agent:', error);
    throw error;
  }
}

export async function updateAgent(
  agentId: string,
  agent: { name: string; guideline_prompt: string; type: string; }
) {
  try {
    const response = await callApi(`${agentsPath}/${agentId}`, 'PATCH', agent);
    if (response.ok) {
      return response.json();
    }
    const errorData = await response.json();
    throw new Error(errorData.detail?.description || 'Failed to update agent.');
  } catch (error) {
    console.error('Error updating agent:', error);
    throw error;
  }
}

export async function deleteAgent(id: string) {
  try {
    const response = await callApi(`${agentsPath}/${id}`, 'DELETE');
    if (response.status === 204) {
      return { message: 'Agent deleted successfully' };
    }
    const errorData = await response.json();
    throw new Error(errorData.detail || 'Failed to delete agent.');
  } catch (error) {
    console.error('Error deleting agent:', error);
    throw error;
  }
}

export async function getSettings() {
  try {
    const response = await callApi('admin/settings/');
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail?.description || 'Failed to fetch settings.');
    }
    return response.json();
  } catch (error) {
    console.error('Error fetching settings:', error);
    throw error;
  }
}

export async function addSetting(setting: { name: string; value: string }) {
  try {
    const response = await callApi('admin/settings/', 'POST', setting);
    if (response.status === 201) {
      return response.json();
    }
    const errorData = await response.json();
    throw new Error(errorData.detail?.description || 'Failed to add setting.');
  } catch (error) {
    console.error('Error adding setting:', error);
    throw error;
  }
}

export async function deleteSetting(name: string) {
  try {
    const response = await callApi(`admin/settings/${name}`, 'DELETE');
    if (response.status === 204) {
      return { message: 'Setting deleted successfully' };
    }
    const errorData = await response.json();
    throw new Error(errorData.detail?.description || 'Failed to delete setting.');
  } catch (error) {
    console.error('Error deleting setting:', error);
    throw error;
  }
}
