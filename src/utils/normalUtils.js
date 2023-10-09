import secrets from '../secrets.js';
export const removeTrailingSlash = (url) => {
  return url.endsWith('/') ? url.slice(0, -1) : url;
};

export const API_BASE_URL = secrets.API_BASE_URL || 'http://localhost:4000';

export const createSignerRequest = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/create_signer`, {
      method: 'POST',
    });
    return await response.json();
  } catch (error) {
    console.error('Error in createSignerRequest:', error);
    throw error;
  }
};

export const getSignerRequest = async (signer_uuid) => {
  console.log('signer_uuid:', signer_uuid);
  try {
    const response = await fetch(
      `${API_BASE_URL}/get_signer?signer_uuid=${signer_uuid}`
    );
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error in getSignerRequest:', error);
    throw error;
  }
};

export const createCastRequest = async (body) => {
  if (!body) throw new Error('No body provided to createCastRequest');
  try {
    const response = await fetch(`${API_BASE_URL}/create_cast`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    return await response.json();
  } catch (error) {
    console.error('Error in createCastRequest:', error);
    throw error;
  }
};
