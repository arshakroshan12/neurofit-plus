/**
 * API service for NeuroFit+ backend
 */
const BACKEND_URL = "http://localhost:8000";

export const predictFatigue = async (sessionData) => {
  const response = await fetch(`${BACKEND_URL}/predict_fatigue`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(sessionData),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
  }

  return await response.json();
};

export const saveSession = async (sessionData) => {
  const response = await fetch(`${BACKEND_URL}/save_session`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(sessionData),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
  }

  return await response.json();
};
